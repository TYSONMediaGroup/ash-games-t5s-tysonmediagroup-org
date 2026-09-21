// Pill Guy - 2D Character on Blue Background
// Features: Yellow horizontal capsule body, 2 legs, 2 line eyes, free 2D movement, 2-second T5S intro splash

// ==========================================
// 1. T5S INTRO SPLASH SCREEN (2 SECONDS)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('t5s-splash');
  if (!splash) return;

  const dismissSplash = () => {
    if (splash.classList.contains('fade-out')) return;
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.classList.add('hidden');
    }, 600);
  };

  // Hold T5S project background for exactly 2 seconds
  const timer = setTimeout(dismissSplash, 2000);

  // Allow clicking or pressing any key to skip immediately
  window.addEventListener('keydown', () => {
    clearTimeout(timer);
    dismissSplash();
  }, { once: true });

  splash.addEventListener('click', () => {
    clearTimeout(timer);
    dismissSplash();
  }, { once: true });
});

// ==========================================
// 2. INPUT SYSTEM
// ==========================================
class InputSystem {
  constructor() {
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false,
    };

    this.mouseTarget = null;
    this.isPointerDown = false;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.up = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
      if (e.code === 'Space') this.keys.space = true;
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.up = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
      if (e.code === 'Space') this.keys.space = false;
    });

    // Mouse & Touch click-to-move support
    const setPointer = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.mouseTarget = { x: clientX, y: clientY };
      this.isPointerDown = true;
    };

    window.addEventListener('mousedown', setPointer);
    window.addEventListener('mousemove', (e) => {
      if (this.isPointerDown) setPointer(e);
    });
    window.addEventListener('mouseup', () => {
      this.isPointerDown = false;
      this.mouseTarget = null;
    });

    window.addEventListener('touchstart', setPointer, { passive: true });
    window.addEventListener('touchmove', setPointer, { passive: true });
    window.addEventListener('touchend', () => {
      this.isPointerDown = false;
      this.mouseTarget = null;
    });
  }
}

// ==========================================
// 3. PILL GUY CHARACTER
// ==========================================
class PillGuy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    // Body specs: Yellow horizontal capsule
    this.width = 68;
    this.height = 36;

    // Physics
    this.speed = 5.5;
    this.accel = 0.55;
    this.friction = 0.85;

    // Jump / Hop mechanics
    this.jumpZ = 0;
    this.vZ = 0;
    this.gravity = 0.6;
    this.isJumping = false;
    this.jumpPressed = false;

    // Procedural Animation
    this.facing = 1; // 1 = right, -1 = left
    this.walkCycle = 0;
    this.idleTime = 0;
    this.legLength = 16;

    // Squash & Stretch
    this.scaleX = 1;
    this.scaleY = 1;

    // Blinking
    this.blinkTimer = 140 + Math.random() * 100;
    this.isBlinking = false;
    this.blinkDuration = 0;
  }

  update(input, screenW, screenH) {
    let moveX = 0;
    let moveY = 0;

    // Keyboard movement
    if (input.keys.left) moveX -= 1;
    if (input.keys.right) moveX += 1;
    if (input.keys.up) moveY -= 1;
    if (input.keys.down) moveY += 1;

    // Mouse / Touch pointer following
    if (input.mouseTarget) {
      const dx = input.mouseTarget.x - this.x;
      const dy = input.mouseTarget.y - (this.y - this.jumpZ);
      const dist = Math.hypot(dx, dy);
      if (dist > 15) {
        moveX = dx / dist;
        moveY = dy / dist;
      }
    }

    // Normalize diagonal velocity
    const len = Math.hypot(moveX, moveY);
    if (len > 0) {
      moveX /= len;
      moveY /= len;
      this.vx += moveX * this.accel;
      this.vy += moveY * this.accel;
    }

    // Friction
    this.vx *= this.friction;
    this.vy *= this.friction;

    // Cap speed
    const currentSpeed = Math.hypot(this.vx, this.vy);
    if (currentSpeed > this.speed) {
      this.vx = (this.vx / currentSpeed) * this.speed;
      this.vy = (this.vy / currentSpeed) * this.speed;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Facing direction
    if (this.vx > 0.3) this.facing = 1;
    else if (this.vx < -0.3) this.facing = -1;

    // Walk animation cycle
    const groundSpeed = Math.hypot(this.vx, this.vy);
    if (groundSpeed > 0.2) {
      this.walkCycle += groundSpeed * 0.18;
    } else {
      this.walkCycle *= 0.8;
      this.idleTime += 0.04;
    }

    // Jump / Hop on Spacebar
    if (input.keys.space && !this.jumpPressed && !this.isJumping) {
      this.isJumping = true;
      this.vZ = 9.5;
      this.scaleX = 0.8;
      this.scaleY = 1.25;
      this.jumpPressed = true;
    }
    if (!input.keys.space) {
      this.jumpPressed = false;
    }

    // Z-axis jump physics
    if (this.isJumping) {
      this.jumpZ += this.vZ;
      this.vZ -= this.gravity;

      if (this.jumpZ <= 0) {
        this.jumpZ = 0;
        this.vZ = 0;
        this.isJumping = false;
        // Squash on landing
        this.scaleX = 1.25;
        this.scaleY = 0.75;
      }
    }

    // Spring back squash & stretch
    this.scaleX += (1 - this.scaleX) * 0.15;
    this.scaleY += (1 - this.scaleY) * 0.15;

    // Keep within screen bounds
    const padding = 45;
    if (this.x < padding) { this.x = padding; this.vx = 0; }
    if (this.x > screenW - padding) { this.x = screenW - padding; this.vx = 0; }
    if (this.y < padding + 20) { this.y = padding + 20; this.vy = 0; }
    if (this.y > screenH - padding) { this.y = screenH - padding; this.vy = 0; }

    // Blinking logic
    this.blinkTimer--;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      this.blinkDuration = 10;
      this.blinkTimer = 130 + Math.random() * 160;
    }
    if (this.isBlinking) {
      this.blinkDuration--;
      if (this.blinkDuration <= 0) {
        this.isBlinking = false;
      }
    }
  }

  draw(ctx) {
    const currentY = this.y - this.jumpZ;

    ctx.save();
    ctx.translate(this.x, currentY);

    // Subtle scale for jump hop
    ctx.scale(this.scaleX, this.scaleY);

    // ----------------------------------------
    // A. 2 LEGS (Simple stick lines)
    // ----------------------------------------
    const hipY = this.height / 2;
    const hipOffset = 13;
    const footGroundY = hipY + this.legLength;

    let lFootX, lFootY, rFootX, rFootY;

    if (this.jumpZ > 0) {
      // Airborne: simple lines tucked or angled
      lFootX = -hipOffset - this.vx * 1.2;
      lFootY = footGroundY - 4;

      rFootX = hipOffset - this.vx * 1.2;
      rFootY = footGroundY - 2;
    } else {
      // Walking / idle: simple stick line swing
      const groundSpd = Math.hypot(this.vx, this.vy);
      if (groundSpd > 0.2) {
        const stride = 10;
        lFootX = -hipOffset + Math.sin(this.walkCycle) * stride;
        lFootY = footGroundY - Math.max(0, Math.cos(this.walkCycle)) * 5;

        rFootX = hipOffset + Math.sin(this.walkCycle + Math.PI) * stride;
        rFootY = footGroundY - Math.max(0, Math.cos(this.walkCycle + Math.PI)) * 5;
      } else {
        // Standing still: straight down
        lFootX = -hipOffset;
        lFootY = footGroundY;
        rFootX = hipOffset;
        rFootY = footGroundY;
      }
    }

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    // Left leg: just a line
    ctx.beginPath();
    ctx.moveTo(-hipOffset, hipY);
    ctx.lineTo(lFootX, lFootY);
    ctx.stroke();

    // Right leg: just a line
    ctx.beginPath();
    ctx.moveTo(hipOffset, hipY);
    ctx.lineTo(rFootX, rFootY);
    ctx.stroke();

    // ----------------------------------------
    // B. HORIZONTAL CAPSULE PILL BODY (Flat Yellow, No Reflections)
    // ----------------------------------------
    const w = this.width;
    const h = this.height;
    const r = h / 2;

    ctx.beginPath();
    ctx.moveTo(-w / 2 + r, -h / 2);
    ctx.lineTo(w / 2 - r, -h / 2);
    ctx.arc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-w / 2 + r, h / 2);
    ctx.arc(-w / 2 + r, 0, r, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.closePath();

    // Solid flat yellow fill (no reflections or gradients)
    ctx.fillStyle = '#FFE600';
    ctx.fill();

    // Simple black outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // ----------------------------------------
    // C. 2 LINES FOR EYES
    // ----------------------------------------
    const eyeLookX = this.facing * 5 + this.vx * 0.5;
    const eyeLookY = this.vy * 0.3;
    const eyeSpacing = 8;
    const eyeHeight = 9;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    if (this.isBlinking) {
      // Blinking: horizontal slit lines - -
      ctx.beginPath();
      ctx.moveTo(eyeLookX - eyeSpacing / 2 - 3, eyeLookY);
      ctx.lineTo(eyeLookX - eyeSpacing / 2 + 3, eyeLookY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(eyeLookX + eyeSpacing / 2 - 3, eyeLookY);
      ctx.lineTo(eyeLookX + eyeSpacing / 2 + 3, eyeLookY);
      ctx.stroke();
    } else {
      // Normal: 2 vertical lines | |
      ctx.beginPath();
      ctx.moveTo(eyeLookX - eyeSpacing / 2, eyeLookY - eyeHeight / 2);
      ctx.lineTo(eyeLookX - eyeSpacing / 2, eyeLookY + eyeHeight / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(eyeLookX + eyeSpacing / 2, eyeLookY - eyeHeight / 2);
      ctx.lineTo(eyeLookX + eyeSpacing / 2, eyeLookY + eyeHeight / 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function groundSpeed(guy) {
  return Math.hypot(guy.vx, guy.vy);
}

// ==========================================
// 4. MAIN ENGINE
// ==========================================
class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.input = new InputSystem();

    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Spawn Pill Guy in the center of the screen
    this.player = new PillGuy(window.innerWidth / 2, window.innerHeight / 2);

    requestAnimationFrame((t) => this.loop(t));
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  loop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  update() {
    this.player.update(this.input, this.canvas.width, this.canvas.height);
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // ----------------------------------------
    // SOLID BLUE BACKGROUND
    // "just blue background"
    // ----------------------------------------
    ctx.fillStyle = '#2b78e4';
    ctx.fillRect(0, 0, w, h);

    // Draw Pill Guy
    this.player.draw(ctx);
  }
}

window.addEventListener('load', () => {
  new GameEngine();
});
