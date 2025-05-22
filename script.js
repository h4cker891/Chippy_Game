window.addEventListener("DOMContentLoaded", () => {
  const player = document.getElementById("player");
  const bones = document.querySelectorAll(".bone");
  const platforms = document.querySelectorAll(".platform");
  const lava = document.getElementById("lava");
  const boneCounter = document.getElementById("bone-counter");
  const pauseBtn = document.getElementById("pause-btn");
  const resetBtn = document.getElementById("reset-btn");
  const cat = document.getElementById("cat");
  const bgMusic = document.getElementById("bg-music");

  const startCard = document.getElementById("start-card");
  const startBtn = document.getElementById("start-btn");

  let x = 100, y = 100;
  let vx = 0, vy = 0;
  const gravity = 0.5;
  const jumpPower = -10;
  let onGround = false;
  let bonesCollected = 0;
  let keys = {};
  let isPaused = true;
  let gameOver = false;

  let boneRespawnTimers = new Map();

  let lavaHeight = 50;
  const lavaSpeed = 0.3;
  const maxLavaHeight = 400;

  let catX = 300;
  let catY = 300;
  let catDirection = 1;
  let catSpeed = 2;
  cat.vy = 0;

  const gameOverMessage = document.createElement("div");
  Object.assign(gameOverMessage.style, {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "48px",
    color: "red",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: "20px 40px",
    borderRadius: "12px",
    zIndex: "10000",
    display: "none"
  });
  document.body.appendChild(gameOverMessage);

  startBtn.addEventListener("click", () => {
    startCard.style.display = "none";
    isPaused = false;
    bgMusic.play().catch(() => console.log("User interaction needed to play audio."));
  });

  document.addEventListener("keydown", e => {
    if (!gameOver && !isPaused) keys[e.key] = true;
  });

  document.addEventListener("keyup", e => {
    if (!gameOver && !isPaused) keys[e.key] = false;
  });

  pauseBtn.addEventListener("click", () => {
    if (gameOver) return;
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? "Resume" : "Pause";

    if (!isPaused) {
      boneRespawnTimers.forEach((delay, bone) => {
        if (typeof delay === "number") {
          scheduleBoneRespawn(bone, delay);
        }
      });
    } else {
      boneRespawnTimers.forEach((timer, bone) => {
        if (typeof timer === "number") {
          clearTimeout(timer);
          boneRespawnTimers.set(bone, 1000);
        }
      });
    }
  });

  resetBtn.addEventListener("click", () => location.reload());

  function scheduleBoneRespawn(bone, delay) {
    if (isPaused) {
      boneRespawnTimers.set(bone, delay);
      return;
    }
    const id = setTimeout(() => {
      bone.style.display = "block";
      bone.collected = false;
      boneRespawnTimers.delete(bone);
    }, delay);
    boneRespawnTimers.set(bone, id);
  }

  function update() {
    if (gameOver) return;
    if (!isPaused) {
      if (keys["ArrowLeft"] || keys["a"]) vx = -5;
      else if (keys["ArrowRight"] || keys["d"]) vx = 5;
      else vx = 0;

      if ((keys["ArrowUp"] || keys["w"] || keys[" "]) && onGround) {
        vy = jumpPower;
        onGround = false;
      }

      vy += gravity;
      x += vx;
      y += vy;

      onGround = false;
      platforms.forEach(platform => {
        const pr = platform.getBoundingClientRect();
        const pl = player.getBoundingClientRect();
        if (
          pl.left + pl.width > pr.left &&
          pl.left < pr.left + pr.width &&
          pl.bottom <= pr.top + 10 &&
          pl.bottom + vy >= pr.top
        ) {
          y = pr.top - player.offsetHeight;
          vy = 0;
          onGround = true;
        }
      });

      if (lavaHeight < maxLavaHeight) {
        lavaHeight += lavaSpeed;
        lava.style.height = `${lavaHeight}px`;
      }

      const lavaRect = lava.getBoundingClientRect();
      const playerRect = player.getBoundingClientRect();
      if (playerRect.bottom > lavaRect.top) {
        endGame("GAME OVER");
        return;
      }

      bones.forEach(bone => {
        if (!bone.collected) {
          const boneRect = bone.getBoundingClientRect();
          if (
            playerRect.right > boneRect.left &&
            playerRect.left < boneRect.right &&
            playerRect.bottom > boneRect.top &&
            playerRect.top < boneRect.bottom
          ) {
            bone.style.display = "none";
            bone.collected = true;
            bonesCollected++;
            boneCounter.textContent = `Bones: ${bonesCollected}`;
            scheduleBoneRespawn(bone, 2000);

            if (bonesCollected >= 15) {
              endGame("YOU WIN! Click reset to play again.");
              return;
            }
          }
        }
      });

      cat.vy += gravity;
      let nextCatX = catX + catSpeed * catDirection;
      let nextCatY = catY + cat.vy;
      let catOnGround = false;

      platforms.forEach(platform => {
        const pr = platform.getBoundingClientRect();
        const catRect = { left: nextCatX, right: nextCatX + 50, top: nextCatY, bottom: nextCatY + 50 };
        if (
          catRect.right > pr.left &&
          catRect.left < pr.right &&
          catRect.bottom > pr.top &&
          catRect.top < pr.top + 10
        ) {
          nextCatY = pr.top - 50;
          cat.vy = 0;
          catOnGround = true;
        }
      });

      if (catOnGround) {
        let supported = false;
        platforms.forEach(platform => {
          const pr = platform.getBoundingClientRect();
          if (
            nextCatX + 25 > pr.left &&
            nextCatX + 25 < pr.right &&
            nextCatY + 50 >= pr.top &&
            nextCatY + 50 <= pr.top + 5
          ) {
            supported = true;
          }
        });
        if (!supported) {
          cat.vy = jumpPower * 0.7;
          catDirection *= -1;
        }
      }

      catX = nextCatX;
      catY = nextCatY;
      cat.style.left = `${catX}px`;
      cat.style.top = `${catY}px`;
      cat.style.transform = catDirection === -1 ? "scaleX(-1)" : "scaleX(1)";

      const catRect = cat.getBoundingClientRect();
      if (
        playerRect.right > catRect.left &&
        playerRect.left < catRect.right &&
        playerRect.bottom > catRect.top &&
        playerRect.top < catRect.bottom
      ) {
        endGame("GAME OVER");
        return;
      }

      player.style.left = `${x}px`;
      player.style.top = `${y}px`;
    }

    requestAnimationFrame(update);
  }

function endGame(message) {
  gameOver = true;
  gameOverMessage.textContent = message;

  // Change text color based on win or loss
  if (message.includes("WIN")) {
    gameOverMessage.style.color = "limegreen";
  } else {
    gameOverMessage.style.color = "red";
  }

  gameOverMessage.style.display = "block";
}


  update();
});

