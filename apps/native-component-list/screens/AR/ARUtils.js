function loadShader(gl, type, source) {
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
  const vertShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(program)}`);
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
  if ((errorCode = gl.getError())) {
    console.warn(
      `${logPrefix ? `[${String(logPrefix).toUpperCase()}]` : ''} GL error occured: ${codes[
        errorCode
      ] || codes.default}`
    );
    return false;
  }
  return true;
}

function getParameter(gl, parameter, name) {
  const result = gl.getParameter(parameter);
  checkGLError(gl, `PARAMETER ERROR: ${name}`);
  return result;
}

export function currentGLState(gl, logPrefix) {
  const cullFaceModes = {
    [gl.FRONT]: 'gl.FRONT',
    [gl.BACK]: 'gl.BACK',
    [gl.FRONT_AND_BACK]: 'gl.FRONT_AND_BACK',
  };
  const frontFaces = {
    [gl.CW]: 'gl.CW',
    [gl.CCW]: 'gl.CCW',
  };
  const depthFuncs = {
    [gl.GL_NEVER]: 'gl.GL_NEVER',
    [gl.GL_LESS]: 'gl.GL_LESS',
    [gl.GL_EQUAL]: 'gl.GL_LESS',
    [gl.GL_LEQUAL]: 'gl.GL_LESS',
    [gl.GL_GREATER]: 'gl.GL_LESS',
    [gl.GL_NOTEQUAL]: 'gl.GL_NOTEQUAL',
    [gl.GL_GEQUAL]: 'gl.GL_NOTEQUAL',
    [gl.GL_ALWAYS]: 'gl.GL_NOTEQUAL',
  };
  const drawBuffers = {
    [gl.BACK]: 'gl.BACK',
    [gl.NONE]: 'gl.NONE',
    [gl.COLOR_ATTACHMENT0]: 'gl.COLOR_ATTACHMENT0',
    [gl.COLOR_ATTACHMENT1]: 'gl.COLOR_ATTACHMENT1',
    [gl.COLOR_ATTACHMENT2]: 'gl.COLOR_ATTACHMENT2',
    [gl.COLOR_ATTACHMENT3]: 'gl.COLOR_ATTACHMENT3',
    [gl.COLOR_ATTACHMENT4]: 'gl.COLOR_ATTACHMENT4',
    [gl.COLOR_ATTACHMENT5]: 'gl.COLOR_ATTACHMENT5',
    [gl.COLOR_ATTACHMENT6]: 'gl.COLOR_ATTACHMENT6',
    [gl.COLOR_ATTACHMENT7]: 'gl.COLOR_ATTACHMENT7',
    [gl.COLOR_ATTACHMENT8]: 'gl.COLOR_ATTACHMENT8',
    [gl.COLOR_ATTACHMENT9]: 'gl.COLOR_ATTACHMENT9',
    [gl.COLOR_ATTACHMENT10]: 'gl.COLOR_ATTACHMENT10',
    [gl.COLOR_ATTACHMENT11]: 'gl.COLOR_ATTACHMENT11',
    [gl.COLOR_ATTACHMENT12]: 'gl.COLOR_ATTACHMENT12',
    [gl.COLOR_ATTACHMENT13]: 'gl.COLOR_ATTACHMENT13',
    [gl.COLOR_ATTACHMENT14]: 'gl.COLOR_ATTACHMENT14',
    [gl.COLOR_ATTACHMENT15]: 'gl.COLOR_ATTACHMENT15',
  };
  const result = {
    // WebGL1
    activeTexture: getParameter(gl, gl.ACTIVE_TEXTURE, 'gl.ACTIVE_TEXTURE'),
    arrayBufferBinding: getParameter(gl, gl.ARRAY_BUFFER_BINDING, 'gl.ARRAY_BUFFER_BINDING'),
    blend: getParameter(gl, gl.BLEND, 'gl.BLEND'),
    // colorClearValue: getParameter(gl, gl.COLOR_CLEAR_VALUE),
    cullFace: getParameter(gl, gl.CULL_FACE, 'gl.CULL_FACE'),
    cullFaceMode: cullFaceModes[getParameter(gl, gl.CULL_FACE_MODE, 'gl.CULL_FACE_MODE')],
    currentProgram: getParameter(gl, gl.CURRENT_PROGRAM, 'gl.CURRENT_PROGRAM'),
    // depthFunc: depthFuncs[getParameter(gl, gl.DEPTH_FUNC)],
    depthTest: getParameter(gl, gl.DEPTH_TEST, 'gl.DEPTH_TEST'),
    // depthWritemask: getParameter(gl, gl.DEPTH_WRITEMASK),
    dither: getParameter(gl, gl.DITHER, 'gl.DITHER'),
    elementArrayBufferBinding: getParameter(gl, gl.ELEMENT_ARRAY_BUFFER_BINDING, 'gl.ELEMENT_ARRAY_BUFFER_BINDING'),
    frontFace: frontFaces[getParameter(gl, gl.FRONT_FACE, 'gl.FRONT_FACE')],
    // maxCombinedTextureImageUnits: getParameter(gl, gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
    // maxRenderbufferSize: getParameter(gl, gl.MAX_RENDERBUFFER_SIZE),
    // maxTextureImageUnits: getParameter(gl, gl.MAX_TEXTURE_IMAGE_UNITS),
    // maxTextureSize: getParameter(gl, gl.MAX_TEXTURE_SIZE),
    // maxViewportDims: getParameter(gl, gl.MAX_VIEWPORT_DIMS),
    renderbufferBinding: getParameter(gl, gl.RENDERBUFFER_BINDING, 'gl.RENDERBUFFER_BINDING'),
    renderbuffer: getParameter(gl, gl.RENDERER, 'gl.RENDERER'),
    scissorBox: getParameter(gl, gl.SCISSOR_BOX, 'gl.SCISSOR_BOX'),
    scissorTest: getParameter(gl, gl.SCISSOR_TEST, 'gl.SCISSOR_TEST'),
    // shadingLanguageVersion: getParameter(gl, gl.SHADING_LANGUAGE_VERSION),
    stencilTest: getParameter(gl, gl.STENCIL_TEST, 'gl.STENCIL_TEST'),
    // vendor: getParameter(gl, gl.VENDOR),
    // version: getParameter(gl, gl.VERSION),
    // viewport: getParameter(gl, gl.VIEWPORT),

    // WebGL2
    drawBuffer0: drawBuffers[getParameter(gl, gl.DRAW_BUFFER0, 'gl.DRAW_BUFFER1')],
    drawBuffer1: drawBuffers[getParameter(gl, gl.DRAW_BUFFER1, 'gl.DRAW_BUFFER2')],
    pixelPackBufferBinding: getParameter(gl, gl.PIXEL_PACK_BUFFER_BINDING, 'gl.PIXEL_PACK_BUFFER_BINDING'),
    pixelUnpackBufferBinding: getParameter(gl, gl.PIXEL_UNPACK_BUFFER_BINDING, 'gl.PIXEL_UNPACK_BUFFER_BINDING'),
    rasterizedDiscard: getParameter(gl, gl.RASTERIZER_DISCARD, 'gl.RASTERIZER_DISCARD'),
    readBuffer: getParameter(gl, gl.READ_BUFFER, 'gl.READ_BUFFER'),
    sampleCoverage: getParameter(gl, gl.SAMPLE_COVERAGE, 'gl.SAMPLE_COVERAGE'),
    transformFeedbackActive: getParameter(gl, gl.TRANSFORM_FEEDBACK_ACTIVE, 'gl.TRANSFORM_FEEDBACK_ACTIVE'),
  };
  if (logPrefix) {
    console.log(
      `\n ### ${
        logPrefix ? `[${String(logPrefix).toUpperCase()}]` : ''
      } ### \n GL PARAMS: ${JSON.stringify(result, '', 2)} \n`
    );
  }
  return result;
}

function deepEqual(a, b) {
  if (typeof a == 'object' && a != null && typeof b == 'object' && b != null) {
    const count = [Object.keys(a).length, Object.keys(b).length];
    if (count[0] - count[1] !== 0) {
      return false;
    }
    for (let key in a) {
      if (!(key in b) || !deepEqual(a[key], b[key])) {
        return false;
      }
    }
    for (let key in b) {
      if (!(key in a) || !deepEqual(b[key], a[key])) {
        return false;
      }
    }
    return true;
  } else {
    return a === b;
  }
}

export function compareGLState(storedState, currentState) {
  const stateDiffrence = {};
  Object.keys(storedState).forEach(key => {
    if (!deepEqual(storedState[key], currentState[key])) {
      stateDiffrence[key] = {
        previous: storedState[key],
        current: currentState[key],
      };
    }
  });
  return stateDiffrence;
}
