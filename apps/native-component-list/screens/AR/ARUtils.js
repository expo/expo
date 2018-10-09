loadShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = `An error occured compiling shaders: ${gl.getShaderInfoLog(shader)}`;
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export function initShaderProgram(gl, vertexShaderSource, fragmentShaderSource) {
  // create shaders and program
  const program = gl.createProgram();
  const vertShader = this.loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Unable to initialize the sahder program: ${gl.getProgramInfoLog(program)}`);
  }
  return program;
}

export function checkGLError(gl, logPrefix) {
  const codes = {
    [gl.INVALID_ENUM]: 'INVALID_ENUM',
    [gl.INVALID_VALUE]: 'INVALID_VALUE',
    [gl.INVALID_OPERATION]: 'INVALID_OPERATION',
    [gl.INVALID_FRAMEBUFFER_OPERATION]: 'INVALID_FRAMEBUFFER_OPERATION',
    [gl.OUT_OF_MEMORY]: 'OUT_OF_MEMORY',
    [gl.CONTEXT_LOST_WEBGL]: 'CONTEXT_LOST_WEBGL',
    [gl.NO_ERROR]: 'NO_ERROR',
    default: 'NOT RECOGNISED ERROR',
  };
  let errorCode;
  while ((errorCode = gl.getError())) {
    console.warn(`${logPrefix ? `[${String(logPrefix).toUpperCase()}]` : ''} GL error occured: ${codes[errorCode] || codes.default}`);
  }
}