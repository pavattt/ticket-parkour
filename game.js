// Initialize Kaboom
kaboom({
    width: 1280,
    height: 720,
    background: [134, 185, 255],
});

// Load sprites - using simple colored rectangles for now
loadRoot("");
loadBean();

// Define the level
const LEVELS = [
    [
        "                                                                                ",
        "                                                                                ",
        "                                                                                ",
        "                                                                                ",
        "                                                                                ",
        "                                                                                ",
        "                                                                                ",
        "                   ========                                                     ",
        "                                                                                ",
        "                                          ====                                 ",
        "              ===                                                               ",
        "                                                         ===                    ",
        "                         ===                                                    ",
        "                                    ==              ==                         ",
        "        ===                                                      ====           ",
        "                    ==                                                          ",
        "                            ==                                                  ",
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
    },
};

// Game scene
scene("game", (level = 0) => {
    // Set gravity
    setGravity(1600);

    // Add the level
    const currentLevel = addLevel(LEVELS[level], levelConfig);

    // Add the player
    const player = add([
        rect(32, 32),
        color(255, 0, 0),
        pos(100, 300),
        area(),
        body(),
        anchor("center"),
        scale(1),
        {
            speed: 320,
            jumpHeight: 640,
            isSquatting: false,
        },
        "player",
    ]);

    // Left movement
    onKeyDown("left", () => {
        player.move(-player.speed, 0);
        player.scaleX = Math.abs(player.scale.x) * -1;
    });
    
    onKeyDown("a", () => {
        player.move(-player.speed, 0);
        player.scaleX = Math.abs(player.scale.x) * -1;
    });

    // Right movement
    onKeyDown("right", () => {
        player.move(player.speed, 0);
        player.scaleX = Math.abs(player.scale.x);
    });
    
    onKeyDown("d", () => {
        player.move(player.speed, 0);
        player.scaleX = Math.abs(player.scale.x);
    });

    // Jump
    onKeyPress("space", () => {
        if (player.isGrounded()) {
            player.jump(player.jumpHeight);
        }
    });

    onKeyPress("up", () => {
        if (player.isGrounded()) {
            player.jump(player.jumpHeight);
        }
    });
    
    onKeyPress("w", () => {
        if (player.isGrounded()) {
            player.jump(player.jumpHeight);
        }
    });

    // Squat/Crouch
    onKeyDown("down", () => {
        if (!player.isSquatting && player.isGrounded()) {
            player.isSquatting = true;
            player.scaleTo(1, 0.5);
        }
    });
    
    onKeyDown("s", () => {
        if (!player.isSquatting && player.isGrounded()) {
            player.isSquatting = true;
            player.scaleTo(1, 0.5);
        }
    });

    onKeyRelease("down", () => {
        if (player.isSquatting) {
            player.isSquatting = false;
            player.scaleTo(1, 1);
        }
    });
    
    onKeyRelease("s", () => {
        if (player.isSquatting) {
            player.isSquatting = false;
            player.scaleTo(1, 1);
        }
    });

    // Camera follows player
    camScale(vec2(1.5));
    
    onUpdate(() => {
        // Camera follows player horizontally
        camPos(vec2(player.pos.x, 360));
        
        // Reset if player falls
        if (player.pos.y > 1000) {
            go("game", level);
        }
    });

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
});

// Start the game
go("game", 0);