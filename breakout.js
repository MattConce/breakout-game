/*
Author: Matheus Santos
Date: 15/06/2021
*/

// Constants
const COLOR_BCK = [0.0, 0.0, 0.0, 1.0];
const COLOR_OBJ = [1.0, 1.0, 1.0, 1.0];

let N_COLS = 20;
const N_TIER = 6;
let N_BLOCKS = N_TIER * N_COLS + 2;

const BLOCK_RESOLUTION = 16;
const BLOCK_RADIUS = 30;

let colorList = [
  [0.53, 0.3, 0.62],
  [0.73, 0.3, 0],
  [0.9, 0.5, 0.13],
  [0.95, 0.61, 0.07],
  [0.18, 0.8, 0.44],
  [0.2, 0.6, 0.85],
  [0.94, 0.77, 0.06],
  [1, 1, 1],
  [0, 0, 0],
];

let canvas;
let ctx;

let debug = false;

let bufferPosicoes;
let jsaPosition;

let bufferColor;
let gColor;

let guTranslation;
let guRotation;
let guScale;
let gProgram;
let gVao;

let gTranslation;
let gRotation;
let gScale;

let blocks = [];
let positions = [];
let blockColors = new Float32Array(18 * N_BLOCKS);

let paddle;
let ball;

let maxVel = 3;

// Block's dimensions
let gWidth;
let gHeight;

let paddleWidth;
let ballWidth;

let lives = 3;
let score = 0;
let level = 1;

let animationStep = 10;
let requestId = -1;

let started = false;

let paddleVel = 3.5;
let paddleSize;

let hitted = false;

let modal;

const Area2 = (a, b, c) => {
  return (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
};

const left = (a, b, c) => {
  return Area2(a, b, c) > 0;
};

const right = (a, b, c) => {
  return Area2(a, b, c) < 0;
};

const leftOn = (a, b, c) => {
  return Area2(a, b, c) >= 0;
};

const collinear = (a, b, c) => {
  return Area2(a, b, c) == 0;
};

const XOR = (a, b) => {
  if (a == b) return false;
  else return true;
};

const intersectProp = (a, b, c, d) => {
  if (
    collinear(a, b, c) ||
    collinear(a, b, d) ||
    collinear(c, d, a) ||
    collinear(c, d, b)
  )
    return false;
  else {
    return (
      XOR(left(a, b, c), left(a, b, d)) && XOR(left(c, d, a), left(c, d, b))
    );
  }
};

const between = (a, b, c) => {
  if (!collinear(a, b, c)) {
    return false;
  } else {
    if (a[0] != b[0]) {
      return (a[0] <= c[0] && c[0] <= b[0]) || (a[0] >= c[0] && c[0] >= b[0]);
    } else {
      return (a[1] <= c[1] && c[1] <= b[1]) || (a[1] >= c[1] && c[1] >= b[1]);
    }
  }
};

const intersect = (a, b, c, d) => {
  if (intersectProp(a, b, c, d)) {
    return true;
  } else {
    return (
      between(a, b, c) ||
      between(a, b, d) ||
      between(c, d, a) ||
      between(c, d, b)
    );
  }
};

window.onload = () => {
  // Get canvas
  canvas = document.getElementById("canvas");
  // Get webgl context from the canvas
  ctx = canvas.getContext("webgl2");

  // Listeners for pressed keys
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key == "j" || e.key == "a") {
        paddle.vel = [-paddleVel, 0];
      } else if (e.key == "l" || e.key == "d") {
        paddle.vel = [paddleVel, 0];
      } else if (e.key == "s" || e.key == "k") {
        paddle.vel = [0, 0];
      }
    },
    false
  );

  document.getElementById("speed").onchange = (e) => {
    let newVel = Number(e.target.value);
    maxVel = newVel;
    if (ball.vel[1] > 0) ball.vel[1] = newVel;
    if (ball.vel[1] < 0) ball.vel[1] = -newVel;
  };

  document.getElementById("size").onchange = (e) => {
    let pos = paddle.indexPosition;
    if (paddleSize < e.target.value) {
      let delta = e.target.value - paddleSize;
      paddleSize = e.target.value;
      let l = paddle.x - (delta * paddleWidth) / 8;
      let b = paddle.y;
      let r = paddle.x + paddle.w + (delta * paddleWidth) / 8;
      let t = b + paddle.h;
      paddle.w = paddle.w + (delta * paddleWidth) / 4;
      paddle.x = l;
      paddle.y = b;
      positions[pos + 0] = l;
      positions[pos + 1] = b;
      positions[pos + 2] = r;
      positions[pos + 3] = b;
      positions[pos + 4] = r;
      positions[pos + 5] = t;

      positions[pos + 6] = l;
      positions[pos + 7] = b;
      positions[pos + 8] = l;
      positions[pos + 9] = t;
      positions[pos + 10] = r;
      positions[pos + 11] = t;
    } else if (paddleSize > e.target.value) {
      let delta = paddleSize - e.target.value;
      paddleSize = e.target.value;
      let l = paddle.x + (delta * paddleWidth) / 8;
      let b = paddle.y;
      let r = paddle.x + paddle.w - (delta * paddleWidth) / 8;
      let t = b + paddle.h;
      paddle.w = paddle.w - (delta * paddleWidth) / 4;
      paddle.x = l;
      paddle.y = b;
      positions[pos + 0] = l;
      positions[pos + 1] = b;
      positions[pos + 2] = r;
      positions[pos + 3] = b;
      positions[pos + 4] = r;
      positions[pos + 5] = t;

      positions[pos + 6] = l;
      positions[pos + 7] = b;
      positions[pos + 8] = l;
      positions[pos + 9] = t;
      positions[pos + 10] = r;
      positions[pos + 11] = t;
    }
  };

  // resize the canvas to fill browser window dynamically
  window.addEventListener("resize", resizeCanvas, false);
  resizeCanvas();

  document.getElementById("play").onclick = () => {
    if (debug) {
      startGame();
    } else if (started) {
      if (requestId != -1) cancelAnimationFrame(requestId);
      requestId = -1;
      started = false;
      document.getElementById("play").innerHTML = "Play";
    } else {
      started = true;
      document.getElementById("play").innerHTML = "Pause";
      requestAnimationFrame(startGame);
    }
  };

  document.getElementById("debug").onclick = () => {
    if (requestId != -1) cancelAnimationFrame(requestId);
    if (debug) {
      document.getElementById("play").innerHTML = "Play";
    } else {
      document.getElementById("play").innerHTML = "Step";
    }
    debug = !debug;
    requestId = -1;
  };

  document.getElementById("clear").onclick = () => {
    maxVel = 3;
    lives = 3;
    level = 1;
    score = 0;
    paddleVel = 0;
    blocks = [];
    positions = [];
    blockColors = new Float32Array(18 * N_BLOCKS);
    paddle = null;
    ball = null;
    started = false;
    paddleVel = 3;
    debug = false;
    // Cancel current animation
    cancelAnimationFrame(requestId);
    requestId = -1;
    document.getElementById("play").innerHTML = "Play";
    document.getElementById("lives").src = `./assets/lives${lives}.png`;
    document.getElementById("score").innerHTML = `SCORE: ${score}`;
    init();
  };
  // Modal screen
  modal = document.getElementById("myModal");
  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
  modal.style.display = "none";
  init();
};

const startGame = () => {
  document.getElementById("lives").src = `./assets/lives${lives}.png`;
  document.getElementById("level").innerHTML = `LEVEL ${level}`;
  if (lives == 0) {
    setTimeout(() => {
      document.getElementById("msg").style.color = "red";
      document.getElementById("msg").innerHTML = "Game Over!!";
      modal.style.display = "block";
    }, 1000);
    level = 1;
    document.getElementById("clear").click();
  } else if (score == N_BLOCKS - 2) {
    document.getElementById("clear").click();
    document.getElementById("msg").style.color = "green";
    document.getElementById("msg").innerHTML = "You Won!!";
    level = 2;
    document.getElementById("level").innerHTML = `LEVEL ${level}`;
    modal.style.display = "block";
    paddleVel += 1;
    maxVel += 1;
    ball.vel[1] = -maxVel;
  } else {
    ball.move("ball");
    if (paddle.vel[0] != 0) paddle.move("paddle");
    document.getElementById("score").innerHTML = `SCORE: ${score}`;
    if (!debug) requestId = requestAnimationFrame(startGame);
    render();
  }
};

const resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gWidth = canvas.width / N_COLS;
  gHeight = canvas.height * 0.05;
  paddleWidth = canvas.width * 0.15;
  paddleHeight = canvas.height * 0.02;
  ballWidth = canvas.height * 0.015;
};

const init = () => {
  gTranslation = [0, 0];
  gRotation = [0.0, 1.0];
  gScale = [1.0, 1.0];

  gProgram = makeProgram(ctx, vertexShaderSrc, fragmentShaderSrc);
  ctx.useProgram(gProgram);

  N_COLS = 10 * level;
  N_BLOCKS = N_TIER * N_COLS + 2;
  resizeCanvas();

  blocks = generateRects(N_BLOCKS - 2);

  let currentIndexPosition = blocks[blocks.length - 1].indexPosition;
  let currentIndexColor = blocks[blocks.length - 1].indexColor;

  currentIndexPosition += 12;
  currentIndexColor += 18;

  paddle = new Rect(
    canvas.width / 2,
    canvas.height - 60,
    paddleWidth,
    paddleHeight,
    colorList[7],
    currentIndexColor,
    currentIndexPosition,
    N_BLOCKS - 2
  );
  blocks.push(paddle);
  paddle.vel = [0, 0];

  paddleSize = 3;
  currentIndexPosition += 12;
  currentIndexColor += 18;

  ball = new Rect(
    canvas.width / 2 + gWidth / 2,
    canvas.height - 100,
    ballWidth,
    ballWidth,
    colorList[7],
    currentIndexColor,
    currentIndexPosition,
    N_BLOCKS - 1
  );
  blocks.push(ball);

  hitted = false;

  drawItAll(blocks, positions);

  gVao = ctx.createVertexArray();
  ctx.bindVertexArray(gVao);

  bufferPosicoes = ctx.createBuffer();
  jsaPosition = ctx.getAttribLocation(gProgram, "aPosition");

  ctx.bindBuffer(ctx.ARRAY_BUFFER, bufferPosicoes);
  ctx.bufferData(
    ctx.ARRAY_BUFFER,
    new Float32Array(positions),
    ctx.STATIC_DRAW
  );
  ctx.enableVertexAttribArray(jsaPosition);
  ctx.vertexAttribPointer(jsaPosition, 2, ctx.FLOAT, false, 0, 0);

  bufferColor = ctx.createBuffer();
  gColor = ctx.getAttribLocation(gProgram, "a_color");

  ctx.bindBuffer(ctx.ARRAY_BUFFER, bufferColor);
  ctx.bufferData(
    ctx.ARRAY_BUFFER,
    new Float32Array(blockColors),
    ctx.STREAM_DRAW
  );

  ctx.enableVertexAttribArray(gColor);
  ctx.vertexAttribPointer(gColor, 3, ctx.FLOAT, false, 0, 0);

  // Viewport
  let jsuResolucao = ctx.getUniformLocation(gProgram, "uResolucao");
  ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.uniform2f(jsuResolucao, ctx.canvas.width, ctx.canvas.height);
  ctx.clearColor(COLOR_BCK[0], COLOR_BCK[1], COLOR_BCK[2], COLOR_BCK[3]);

  // Transforms
  guTranslation = ctx.getUniformLocation(gProgram, "uTranslation");
  guRotation = ctx.getUniformLocation(gProgram, "uRotation");
  guScale = ctx.getUniformLocation(gProgram, "uScale");
  ctx.uniform2fv(guTranslation, gTranslation);
  ctx.uniform2fv(guRotation, gRotation);
  ctx.uniform2fv(guScale, gScale);
  render();
};

function render() {
  ctx.clear(ctx.COLOR_BUFFER_BIT);

  ctx.bindVertexArray(gVao);

  ctx.bindBuffer(ctx.ARRAY_BUFFER, bufferPosicoes);
  ctx.bufferData(
    ctx.ARRAY_BUFFER,
    new Float32Array(positions),
    ctx.STATIC_DRAW
  );
  ctx.enableVertexAttribArray(jsaPosition);
  ctx.vertexAttribPointer(jsaPosition, 2, ctx.FLOAT, false, 0, 0);

  ctx.bindBuffer(ctx.ARRAY_BUFFER, bufferColor);
  ctx.bufferData(
    ctx.ARRAY_BUFFER,
    new Float32Array(blockColors),
    ctx.STREAM_DRAW
  );

  ctx.enableVertexAttribArray(gColor);
  ctx.vertexAttribPointer(gColor, 3, ctx.FLOAT, false, 0, 0);
  ctx.drawArrays(ctx.TRIANGLES, 0, positions.length / 2);
}

class Rect {
  constructor(x, y, w, h, color, indexColor, indexPosition, indexBlock) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;
    this.indexColor = indexColor;
    this.indexPosition = indexPosition;
    this.state = "live";
    this.vel = [maxVel, -maxVel];
    this.indexBlock = indexBlock;
  }

  detectCollision() {
    for (let i = 0; i < blocks.length - 2; i++) {
      let cur = blocks[i];
      if (cur.state == "live" && this.collides(cur)) {
        cur.state = "dead";
        score++;
        cur.color = colorList[8];
        for (let j = cur.indexColor; j < cur.indexColor + 18; j += 3) {
          blockColors[j] = cur.color[0];
          blockColors[j + 1] = cur.color[1];
          blockColors[j + 2] = cur.color[2];
        }
      }
    }
    this.checkpaddle(paddle);
  }

  checkpaddle(that) {
    let leftTop1 = [this.x, this.y];
    let rightBottom1 = [this.x + this.w, this.y + this.h];

    let leftTop2 = [that.x, that.y];
    let rightBottom2 = [that.x + that.w, that.y + that.h];

    if (leftTop1[0] > rightBottom2[0] || leftTop2[0] > rightBottom1[0]) {
      hitted = false;
      return;
    }

    if (leftTop1[1] > rightBottom2[1] || leftTop2[1] > rightBottom1[1]) {
      hitted = false;
      return;
    }

    if (hitted) return;

    if (rightBottom1[0] >= leftTop2[0] && leftTop1[0] <= rightBottom2[0]) {
      hitted = true;
      let x = this.x + this.w / 2;
      let xx = that.x + that.w / 2;
      let diff = x - xx;
      if (Math.abs(diff) <= that.w / 4) {
        this.vel[1] = -this.vel[1];
      } else if (diff > 0) {
        let normal = [0.196, -0.981];
        let dn = 2 * (this.vel[0] * normal[0] + this.vel[1] * normal[1]);
        this.vel = this.vel.map((num, idx) => {
          return num - normal[idx] * dn;
        });
      } else if (diff < 0) {
        let normal = [-0.196, -0.981];
        let dn = 2 * (this.vel[0] * normal[0] + this.vel[1] * normal[1]);
        this.vel = this.vel.map((num, idx) => {
          return num - normal[idx] * dn;
        });
      }
    }
  }

  collides(that) {
    let leftTop1 = [this.x, this.y];
    let rightTop1 = [this.x + this.w, this.y];
    let leftBottom1 = [this.x, this.y + this.h];
    let rightBottom1 = [this.x + this.w, this.y + this.h];

    let leftTop2 = [that.x, that.y];
    let rightTop2 = [that.x + that.w, that.y];
    let leftBottom2 = [that.x, that.y + that.h];
    let rightBottom2 = [that.x + that.w, that.y + that.h];

    let directions = [
      [0, -1],
      [-1, 0],
      [0, 1],
      [1, 0],
    ];
    let neighbors = [];

    let p = this.indexBlock;
    let pos = [Math.floor(p / N_COLS), Math.floor(p % N_COLS)];
    for (let dir of directions) {
      let i =
        pos[0] + dir[0] > 0 && pos[0] + dir[0] < N_TIER ? pos[0] + dir[0] : -1;
      let j =
        pos[1] + dir[1] > 0 && pos[1] + dir[1] < N_COLS ? pos[1] + dir[1] : -1;
      neighbors.push([j + i * N_COLS]);
    }

    let ballArea = [
      [leftTop1, rightTop1],
      [rightTop1, rightBottom1],
      [rightBottom1, leftBottom1],
      [leftBottom1, leftTop1],
    ];

    if (leftTop1[0] > rightBottom2[0] || leftTop2[0] > rightBottom1[0]) {
      return false;
    }

    if (leftTop1[1] > rightBottom2[1] || leftTop2[1] > rightBottom1[1]) {
      return false;
    }

    for (let segment of ballArea) {
      if (
        (neighbors[0] > 0 && blocks[neighbors[0]].state == "dead") ||
        neighbors[0] < 0
      ) {
        if (intersect(segment[0], segment[1], leftTop2, leftBottom2)) {
          if (this.vel[0] > 0) this.vel[0] = -this.vel[0];
          break;
        }
      }
    }
    for (let segment of ballArea) {
      if (
        (neighbors[2] > 0 && blocks[neighbors[2]].state == "dead") ||
        neighbors[2] < 0
      ) {
        if (intersect(segment[0], segment[1], rightTop2, rightBottom2)) {
          if (this.vel[0] < 0) this.vel[0] = -this.vel[0];
          break;
        }
      }
    }
    for (let segment of ballArea) {
      if (
        (neighbors[1] > 0 && blocks[neighbors[1]].state == "dead") ||
        neighbors[1] < 0
      ) {
        if (intersect(segment[0], segment[1], leftTop2, rightTop2)) {
          if (this.vel[1] > 0) this.vel[1] = -this.vel[1];
          break;
        }
      }
    }
    for (let segment of ballArea) {
      if (
        (neighbors[3] > 0 && blocks[neighbors[3]].state == "dead") ||
        neighbors[3] < 0
      ) {
        if (intersect(segment[0], segment[1], leftBottom2, rightBottom2)) {
          if (this.vel[1] < 0) this.vel[1] = -this.vel[1];
          break;
        }
      }
    }
    return true;
  }

  move(type) {
    let pos = this.indexPosition;
    if (type == "paddle") {
      if (this.x < 0 || this.x + this.w >= canvas.width) {
        if (
          (this.x < 0 && this.vel[0] < 0) ||
          (this.x + this.w >= canvas.width && this.vel[0] > 0)
        ) {
          this.vel = [0, 0];
        }
      }
      this.x += this.vel[0];
      this.y += this.vel[1];
      for (let i = 0; i < 12; i++) {
        if (i % 2 == 0) positions[pos + i] += this.vel[0];
        if (i % 2 == 1) positions[pos + i] += this.vel[1];
      }
    } else if (type == "ball") {
      this.x += this.vel[0];
      this.y += this.vel[1];

      this.detectCollision();

      if (this.x < 0 || this.x + this.w >= canvas.width)
        this.vel[0] = -this.vel[0];
      if (this.y < 0 || this.y + this.h >= canvas.height)
        this.vel[1] = -this.vel[1];

      if (this.y + this.h >= canvas.height) {
        let l = canvas.width / 2 + gWidth / 2;
        let b = canvas.height - 100;
        let r = l + this.w;
        let t = b + this.h;
        this.x = l;
        this.y = b;
        positions[pos + 0] = l;
        positions[pos + 1] = b;
        positions[pos + 2] = r;
        positions[pos + 3] = b;
        positions[pos + 4] = r;
        positions[pos + 5] = t;

        positions[pos + 6] = l;
        positions[pos + 7] = b;
        positions[pos + 8] = l;
        positions[pos + 9] = t;
        positions[pos + 10] = r;
        positions[pos + 11] = t;
        this.vel = [this.vel[0], -maxVel];
        lives--;
      } else {
        for (let i = 0; i < 12; i++) {
          if (i % 2 == 0) positions[pos + i] += this.vel[0];
          if (i % 2 == 1) positions[pos + i] += this.vel[1];
        }
      }
    }
  }

  draw(pos) {
    let l = this.x;
    let b = this.y;
    let r = l + this.w;
    let t = b + this.h;

    pos.push(l);
    pos.push(b);
    pos.push(r);
    pos.push(b);
    pos.push(r);
    pos.push(t);

    pos.push(l);
    pos.push(b);
    pos.push(l);
    pos.push(t);
    pos.push(r);
    pos.push(t);

    for (let j = this.indexColor; j < this.indexColor + 18; j += 3) {
      blockColors[j] = this.color[0];
      blockColors[j + 1] = this.color[1];
      blockColors[j + 2] = this.color[2];
    }
  }
}

function generateRects(n) {
  let blocks = [];
  let k = 0;
  let j = 0;
  for (let i = 0; i < n; i++) {
    let x = Math.floor(i % N_COLS);
    let y = Math.floor(i / N_COLS);
    let idx = y;
    let color = colorList[idx];
    x = x * gWidth;
    y = y * gHeight;
    let r = new Rect(x, y, gWidth, gHeight, color, j, k, i);
    j += 18;
    k += 12;
    blocks.push(r);
  }
  return blocks;
}

function drawItAll(blocks, positions) {
  let n = blocks.length;
  for (let i = 0; i < n; i++) {
    blocks[i].draw(positions);
  }
}

function _map(input, loInput, hiInput, loOutput, hiOutput) {
  let slope = (hiOutput - loOutput) / (hiInput - loInput);
  return loOutput + slope * (input - loInput);
}

/*
 * Shaders
 */

/* vertex shader */
let vertexShaderSrc = `#version 300 es 
// Color attributes
in vec3 a_color;
out vec3 v_color;

// atributos
in vec2 aPosition;
// Uniformes
uniform vec2 uResolucao;

// Vetor de Translacao;
uniform vec2 uTranslation;

// Parametros de rotacao
uniform vec2 uRotation;

// Parametros de escala
uniform vec2 uScale;

void main() {
    vec2 scaled = aPosition * uScale;

    vec2 rotated = vec2(
        scaled.x * uRotation.y + scaled.y * uRotation.x,
        scaled.y * uRotation.y - scaled.x * uRotation.x);

    vec2 position = rotated + uTranslation;

    // converte pixel para [-1.0,+1.0]
    vec2 zeroToOne = position / uResolucao;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    v_color = a_color;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`;

/*fragment shader*/

let fragmentShaderSrc = `#version 300 es
//
precision highp float;

in vec3 v_color;
out vec4 outColor;
// uniform vec4 uColor;

void main() {
  outColor = vec4(v_color, 1.0);
}
`;
