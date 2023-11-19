/*
===========================================================
Author: Matheus Santos
Date: 15/06/2021

Utilitaries functions to deal with webGl shaders

===========================================================
*/
// make program  => compile and link shaders

function makeProgram(gl, vertexShaderSrc, fragmentShaderSrc) {
  // Compilar e linkar os shaders
  var vertexShader = compile(gl, gl.VERTEX_SHADER, vertexShaderSrc);
  var fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
  var program = link(gl, vertexShader, fragmentShader);
  if (program) {
    return program;
  }
  alert("ERRO: na criação do programa.");
}

// ========================================================
// Compile shaders
function compile(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var deuCerto = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (deuCerto) {
    return shader;
  }
  // mostra o erro
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader); // cleanup
}

// ========================================================
// Link Shaders
function link(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  var deuCerto = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (deuCerto) {
    return program;
  }

  console.log(gl.ProgramInfoLog(program));
  gl.deleteProgram(program);
}

// ========================================================
//
var m3 = {
  translation: function (tx, ty) {
    return [1, 0, 0, 0, 1, 0, tx, ty, 1];
  },

  rotation: function (angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [c, -s, 0, s, c, 0, 0, 0, 1];
  },

  scaling: function (sx, sy) {
    return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
  },

  multiply: function (a, b) {
    var a00 = a[0 * 3 + 0];
    var a01 = a[0 * 3 + 1];
    var a02 = a[0 * 3 + 2];
    var a10 = a[1 * 3 + 0];
    var a11 = a[1 * 3 + 1];
    var a12 = a[1 * 3 + 2];
    var a20 = a[2 * 3 + 0];
    var a21 = a[2 * 3 + 1];
    var a22 = a[2 * 3 + 2];
    var b00 = b[0 * 3 + 0];
    var b01 = b[0 * 3 + 1];
    var b02 = b[0 * 3 + 2];
    var b10 = b[1 * 3 + 0];
    var b11 = b[1 * 3 + 1];
    var b12 = b[1 * 3 + 2];
    var b20 = b[2 * 3 + 0];
    var b21 = b[2 * 3 + 1];
    var b22 = b[2 * 3 + 2];

    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  },
};
