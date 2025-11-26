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
        },
        "player",
    ]);

    // Animation update function
    function updatePlayerAnimation(dt) {
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
            player.spinAngle += dt() * 720; // 720 degrees per second for fast spin
            player.angle = player.spinAngle;
            if (player.spinAngle >= 360) {
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

        // Camera follows player horizontally and vertically
        camPos(vec2(player.pos.x, player.pos.y));

        // Reset if player falls
        if (player.pos.y > 1000) {
            go("game", level);
        }
    });

    // Left movement
    onKeyDown("left", () => {
        player.move(-player.speed, 0);
        player.facingRight = false;
    });

    onKeyDown("a", () => {
        player.move(-player.speed, 0);
        player.facingRight = false;
    });

    // Right movement
    onKeyDown("right", () => {
        player.move(player.speed, 0);
        player.facingRight = true;
    });

    onKeyDown("d", () => {
        player.move(player.speed, 0);
        player.facingRight = true;
    });

    // Jump helper function with double jump support
    function performJump() {
        if (player.isGrounded()) {
            player.jump(player.jumpHeight);
            player.hasDoubleJump = true; // reset double jump on ground jump
        } else if (player.hasDoubleJump) {
            // Double jump at 65% height
            player.jump(player.jumpHeight * 0.65);
            player.hasDoubleJump = false;
            player.isDoubleJumping = true;
            player.spinAngle = 0;
        }
    }

    // Jump
    onKeyPress("space", performJump);
    onKeyPress("up", performJump);
    onKeyPress("w", performJump);

    // Squat/Crouch
    onKeyDown("down", () => {
        if (!player.isSquatting && player.isGrounded()) {
            player.isSquatting = true;
        }
    });

    onKeyDown("s", () => {
        if (!player.isSquatting && player.isGrounded()) {
            player.isSquatting = true;
        }
    });

    onKeyRelease("down", () => {
        if (player.isSquatting) {
            player.isSquatting = false;
        }
    });

    onKeyRelease("s", () => {
        if (player.isSquatting) {
            player.isSquatting = false;
        }
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

    // Collect tickets on collision
    player.onCollide("ticket", (ticket) => {
        ticketsCollected++;
        ticketDisplay.text = "Tickets: " + ticketsCollected;
        destroy(ticket);
    });

    // Spin all tickets
    onUpdate("ticket", (ticket) => {
        ticket.spinTimer += dt() * ticket.spinSpeed;
        // Use cosine to create a smooth scale oscillation (1 to -1 to 1)
        ticket.scaleTo(0.06 * Math.cos(ticket.spinTimer), 0.06);
    });
});

// Start the game
go("game", 0);