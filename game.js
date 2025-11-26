// Initialize Kaboom
kaboom({
    width: 1280,
    height: 720,
    background: [134, 185, 255],
});

// Load sprite animations
const SPRITE_PATH = "assets/Stick Figure Character Sprites 2D/Fighter sprites/";

// Load idle animation (8 frames)
loadSprite("idle", SPRITE_PATH + "fighter_Idle_0001.png");
for (let i = 1; i <= 8; i++) {
    loadSprite(`idle_${i}`, SPRITE_PATH + `fighter_Idle_000${i}.png`);
}

// Load run animation (8 frames)
for (let i = 17; i <= 24; i++) {
    loadSprite(`run_${i - 16}`, SPRITE_PATH + `fighter_run_00${i}.png`);
}

// Load jump animation (5 frames)
for (let i = 43; i <= 47; i++) {
    loadSprite(`jump_${i - 42}`, SPRITE_PATH + `fighter_jump_00${i}.png`);
}

// Load slide/crouch animation (8 frames)
for (let i = 25; i <= 32; i++) {
    loadSprite(`slide_${i - 24}`, SPRITE_PATH + `fighter_slide_00${i}.png`);
}

// Load as sprite sheets with animations
loadSprite("player", SPRITE_PATH + "fighter_Idle_0001.png", {
    sliceX: 1,
    sliceY: 1,
    anims: {
        idle: { from: 0, to: 0 },
    },
});

// Actually load all frames into a single spritesheet
loadSprite("hero", SPRITE_PATH + "fighter_Idle_0001.png");

// Load ticket sprite
loadSprite("ticket", "assets/ticket.png");

// Load death sprite
loadSprite("death", SPRITE_PATH + "fighter_death_0057.png");

// Load sounds
loadSound("jump", "assets/cartoon-jump-6462.mp3");
loadSound("doubleJump", "assets/double-jump.mp3");
loadSound("land", "assets/land-81509.mp3");
loadSound("run", "assets/running-1-6846.mp3");
loadSound("hurt", "assets/male_hurt7-48124.mp3");
loadSound("ticket", "assets/checkin_alert_tone.mp3");
loadSound("dead", "assets/dead.mp3");
loadSound("gameover", "assets/game-over-39-199830.mp3");

// Define the level
const LEVELS = [
    [
        "                                                                                ",
        "                                 T T T                                          ",
        "                                ======                                          ",
        "                                                                                ",
        "          T T                                      T T                          ",
        "         =====                                    =====                         ",
        "                                                                                ",
        "                       T T T T                                                  ",
        "                      =========                                                 ",
        "                                                                                ",
        "    T T T                              T T T                                    ",
        "   ======                             ======                                    ",
        "                                                                                ",
        "                    T T T T                                                     ",
        "                   ========                                                     ",
        "                                           T T                                  ",
        "                                          ====                                  ",
        "               T                                                                ",
        "              ===                                   T T T                       ",
        "                          T                              ===                    ",
        "                         ===                                                    ",
        "                                    ==   T          ==                          ",
        "        ===       T                                              T T T          ",
        "                    ==                                          ====            ",
        "   T T T                    ==                                                  ",
        "################################################################################",
        "################################################################################",
    ],
];

// Level configuration
const levelConfig = {
    tileWidth: 32,
    tileHeight: 32,
    tiles: {
        "=": () => [
            rect(32, 32),
            color(139, 69, 19),
            area(),
            body({ isStatic: true }),
            anchor("center"),
            "platform",
        ],
        "#": () => [
            rect(32, 32),
            color(34, 139, 34),
            area(),
            body({ isStatic: true }),
            anchor("center"),
            "ground",
        ],
        "T": () => [
            sprite("ticket"),
            area(),
            anchor("center"),
            scale(0.06),
            {
                spinTimer: 0,
                spinSpeed: 3,
            },
            "ticket",
        ],
    },
};

// Game scene
scene("game", (level = 0) => {
    // Set gravity
    setGravity(1600);

    // Score counter
    let ticketsCollected = 0;

    // Add the level
    const currentLevel = addLevel(LEVELS[level], levelConfig);

    // Add the player with sprite animations
    const player = add([
        pos(100, 700),
        sprite("idle_1"),
        area({ shape: new Rect(vec2(0), 40, 70), offset: vec2(0, 89) }),
        body(),
        anchor("center"),
        scale(0.33),
        rotate(0),
        {
            speed: 320,
            jumpHeight: 640,
            isSquatting: false,
            currentAnim: "idle",
            animFrame: 1,
            animTimer: 0,
            frameSpeed: 0.1, // seconds per frame
            facingRight: true,
            hasDoubleJump: true, // can double jump when true
            isDoubleJumping: false, // true during double jump spin
            spinAngle: 0, // rotation angle during double jump
            spinDirection: 1, // 1 for clockwise, -1 for counter-clockwise
            lives: 3,
            hp: 100,
            maxHp: 100,
            fallStartY: null,
            isDead: false,
            runSound: null,
            wasInAir: false,
        },
        "player",
    ]);

    // Animation update function
    function updatePlayerAnimation(dt) {
        // Don't update animation if player is dead
        if (player.isDead) return;

        player.animTimer += dt;

        if (player.animTimer >= player.frameSpeed) {
            player.animTimer = 0;

            let maxFrames = 8;
            let spritePrefix = "idle_";

            if (player.currentAnim === "run") {
                maxFrames = 8;
                spritePrefix = "run_";
                player.frameSpeed = 0.08;
            } else if (player.currentAnim === "jump") {
                maxFrames = 5;
                spritePrefix = "jump_";
                player.frameSpeed = 0.12;
            } else if (player.currentAnim === "slide") {
                maxFrames = 8;
                spritePrefix = "slide_";
                player.frameSpeed = 0.1;
            } else {
                // idle
                maxFrames = 8;
                spritePrefix = "idle_";
                player.frameSpeed = 0.12;
            }

            player.animFrame++;
            if (player.animFrame > maxFrames) {
                player.animFrame = 1;
            }

            player.use(sprite(spritePrefix + player.animFrame));
        }

        // Flip sprite based on direction
        if (player.facingRight) {
            player.flipX = false;
        } else {
            player.flipX = true;
        }
    }

    // Set animation state
    function setAnim(animName) {
        if (player.currentAnim !== animName) {
            player.currentAnim = animName;
            player.animFrame = 1;
            player.animTimer = 0;

            // Handle run sound
            if (animName === "run") {
                if (!player.runSound) {
                    player.runSound = play("run", { loop: true });
                }
            } else {
                if (player.runSound) {
                    player.runSound.stop();
                    player.runSound = null;
                }
            }
        }
    }

    // Update animation each frame
    onUpdate(() => {
        updatePlayerAnimation(dt());

        // Determine animation based on state
        if (!player.isGrounded()) {
            setAnim("jump");
        } else if (player.isSquatting) {
            setAnim("slide");
        } else if (isKeyDown("left") || isKeyDown("right") || isKeyDown("a") || isKeyDown("d")) {
            setAnim("run");
        } else {
            setAnim("idle");
        }

        // Handle double jump 360 spin
        if (player.isDoubleJumping) {
            player.use(sprite("jump_4")); // Use jump_4 sprite while spinning
            player.use(anchor(vec2(0, 0.35))); // Anchor at character's visual center
            // Use stored spin direction (captured at start of double jump)
            player.spinAngle += dt() * 720 * player.spinDirection; // 720 degrees per second for fast spin
            player.angle = player.spinAngle;
            if (Math.abs(player.spinAngle) >= 360) {
                player.angle = 0;
                player.use(anchor("center")); // Reset anchor
                player.isDoubleJumping = false;
            }
        }

        // Reset spin when landing
        if (player.isGrounded() && player.isDoubleJumping) {
            player.angle = 0;
            player.use(anchor("center")); // Reset anchor
            player.isDoubleJumping = false;
        }

        // Track fall damage and landing sound
        if (!player.isGrounded()) {
            // Player is in the air
            player.wasInAir = true;
            if (player.fallStartY === null) {
                player.fallStartY = player.pos.y;
            } else if (player.pos.y < player.fallStartY) {
                // Player went higher, update fall start
                player.fallStartY = player.pos.y;
            }
        } else {
            // Player landed
            if (player.fallStartY !== null) {
                const fallDistance = player.pos.y - player.fallStartY;

                // Play land sound if fell more than 150px
                if (player.wasInAir && !player.isDead && fallDistance > 150) {
                    play("land");
                }
                player.wasInAir = false;

                if (fallDistance > 300) {
                    // Base damage of 10hp for falling more than 300px
                    let damage = 10;
                    // Additional 5hp for every 20px beyond 300
                    const extraDistance = fallDistance - 300;
                    damage += Math.floor(extraDistance / 20) * 5;
                    takeDamage(damage);
                }
                player.fallStartY = null;
            }
        }

        // Camera follows player horizontally and vertically (but not when dead)
        if (!player.isDead) {
            camPos(vec2(player.pos.x, player.pos.y));
        }

        // Player falls off the map - lose a life
        if (player.pos.y > 1000 && !player.isDead) {
            player.isDead = true;
            player.hp = 0;
            takeDamage(0); // Trigger the wasted/death logic
        }
    });

    // Left movement
    onKeyDown("left", () => {
        if (player.isDead) return;
        player.move(-player.speed, 0);
        player.facingRight = false;
    });

    onKeyDown("a", () => {
        if (player.isDead) return;
        player.move(-player.speed, 0);
        player.facingRight = false;
    });

    // Right movement
    onKeyDown("right", () => {
        if (player.isDead) return;
        player.move(player.speed, 0);
        player.facingRight = true;
    });

    onKeyDown("d", () => {
        if (player.isDead) return;
        player.move(player.speed, 0);
        player.facingRight = true;
    });

    // Jump helper function with double jump support
    function performJump() {
        if (player.isDead) return;
        if (player.isGrounded()) {
            player.jump(player.jumpHeight);
            player.hasDoubleJump = true; // reset double jump on ground jump
            play("jump");
        } else if (player.hasDoubleJump) {
            // Double jump at 65% height
            player.jump(player.jumpHeight * 0.65);
            player.hasDoubleJump = false;
            player.isDoubleJumping = true;
            player.spinAngle = 0;
            // Capture spin direction at start: right = clockwise, left = counter-clockwise
            player.spinDirection = player.facingRight ? 1 : -1;
            play("doubleJump");
        }
    }

    // Jump
    onKeyPress("space", performJump);
    onKeyPress("up", performJump);
    onKeyPress("w", performJump);

    // Squat/Crouch
    onKeyDown("down", () => {
        if (player.isDead) return;
        if (!player.isSquatting && player.isGrounded()) {
            player.isSquatting = true;
        }
    });

    onKeyDown("s", () => {
        if (player.isDead) return;
        if (!player.isSquatting && player.isGrounded()) {
            player.isSquatting = true;
        }
    });

    onKeyRelease("down", () => {
        if (player.isDead) return;
        if (player.isSquatting) {
            player.isSquatting = false;
        }
    });

    onKeyRelease("s", () => {
        if (player.isDead) return;
        if (player.isSquatting) {
            player.isSquatting = false;
        }
    });

    // Test key - press L to take 10 damage
    onKeyPress("l", () => {
        if (player.isDead) return;
        takeDamage(10);
    });

    // Camera scale
    camScale(vec2(1.5));

    // Add instructions
    add([
        text("Arrow Keys/WASD: Move | Space/Up/W: Jump | Down/S: Squat", {
            size: 16,
        }),
        pos(640, 20),
        anchor("center"),
        fixed(),
        color(255, 255, 255),
    ]);

    // Add ticket counter display
    const ticketDisplay = add([
        text("Tickets: 0", {
            size: 24,
        }),
        pos(50, 60),
        fixed(),
        color(255, 215, 0),
        "ticketDisplay",
    ]);

    // Add lives display
    const livesDisplay = add([
        text("Lives: 3", {
            size: 24,
        }),
        pos(50, 90),
        fixed(),
        color(255, 100, 100),
        "livesDisplay",
    ]);

    // Add HP bar background
    add([
        rect(104, 14),
        pos(48, 118),
        fixed(),
        color(50, 50, 50),
        "hpBarBg",
    ]);

    // Add HP bar
    const hpBar = add([
        rect(100, 10),
        pos(50, 120),
        fixed(),
        color(0, 255, 0),
        "hpBar",
    ]);

    // Add HP text
    const hpText = add([
        text("HP: 100", {
            size: 16,
        }),
        pos(160, 118),
        fixed(),
        color(255, 255, 255),
        "hpText",
    ]);

    // Function to take damage
    function takeDamage(amount) {
        player.hp -= amount;

        if (player.hp <= 0) {
            play("dead");
            player.lives--;
            player.isDead = true;
            livesDisplay.text = "Lives: " + player.lives;

            // Change to death sprite
            player.use(sprite("death"));

            if (player.lives <= 0) {
                // Game over
                go("gameover");
            } else {
                // Flash red screen with WASTED text
                const redOverlay = add([
                    rect(width(), height()),
                    pos(camPos()),
                    anchor("center"),
                    color(255, 0, 0),
                    opacity(0.6),
                    z(100),
                    "wastedOverlay",
                ]);

                const wastedText = add([
                    text("WASTED", {
                        size: 80,
                    }),
                    pos(camPos()),
                    anchor("center"),
                    color(255, 255, 255),
                    z(101),
                    "wastedText",
                ]);

                // After 1.5 seconds, remove overlay and respawn
                wait(1.5, () => {
                    destroy(redOverlay);
                    destroy(wastedText);
                    // Reset HP for next life and respawn at initial position
                    player.hp = player.maxHp;
                    player.pos.x = 100;
                    player.pos.y = 700;
                    player.fallStartY = null;
                    player.isDead = false;
                    // Reset sprite to idle
                    player.use(sprite("idle_1"));
                    // Update HP bar
                    hpBar.width = 100;
                    hpBar.color = rgb(0, 255, 0);
                    hpText.text = "HP: 100";
                });
            }
        }

        // Update HP bar and text
        hpBar.width = (player.hp / player.maxHp) * 100;
        hpText.text = "HP: " + player.hp;

        // Change HP bar color based on health
        if (player.hp > 60) {
            hpBar.color = rgb(0, 255, 0); // Green
        } else if (player.hp > 30) {
            hpBar.color = rgb(255, 255, 0); // Yellow
        } else {
            hpBar.color = rgb(255, 0, 0); // Red
        }

        // Play hurt sound only if still alive
        if (player.hp > 0) {
            play("hurt");
        }
    }

    // Collect tickets on collision
    player.onCollide("ticket", (ticket) => {
        ticketsCollected++;
        ticketDisplay.text = "Tickets: " + ticketsCollected;
        play("ticket");
        destroy(ticket);
    });

    // Spin all tickets
    onUpdate("ticket", (ticket) => {
        ticket.spinTimer += dt() * ticket.spinSpeed;
        // Use cosine to create a smooth scale oscillation (1 to -1 to 1)
        ticket.scaleTo(0.06 * Math.cos(ticket.spinTimer), 0.06);
    });
});

// Game over scene
scene("gameover", () => {
    play("gameover");

    add([
        rect(width(), height()),
        color(0, 0, 0),
        fixed(),
    ]);

    add([
        text("GAME OVER", {
            size: 64,
        }),
        pos(center()),
        anchor("center"),
        color(255, 0, 0),
    ]);

    add([
        text("Press SPACE to restart", {
            size: 24,
        }),
        pos(center().x, center().y + 60),
        anchor("center"),
        color(255, 255, 255),
    ]);

    onKeyPress("space", () => {
        go("game", 0);
    });
});

// Start the game
go("game", 0);