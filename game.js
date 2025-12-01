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

// Load parachute sprite
loadSprite("parachute", SPRITE_PATH + "fighter_parachute.png");

// Load high vibes and george sprites
loadSprite("highvibes", "assets/high-vibes.png");
loadSprite("george", "assets/george.png");
loadSprite("tesco", "assets/tesco.png");

// Load sounds
loadSound("jump", "assets/cartoon-jump-6462.mp3");
loadSound("doubleJump", "assets/double-jump.mp3");
loadSound("land", "assets/land-81509.mp3");
loadSound("run", "assets/running-1-6846.mp3");
loadSound("hurt", "assets/male_hurt7-48124.mp3");
loadSound("ticket", "assets/checkin_alert_tone.mp3");
loadSound("dead", "assets/dead.mp3");
loadSound("gameover", "assets/game-over-39-199830.mp3");

// Player's money (persists across levels)
let playerMoney = 0;

// Player's inventory (persists across levels)
let hasParachute = false;

// Track collected ticket positions per level (persists across scene transitions)
let collectedTicketsPerLevel = {};

// Define the level
const LEVELS = [
    [
        "                                                                                ",
        "                                 T T T                                          ",
        "                                ======                               B          ",
        "                                                                                ",
        "          T T                                      T T          =====           ",
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
        "               T                                                      T         ",
        "              ===                                   T T T       =======         ",
        "                          T                              ===                    ",
        "                         ===                                                    ",
        "                                    ==   T          ==                          ",
        "        ===       T                                              T T T          ",
        "                    ==                                          ====            ",
        "     T T     TTT             ==                                                 ",
        "################################################################################",
        "################################################################################",
    ],
    [
        "                                                   B                            ",
        "                                                 ======                         ",
        "    T T T                                                          T T T        ",
        "   ======                                                         ======        ",
        "                                                                                ",
        "                  T T T                              T T T                      ",
        "                 ======                             ======                      ",
        "                                                                                ",
        "         T T T T                    T T T T                                     ",
        "        =========                  =========                                    ",
        "                                                                                ",
        "                         T T T T T                                              ",
        "                        ===========                                             ",
        "                                                                                ",
        "    T T                                                      T T                ",
        "   ====                                                     ====                ",
        "                                                                                ",
        "              T T T                              T T T                          ",
        "             ======                             ======                          ",
        "                                                                          S     ",
        "                          T T T T T T                                           ",
        "                         ============                               =======     ",
        "        ===                                  ===                  T             ",
        "                  ===            ===                            ===             ",
        "     T T     T T T      ===              ===      T T T                         ",
        "################################################################################",
        "################################################################################",
    ],
];

// Level height in rows
const LEVEL_HEIGHT = LEVELS[0].length;
// Ground row index (0-indexed from top) - the first # row
const GROUND_ROW = LEVEL_HEIGHT - 2; // -2 because there are 2 rows of ground
// Player spawn Y position (above the ground)
const PLAYER_SPAWN_Y = GROUND_ROW * 32 - 50;

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
        // Tickets are spawned manually in the game scene to support persistence
        "T": () => [],
        "B": () => [
            sprite("highvibes"),
            area(),
            anchor("center"),
            scale(0.15),
            z(10),
            "levelEnd",
        ],
        "S": () => [
            sprite("tesco"),
            area(),
            anchor("center"),
            scale(0.15),
            z(10),
            "tescoStore",
        ],
    },
};

// Game scene
scene("game", (level = 0, restoreX = null, restoreY = null, restoreTickets = null, restoreLives = null, restoreHp = null) => {
    // Set gravity
    setGravity(1600);

    // Score counter
    let ticketsCollected = restoreTickets !== null ? restoreTickets : 0;

    // Initialize collected tickets for this level if not exists
    if (!collectedTicketsPerLevel[level]) {
        collectedTicketsPerLevel[level] = [];
    }

    // Count total tickets in level
    let totalTickets = 0;
    for (const row of LEVELS[level]) {
        for (const char of row) {
            if (char === "T") totalTickets++;
        }
    }

    // Add the level
    const currentLevel = addLevel(LEVELS[level], levelConfig);

    // Manually spawn tickets, skipping already collected ones
    const tileWidth = 32;
    const tileHeight = 32;
    for (let row = 0; row < LEVELS[level].length; row++) {
        for (let col = 0; col < LEVELS[level][row].length; col++) {
            if (LEVELS[level][row][col] === "T") {
                const ticketX = col * tileWidth;
                const ticketY = row * tileHeight;
                const ticketKey = `${ticketX},${ticketY}`;

                // Only spawn if not already collected
                if (!collectedTicketsPerLevel[level].includes(ticketKey)) {
                    add([
                        sprite("ticket"),
                        pos(ticketX, ticketY),
                        area(),
                        anchor("center"),
                        scale(0.06),
                        {
                            spinTimer: 0,
                            spinSpeed: 3,
                        },
                        "ticket",
                    ]);
                }
            }
        }
    }

    // Add the player with sprite animations
    const startX = restoreX !== null ? restoreX : 100;
    const startY = restoreY !== null ? restoreY : PLAYER_SPAWN_Y;
    const startLives = restoreLives !== null ? restoreLives : 3;
    const startHp = restoreHp !== null ? restoreHp : 100;

    const player = add([
        pos(startX, startY),
        sprite("idle_1"),
        area({ shape: new Rect(vec2(0), 40, 70), offset: vec2(0, 35) }),
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
            lives: startLives,
            hp: startHp,
            maxHp: 100,
            fallStartY: null,
            isDead: false,
            runSound: null,
            wasInAir: false,
            parachuteDeployed: false,
            parachuteAttempting: false,
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

        // Parachute mechanics
        if (hasParachute && !player.isGrounded() && isKeyDown("p") && !player.isDead) {
            // Check if we need to roll for parachute failure (only on new press)
            if (!player.parachuteDeployed && !player.parachuteAttempting) {
                player.parachuteAttempting = true;
                // 20% chance to fail
                if (Math.random() < 0.2) {
                    // Show failure message
                    const failMsg = add([
                        text("PARACHUTE FAILED!", { size: 32 }),
                        pos(player.pos.x, player.pos.y - 60),
                        anchor("center"),
                        color(255, 0, 0),
                        z(100),
                        lifespan(1),
                        move(UP, 50),
                    ]);
                } else {
                    player.parachuteDeployed = true;
                }
            }

            // If parachute deployed successfully
            if (player.parachuteDeployed) {
                // Deploy parachute - slow down fall
                if (player.vel && player.vel.y > 100) {
                    player.vel.y = 100; // Limit fall speed when parachute deployed
                }
                // Reset fall start to current position so no fall damage accumulates
                player.fallStartY = player.pos.y;
                // Use parachute sprite and flip based on facing direction
                player.use(sprite("parachute"));
                player.flipX = player.facingRight; // Flip when facing right
            }
        } else {
            // Reset attempt state when P is released (allows retry)
            if (!isKeyDown("p")) {
                player.parachuteAttempting = false;
            }
            if (player.isGrounded()) {
                player.parachuteDeployed = false;
                player.parachuteAttempting = false;
            }
        }

        // Clamp maximum fall velocity to prevent falling through platforms
        const MAX_FALL_SPEED = 600;
        if (player.vel && player.vel.y > MAX_FALL_SPEED) {
            player.vel.y = MAX_FALL_SPEED;
        }

        // Track fall damage and landing sound
        if (!player.isGrounded()) {
            // Player is in the air
            player.wasInAir = true;
            if (player.fallStartY === null) {
                player.fallStartY = player.pos.y;
            } else if (player.pos.y < player.fallStartY) {
                // Player went higher (Y decreased), update fall start
                player.fallStartY = player.pos.y;
            }
        } else {
            // Player landed
            if (player.fallStartY !== null) {
                const fallDistance = player.pos.y - player.fallStartY;

                // Play land sound if fell more than 150px (not if parachute was just deployed)
                if (player.wasInAir && !player.isDead && fallDistance > 150 && !player.parachuteDeployed) {
                    play("land");
                }
                player.wasInAir = false;

                if (fallDistance > 300 && !player.parachuteDeployed) {
                    // Base damage of 10hp for falling more than 300px
                    let damage = 10;
                    // Additional 5hp for every 20px beyond 300
                    const extraDistance = fallDistance - 300;
                    damage += Math.floor(extraDistance / 20) * 5;
                    takeDamage(damage);
                }
                player.fallStartY = null;
                player.parachuteDeployed = false;
            }
        }

        // Camera follows player horizontally and vertically (but not when dead)
        if (!player.isDead) {
            camPos(vec2(player.pos.x, player.pos.y));
        }

        // Player falls off the map - lose a life (fell below ground level)
        if (player.pos.y > LEVEL_HEIGHT * 32 + 100 && !player.isDead) {
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
            // Double jump at 75% height
            player.jump(player.jumpHeight * 0.75);
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

    // Add ticket counter display
    const ticketDisplay = add([
        text("Tickets: " + ticketsCollected + " / " + totalTickets, {
            size: 24,
        }),
        pos(50, 30),
        fixed(),
        color(255, 215, 0),
        "ticketDisplay",
    ]);

    // Add money display
    const moneyDisplay = add([
        text("Money: £" + playerMoney.toFixed(2), {
            size: 24,
        }),
        pos(50, 60),
        fixed(),
        color(0, 0, 0),
        "moneyDisplay",
    ]);

    // Add lives display
    const livesDisplay = add([
        text("Lives: " + startLives, {
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
    const hpBarWidth = (startHp / 100) * 100;
    const hpBarColor = startHp > 60 ? rgb(0, 255, 0) : startHp > 30 ? rgb(255, 255, 0) : rgb(255, 0, 0);
    const hpBar = add([
        rect(hpBarWidth, 10),
        pos(50, 120),
        fixed(),
        color(hpBarColor),
        "hpBar",
    ]);

    // Add HP text
    const hpText = add([
        text("HP: " + startHp, {
            size: 16,
        }),
        pos(160, 118),
        fixed(),
        color(255, 255, 255),
        "hpText",
    ]);

    // Add parachute indicator if owned
    if (hasParachute) {
        add([
            text("[P] Parachute", { size: 18 }),
            pos(50, 145),
            fixed(),
            color(200, 200, 255),
            "parachuteIndicator",
        ]);
    }

    // Find positions of B (Box Office) and S (Tesco) in the level
    let boxOfficePos = null;
    let tescoPos = null;
    for (let row = 0; row < LEVELS[level].length; row++) {
        for (let col = 0; col < LEVELS[level][row].length; col++) {
            const char = LEVELS[level][row][col];
            if (char === "B") {
                boxOfficePos = vec2(col * 32 + 16, row * 32 + 16);
            } else if (char === "S") {
                tescoPos = vec2(col * 32 + 16, row * 32 + 16);
            }
        }
    }

    // Create directional arrow indicators
    const arrowSize = 30;
    const arrowPadding = 50;

    // Box Office arrow (pink/magenta for High Vibes)
    const boxOfficeArrow = add([
        text("B ►", { size: arrowSize }),
        pos(0, 0),
        fixed(),
        color(255, 105, 180),
        z(50),
        opacity(0.9),
        { targetPos: boxOfficePos, label: "B", flashTimer: 0 },
        "dirArrow",
    ]);

    // Tesco arrow (blue for Tesco)
    const tescoArrow = add([
        text("T ►", { size: arrowSize }),
        pos(0, 0),
        fixed(),
        color(0, 100, 200),
        z(50),
        opacity(0.9),
        { targetPos: tescoPos, label: "T", flashTimer: 0 },
        "dirArrow",
    ]);

    // Update directional arrows each frame
    onUpdate("dirArrow", (arrow) => {
        if (!arrow.targetPos) {
            arrow.hidden = true;
            return;
        }

        // Get camera position and screen bounds
        const cam = camPos();
        const screenW = width() / camScale().x;
        const screenH = height() / camScale().y;

        // Calculate screen bounds in world coordinates
        const leftBound = cam.x - screenW / 2;
        const rightBound = cam.x + screenW / 2;
        const topBound = cam.y - screenH / 2;
        const bottomBound = cam.y + screenH / 2;

        // Check if target is visible on screen (with some margin)
        const margin = 60;
        const targetVisible = (
            arrow.targetPos.x > leftBound + margin &&
            arrow.targetPos.x < rightBound - margin &&
            arrow.targetPos.y > topBound + margin &&
            arrow.targetPos.y < bottomBound - margin
        );

        if (targetVisible) {
            arrow.hidden = true;
            return;
        }

        arrow.hidden = false;

        // Calculate direction from center of screen to target
        const dx = arrow.targetPos.x - cam.x;
        const dy = arrow.targetPos.y - cam.y;
        const angle = Math.atan2(dy, dx);

        // Determine which edge to place the arrow on
        // and calculate the arrow character
        let arrowChar = "►";
        let screenX, screenY;

        // Calculate intersection with screen edges
        const halfW = width() / 2 - arrowPadding;
        const halfH = height() / 2 - arrowPadding;

        // Use angle to determine primary direction and position
        if (Math.abs(dx) > Math.abs(dy)) {
            // Primarily horizontal
            if (dx > 0) {
                // Target is to the right
                arrowChar = "►";
                screenX = width() - arrowPadding;
                screenY = height() / 2 + (dy / dx) * halfW;
            } else {
                // Target is to the left
                arrowChar = "◄";
                screenX = arrowPadding;
                screenY = height() / 2 - (dy / dx) * halfW;
            }
        } else {
            // Primarily vertical
            if (dy > 0) {
                // Target is below
                arrowChar = "▼";
                screenY = height() - arrowPadding;
                screenX = width() / 2 + (dx / dy) * halfH;
            } else {
                // Target is above
                arrowChar = "▲";
                screenY = 10;
                screenX = width() / 2 - (dx / dy) * halfH;
            }
        }

        // Clamp to screen bounds - top edge at 10px for vertical arrows
        screenX = Math.max(arrowPadding, Math.min(width() - arrowPadding, screenX));
        screenY = Math.max(10, Math.min(height() - arrowPadding, screenY));

        // Update arrow (no distance numbers)
        arrow.text = arrow.label + " " + arrowChar;
        arrow.pos.x = screenX;
        arrow.pos.y = screenY;

        // Flash effect
        arrow.flashTimer += dt() * 6;
        arrow.opacity = 0.5 + Math.sin(arrow.flashTimer) * 0.5;
    });

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
                    // Lose parachute on death
                    hasParachute = false;
                    // Reset HP for next life and respawn at initial position
                    player.hp = player.maxHp;
                    player.pos.x = 100;
                    player.pos.y = PLAYER_SPAWN_Y;
                    // Stop all velocity so player doesn't keep falling
                    player.vel = vec2(0, 0);
                    player.fallStartY = null;
                    player.isDead = false;
                    // Reset sprite to idle
                    player.use(sprite("idle_1"));
                    // Update HP bar
                    hpBar.width = 100;
                    hpBar.color = rgb(0, 255, 0);
                    hpText.text = "HP: 100";
                    // Reload scene to update parachute indicator
                    go("game", level, 100, PLAYER_SPAWN_Y, ticketsCollected, player.lives, player.maxHp);
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
        // Store the ticket's position in the global tracker
        const ticketKey = `${Math.round(ticket.pos.x)},${Math.round(ticket.pos.y)}`;
        collectedTicketsPerLevel[level].push(ticketKey);
        ticketsCollected++;
        ticketDisplay.text = "Tickets: " + ticketsCollected + " / " + totalTickets;
        play("ticket");
        destroy(ticket);
    });

    // Level complete on collision with high vibes
    player.onCollide("levelEnd", () => {
        // Stop run sound if playing
        if (player.runSound) {
            player.runSound.stop();
            player.runSound = null;
        }
        go("store", ticketsCollected, level);
    });

    // Enter Tesco store
    player.onCollide("tescoStore", () => {
        // Stop run sound if playing
        if (player.runSound) {
            player.runSound.stop();
            player.runSound = null;
        }
        go("tesco", level, player.pos.x, player.pos.y, ticketsCollected, player.lives, player.hp);
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
        // Reset collected tickets for fresh game
        collectedTicketsPerLevel = {};
        go("game", 0);
    });
});

// Store scene
scene("store", (tickets = 0, level = 0) => {
    // Price per ticket increases with level
    const pricePerTicket = 1.00 + (level * 0.50);
    const totalValue = (tickets * pricePerTicket).toFixed(2);
    // Store background
    add([
        rect(width(), height()),
        color(255, 200, 220),
        fixed(),
    ]);

    // Store title
    add([
        text("High Vibes Box Office", {
            size: 56,
            font: "sans-serif",
        }),
        pos(center().x, 80),
        anchor("center"),
        color(255, 105, 180),
    ]);

    // George standing in the store
    add([
        sprite("george"),
        pos(center().x - 200, center().y + 100),
        anchor("center"),
        scale(0.5),
    ]);

    // George's congratulations message
    add([
        text("Congrats! You collected " + tickets + " tickets!", {
            size: 28,
        }),
        pos(center().x + 280, 200),
        anchor("center"),
        color(30, 30, 80),
    ]);

    // George's offer
    add([
        text("I can sell them for you in exchange for money.", {
            size: 24,
        }),
        pos(center().x + 280, 250),
        anchor("center"),
        color(60, 60, 100),
    ]);

    // Ticket count display
    add([
        sprite("ticket"),
        pos(center().x + 220, 320),
        anchor("center"),
        scale(0.08),
    ]);

    add([
        text("x " + tickets, {
            size: 32,
        }),
        pos(center().x + 280, 320),
        anchor("center"),
        color(180, 50, 100),
    ]);

    // Price info
    add([
        text("Price per ticket: £" + pricePerTicket.toFixed(2), {
            size: 22,
        }),
        pos(center().x + 280, 380),
        anchor("center"),
        color(60, 60, 100),
    ]);

    // Total value
    add([
        text("Total value: £" + totalValue, {
            size: 28,
        }),
        pos(center().x + 280, 420),
        anchor("center"),
        color(0, 120, 0),
    ]);

    // Question
    add([
        text("Do you want to sell your tickets?", {
            size: 26,
        }),
        pos(center().x + 280, 480),
        anchor("center"),
        color(30, 30, 80),
    ]);

    // Yes button
    const yesBtn = add([
        rect(120, 50),
        pos(center().x + 200, 550),
        anchor("center"),
        color(0, 150, 0),
        area(),
        "yesBtn",
    ]);

    add([
        text("YES", {
            size: 24,
        }),
        pos(center().x + 200, 550),
        anchor("center"),
        color(255, 255, 255),
    ]);

    // No button
    const noBtn = add([
        rect(120, 50),
        pos(center().x + 360, 550),
        anchor("center"),
        color(150, 0, 0),
        area(),
        "noBtn",
    ]);

    add([
        text("NO", {
            size: 24,
        }),
        pos(center().x + 360, 550),
        anchor("center"),
        color(255, 255, 255),
    ]);

    // Click handlers
    onClick("yesBtn", () => {
        playerMoney += parseFloat(totalValue);
        if (level + 1 < LEVELS.length) {
            go("game", level + 1);
        } else {
            go("win");
        }
    });

    onClick("noBtn", () => {
        if (level + 1 < LEVELS.length) {
            go("game", level + 1);
        } else {
            go("win");
        }
    });
});

// Tesco store scene
scene("tesco", (level, playerX, playerY, tickets, lives, hp) => {
    // Store background
    add([
        rect(width(), height()),
        color(200, 220, 255),
        fixed(),
    ]);

    // Store title
    add([
        text("TESCO", {
            size: 64,
        }),
        pos(center().x, 80),
        anchor("center"),
        color(0, 70, 150),
    ]);

    // Money display (will be updated on purchase)
    const moneyText = add([
        text("Your Money: £" + playerMoney.toFixed(2), {
            size: 32,
        }),
        pos(center().x, 150),
        anchor("center"),
        color(0, 150, 0),
    ]);

    // Store message
    add([
        text("Welcome to Tesco!", {
            size: 28,
        }),
        pos(center().x, 220),
        anchor("center"),
        color(30, 30, 80),
    ]);

    // Parachute item
    const parachutePrice = 10.00;

    // Parachute box (background - no area so it doesn't block clicks)
    add([
        rect(300, 120),
        pos(center().x - 50, 340),
        anchor("center"),
        color(240, 240, 250),
        outline(2, rgb(100, 100, 150)),
    ]);

    // Parachute icon
    add([
        sprite("parachute"),
        pos(center().x - 130, 340),
        anchor("center"),
        scale(0.25),
    ]);

    // Parachute name and description
    add([
        text("Parachute", { size: 28 }),
        pos(center().x - 30, 310),
        anchor("center"),
        color(30, 30, 80),
    ]);

    add([
        text("Hold P while falling", { size: 16 }),
        pos(center().x - 30, 345),
        anchor("center"),
        color(80, 80, 120),
    ]);

    // Parachute price
    add([
        text("£" + parachutePrice.toFixed(2), { size: 24 }),
        pos(center().x - 30, 375),
        anchor("center"),
        color(0, 120, 0),
    ]);

    // Buy button or owned status - positioned to the right, outside the info box
    if (hasParachute) {
        add([
            rect(100, 50),
            pos(center().x + 130, 340),
            anchor("center"),
            color(100, 100, 100),
        ]);
        add([
            text("OWNED", { size: 18 }),
            pos(center().x + 130, 340),
            anchor("center"),
            color(255, 255, 255),
        ]);
    } else {
        add([
            rect(100, 50),
            pos(center().x + 130, 340),
            anchor("center"),
            color(playerMoney >= parachutePrice ? rgb(0, 150, 0) : rgb(150, 150, 150)),
            area(),
            z(10),
            "buyParachute",
        ]);
        add([
            text("BUY", { size: 24 }),
            pos(center().x + 130, 340),
            anchor("center"),
            color(255, 255, 255),
            z(11),
        ]);

        // Buy parachute click handler
        onClick("buyParachute", () => {
            if (playerMoney >= parachutePrice && !hasParachute) {
                playerMoney -= parachutePrice;
                hasParachute = true;
                play("ticket"); // Use ticket sound for purchase

                // Show purchase confirmation
                const purchaseMsg = add([
                    text("PURCHASED!", { size: 36 }),
                    pos(center().x, 260),
                    anchor("center"),
                    color(0, 200, 0),
                    z(100),
                ]);

                // Flash effect on the item
                const flash = add([
                    rect(320, 140),
                    pos(center().x, 340),
                    anchor("center"),
                    color(255, 255, 255),
                    opacity(0.8),
                    z(50),
                ]);

                // Animate flash fade out and then refresh scene
                let flashOpacity = 0.8;
                const flashTimer = onUpdate(() => {
                    flashOpacity -= dt() * 2;
                    flash.opacity = flashOpacity;
                    if (flashOpacity <= 0) {
                        flashTimer.cancel();
                        go("tesco", level, playerX, playerY, tickets, lives, hp);
                    }
                });
            }
        });
    }

    // Exit button
    const exitBtn = add([
        rect(160, 50),
        pos(center().x, 550),
        anchor("center"),
        color(150, 50, 50),
        area(),
        "exitBtn",
    ]);

    add([
        text("EXIT", {
            size: 28,
        }),
        pos(center().x, 550),
        anchor("center"),
        color(255, 255, 255),
    ]);

    // Click handler for exit - offset player to the left to avoid re-entering
    onClick("exitBtn", () => {
        go("game", level, playerX - 50, playerY, tickets, lives, hp);
    });

    // Also allow ESC to exit
    onKeyPress("escape", () => {
        go("game", level, playerX - 50, playerY, tickets, lives, hp);
    });
});

// Win scene
scene("win", () => {
    add([
        rect(width(), height()),
        color(50, 200, 50),
        fixed(),
    ]);

    add([
        text("YOU WIN!", {
            size: 72,
        }),
        pos(center().x, center().y - 50),
        anchor("center"),
        color(255, 255, 255),
    ]);

    add([
        text("Total Money: £" + playerMoney.toFixed(2), {
            size: 36,
        }),
        pos(center().x, center().y + 30),
        anchor("center"),
        color(255, 215, 0),
    ]);

    add([
        text("Press SPACE to play again", {
            size: 24,
        }),
        pos(center().x, center().y + 100),
        anchor("center"),
        color(255, 255, 255),
    ]);

    onKeyPress("space", () => {
        playerMoney = 0;
        go("game", 0);
    });
});

// Start screen scene
scene("start", () => {
    // Background
    add([
        rect(width(), height()),
        color(50, 50, 80),
        fixed(),
    ]);

    // Title
    add([
        text("Ticket Parkour", { size: 72 }),
        pos(center().x, 80),
        anchor("center"),
        color(255, 215, 0),
    ]);

    // Story/objective
    add([
        text("Collect tickets and sell them at the Box Office!", { size: 24 }),
        pos(center().x, 160),
        anchor("center"),
        color(255, 255, 255),
    ]);

    // Controls section
    add([
        text("CONTROLS", { size: 32 }),
        pos(center().x, 230),
        anchor("center"),
        color(255, 200, 100),
    ]);

    // Control instructions
    const controls = [
        "WASD - Move",
        "W - Jump (press again for double jump)",
        "P - Deploy parachute (when owned)",
    ];

    controls.forEach((ctrl, i) => {
        add([
            text(ctrl, { size: 20 }),
            pos(center().x, 280 + i * 35),
            anchor("center"),
            color(200, 200, 220),
        ]);
    });

    // Tips section
    add([
        text("TIPS", { size: 32 }),
        pos(center().x, 440),
        anchor("center"),
        color(255, 200, 100),
    ]);

    // B indicator
    add([
        text("B >", { size: 24 }),
        pos(center().x - 180, 490),
        anchor("center"),
        color(255, 105, 180),
    ]);
    add([
        text("Box Office: Sell your tickets for money", { size: 18 }),
        pos(center().x + 60, 490),
        anchor("center"),
        color(200, 200, 220),
    ]);

    // T indicator
    add([
        text("T >", { size: 24 }),
        pos(center().x - 180, 525),
        anchor("center"),
        color(0, 100, 200),
    ]);
    add([
        text("Tesco: Buy items like the parachute", { size: 18 }),
        pos(center().x + 60, 525),
        anchor("center"),
        color(200, 200, 220),
    ]);

    // Fall damage warning
    add([
        text("Watch out for fall damage from high drops!", { size: 18 }),
        pos(center().x, 565),
        anchor("center"),
        color(255, 100, 100),
    ]);

    // Start button
    add([
        rect(200, 60),
        pos(center().x, 620),
        anchor("center"),
        color(0, 150, 0),
        area(),
        "startBtn",
    ]);

    add([
        text("START", { size: 32 }),
        pos(center().x, 620),
        anchor("center"),
        color(255, 255, 255),
    ]);

    // Click to start
    onClick("startBtn", () => {
        collectedTicketsPerLevel = {};
        go("game", 0);
    });

    // Also allow space to start
    onKeyPress("space", () => {
        collectedTicketsPerLevel = {};
        go("game", 0);
    });
});

// Start the game at start screen
go("start");