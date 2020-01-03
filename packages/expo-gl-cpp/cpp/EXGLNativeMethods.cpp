#include "EXGLContext.h"

// Standard method wrapper, run on JS thread, return a value
#define _WRAP_METHOD_INTERNAL(name, minArgc, requiresWebGL2)                                            \
  JSValueRef EXGLContext::exglNativeStatic_##name(JSContextRef jsCtx,                                   \
                                            JSObjectRef jsFunction,                                     \
                                            JSObjectRef jsThis,                                         \
                                            size_t jsArgc,                                              \
                                            const JSValueRef jsArgv[],                                  \
                                            JSValueRef* jsException)                                    \
  {                                                                                                     \
    auto exglCtx = EXGLContext::ContextGet((UEXGLContextId) (intptr_t)                                  \
                                  JSObjectGetPrivate(jsThis));                                          \
    if (!exglCtx) {                                                                                     \
      return nullptr;                                                                                   \
    }                                                                                                   \
    try {                                                                                               \
      if (jsArgc < minArgc) {                                                                           \
        throw std::runtime_error("EXGL: Too few arguments to " #name "()!");                            \
      }                                                                                                 \
      if (requiresWebGL2 && !exglCtx->supportsWebGL2) {                                                 \
        throw std::runtime_error("EXGL: This device doesn't support WebGL2 method: " #name "()!");      \
      }                                                                                                 \
      return exglCtx->exglNativeInstance_##name(jsCtx, jsFunction, jsThis,                              \
                                                jsArgc, jsArgv, jsException);                           \
    } catch (const std::exception &e) {                                                                 \
      exglCtx->jsThrow(jsCtx, e.what(), jsException);                                                   \
      return nullptr;                                                                                   \
    }                                                                                                   \
  }                                                                                                     \
  JSValueRef EXGLContext::exglNativeInstance_##name(JSContextRef jsCtx,                                 \
                                              JSObjectRef jsFunction,                                   \
                                              JSObjectRef jsThis,                                       \
                                              size_t jsArgc,                                            \
                                              const JSValueRef jsArgv[],                                \
                                              JSValueRef* jsException)

#define _WRAP_METHOD(name, minArgc) _WRAP_METHOD_INTERNAL(name, minArgc, false)
#define _WRAP_WEBGL2_METHOD(name, minArgc) _WRAP_METHOD_INTERNAL(name, minArgc, true)

  // Wrapper raises an exception saying the function isn't implemented yet
#define _WRAP_METHOD_UNIMPL(name)                                       \
  _WRAP_METHOD(name, 0) {                                               \
    throw std::runtime_error("EXGL: " #name "() isn't implemented yet!"); \
    return nullptr;                                                     \
  }

  // Wrapper that takes only scalar arguments and returns nothing
#define _WRAP_METHOD_SIMPLE_INTERNAL(name, isWebGL2Method, glFunc, ...) \
  _WRAP_METHOD_INTERNAL(name, EXJS_ARGC(__VA_ARGS__), isWebGL2Method) { \
    addToNextBatch(std::bind(glFunc, EXJS_MAP_EXT(0, _EXJS_COMMA, _WRAP_METHOD_SIMPLE_UNPACK, __VA_ARGS__))); \
    return nullptr;                                                     \
  }
#define _WRAP_METHOD_SIMPLE(name, glFunc, ...) _WRAP_METHOD_SIMPLE_INTERNAL(name, false, glFunc, __VA_ARGS__)
#define _WRAP_WEBGL2_METHOD_SIMPLE(name, glFunc, ...) _WRAP_METHOD_SIMPLE_INTERNAL(name, true, glFunc, __VA_ARGS__)

#define _WRAP_METHOD_SIMPLE_UNPACK(i, _) EXJSValueToNumberFast(jsCtx, jsArgv[i])


// This listing follows the order in
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext


// The WebGL context
// -----------------

_WRAP_METHOD(getContextAttributes, 0) {
  auto jsResult = JSObjectMake(jsCtx, nullptr, nullptr);
  EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "alpha",
                                        JSValueMakeBoolean(jsCtx, true));
  EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "depth",
                                        JSValueMakeBoolean(jsCtx, true));
  EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "stencil",
                                        JSValueMakeBoolean(jsCtx, false));
  EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "antialias",
                                        JSValueMakeBoolean(jsCtx, false));
  EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "premultipliedAlpha",
                                        JSValueMakeBoolean(jsCtx, false));
  return jsResult;
}

_WRAP_METHOD(isContextLost, 0) {
  return JSValueMakeBoolean(jsCtx, false);
}


// Viewing and clipping
// --------------------

_WRAP_METHOD_SIMPLE(scissor, glScissor, x, y, width, height)

_WRAP_METHOD_SIMPLE(viewport, glViewport, x, y, width, height)


// State information
// -----------------

_WRAP_METHOD_SIMPLE(activeTexture, glActiveTexture, texture)

_WRAP_METHOD_SIMPLE(blendColor, glBlendColor, red, green, blue, alpha)

_WRAP_METHOD_SIMPLE(blendEquation, glBlendEquation, mode)

_WRAP_METHOD_SIMPLE(blendEquationSeparate, glBlendEquationSeparate, modeRGB, modeAlpha)

_WRAP_METHOD_SIMPLE(blendFunc, glBlendFunc, sfactor, dfactor)

_WRAP_METHOD_SIMPLE(blendFuncSeparate, glBlendFuncSeparate, srcRGB, dstRGB, srcAlpha, dstAlpha)

_WRAP_METHOD_SIMPLE(clearColor, glClearColor, red, green, blue, alpha)

_WRAP_METHOD_SIMPLE(clearDepth, glClearDepthf, depth)

_WRAP_METHOD_SIMPLE(clearStencil, glClearStencil, s)

_WRAP_METHOD_SIMPLE(colorMask, glColorMask, red, green, blue, alpha)

_WRAP_METHOD_SIMPLE(cullFace, glCullFace, mode)

_WRAP_METHOD_SIMPLE(depthFunc, glDepthFunc, func)

_WRAP_METHOD_SIMPLE(depthMask, glDepthMask, flag)

_WRAP_METHOD_SIMPLE(depthRange, glDepthRangef, zNear, zFar)

_WRAP_METHOD_SIMPLE(disable, glDisable, cap)

_WRAP_METHOD_SIMPLE(enable, glEnable, cap)

_WRAP_METHOD_SIMPLE(frontFace, glFrontFace, mode)

_WRAP_METHOD(getParameter, 1) {
  EXJS_UNPACK_ARGV(GLenum pname);
  switch (pname) {
      // Float32Array[0]
    case GL_COMPRESSED_TEXTURE_FORMATS:
      return makeTypedArray(jsCtx, kJSTypedArrayTypeFloat32Array, nullptr, 0);

      // FLoat32Array[2]
    case GL_ALIASED_LINE_WIDTH_RANGE:
    case GL_ALIASED_POINT_SIZE_RANGE:
    case GL_DEPTH_RANGE:
      return getParameterArray<GLfloat, 2>(jsCtx, kJSTypedArrayTypeFloat32Array, &glGetFloatv, pname);
      // FLoat32Array[4]
    case GL_BLEND_COLOR:
    case GL_COLOR_CLEAR_VALUE:
      return getParameterArray<GLfloat, 4>(jsCtx, kJSTypedArrayTypeFloat32Array, &glGetFloatv, pname);

      // Int32Array[2]
    case GL_MAX_VIEWPORT_DIMS:
      return getParameterArray<GLint, 2>(jsCtx, kJSTypedArrayTypeInt32Array, &glGetIntegerv, pname);
      // Int32Array[4]
    case GL_SCISSOR_BOX:
    case GL_VIEWPORT:
      return getParameterArray<GLint, 4>(jsCtx, kJSTypedArrayTypeInt32Array, &glGetIntegerv, pname);

      // boolean[4]
    case GL_COLOR_WRITEMASK: {
      GLint glResults[4];
      addBlockingToNextBatch([&] { glGetIntegerv(pname, glResults); });
      JSValueRef jsResults[4];
      for (unsigned int i = 0; i < 4; ++i) {
        jsResults[i] = JSValueMakeBoolean(jsCtx, glResults[i]);
      }
      return JSObjectMakeArray(jsCtx, 4, jsResults, nullptr);
    }

      // boolean
    case GL_UNPACK_FLIP_Y_WEBGL:
      return JSValueMakeBoolean(jsCtx, unpackFLipY);
    case GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL:
    case GL_UNPACK_COLORSPACE_CONVERSION_WEBGL:
      return JSValueMakeBoolean(jsCtx, false);
    case GL_RASTERIZER_DISCARD:
    case GL_SAMPLE_ALPHA_TO_COVERAGE:
    case GL_SAMPLE_COVERAGE:
    case GL_TRANSFORM_FEEDBACK_ACTIVE:
    case GL_TRANSFORM_FEEDBACK_PAUSED: {
      GLint glResult;
      addBlockingToNextBatch([&] { glGetIntegerv(pname, &glResult); });
      return JSValueMakeBoolean(jsCtx, glResult);
    }

      // string
    case GL_RENDERER:
    case GL_SHADING_LANGUAGE_VERSION:
    case GL_VENDOR:
    case GL_VERSION: {
      const GLubyte *glStr;
      addBlockingToNextBatch([&] { glStr = glGetString(pname); });
      return EXJSValueMakeStringFromUTF8CString(jsCtx, (const char *) glStr);
    }

      // float
    case GL_DEPTH_CLEAR_VALUE:
    case GL_LINE_WIDTH:
    case GL_POLYGON_OFFSET_FACTOR:
    case GL_POLYGON_OFFSET_UNITS:
    case GL_SAMPLE_COVERAGE_VALUE:
    case GL_MAX_TEXTURE_LOD_BIAS: {
      GLfloat glFloat;
      addBlockingToNextBatch([&] { glGetFloatv(pname, &glFloat); });
      return JSValueMakeNumber(jsCtx, glFloat);
    }

      // UEXGLObjectId
    case GL_ARRAY_BUFFER_BINDING:
    case GL_ELEMENT_ARRAY_BUFFER_BINDING:
    case GL_CURRENT_PROGRAM: {
      GLint glInt;
      addBlockingToNextBatch([&] { glGetIntegerv(pname, &glInt); });
      for (const auto &pair : objects) {
        if (pair.second == glInt) {
          return JSValueMakeNumber(jsCtx, pair.first);
        }
      }
      return nullptr;
    }

      // Unimplemented...
#define _GET_PARAMETER_UNIMPL(param)                                         \
    case GL_##param:                                                       \
      throw std::runtime_error("EXGL: getParameter() doesn't support gl."  \
                               #param " yet!");
      _GET_PARAMETER_UNIMPL(COPY_READ_BUFFER_BINDING)
      _GET_PARAMETER_UNIMPL(COPY_WRITE_BUFFER_BINDING)
      _GET_PARAMETER_UNIMPL(DRAW_FRAMEBUFFER_BINDING)
      _GET_PARAMETER_UNIMPL(READ_FRAMEBUFFER_BINDING)
      _GET_PARAMETER_UNIMPL(RENDERBUFFER)
      _GET_PARAMETER_UNIMPL(SAMPLER_BINDING)
      _GET_PARAMETER_UNIMPL(TEXTURE_BINDING_2D_ARRAY)
      _GET_PARAMETER_UNIMPL(TEXTURE_BINDING_2D)
      _GET_PARAMETER_UNIMPL(TEXTURE_BINDING_3D)
      _GET_PARAMETER_UNIMPL(TEXTURE_BINDING_CUBE_MAP)
      _GET_PARAMETER_UNIMPL(TRANSFORM_FEEDBACK_BINDING)
      _GET_PARAMETER_UNIMPL(TRANSFORM_FEEDBACK_BUFFER_BINDING)
      _GET_PARAMETER_UNIMPL(UNIFORM_BUFFER_BINDING)
      _GET_PARAMETER_UNIMPL(VERTEX_ARRAY_BINDING)
#undef _GET_PARAMETER_UNIMPL

      // int
    default: {
      GLint glInt;
      addBlockingToNextBatch([&] { glGetIntegerv(pname, &glInt); });
      return JSValueMakeNumber(jsCtx, glInt);
    }
  }
}

_WRAP_METHOD(getError, 0) {
  GLenum glResult;
  addBlockingToNextBatch([&] { glResult = glGetError(); });
  return JSValueMakeNumber(jsCtx, glResult);
}

_WRAP_METHOD_SIMPLE(hint, glHint, target, mode)

_WRAP_METHOD(isEnabled, 1) {
  EXJS_UNPACK_ARGV(GLenum cap);
  GLboolean glResult;
  addBlockingToNextBatch([&] { glResult = glIsEnabled(cap); });
  return JSValueMakeBoolean(jsCtx, glResult);
}

_WRAP_METHOD_SIMPLE(lineWidth, glLineWidth, width)

_WRAP_METHOD(pixelStorei, 2) {
  EXJS_UNPACK_ARGV(GLenum pname, GLint param);
  switch (pname) {
    case GL_UNPACK_FLIP_Y_WEBGL:
      unpackFLipY = param;
      break;
    default:
      EXGLSysLog("EXGL: gl.pixelStorei() doesn't support this parameter yet!");
      break;
  }
  return nullptr;
}

_WRAP_METHOD_SIMPLE(polygonOffset, glPolygonOffset, factor, units)

_WRAP_METHOD_SIMPLE(sampleCoverage, glSampleCoverage, value, invert)

_WRAP_METHOD_SIMPLE(stencilFunc, glStencilFunc, func, ref, mask)

_WRAP_METHOD_SIMPLE(stencilFuncSeparate, glStencilFuncSeparate, face, func, ref, mask)

_WRAP_METHOD_SIMPLE(stencilMask, glStencilMask, mask)

_WRAP_METHOD_SIMPLE(stencilMaskSeparate, glStencilMaskSeparate, face, mask)

_WRAP_METHOD_SIMPLE(stencilOp, glStencilOp, fail, zfail, zpass)

_WRAP_METHOD_SIMPLE(stencilOpSeparate, glStencilOpSeparate, face, fail, zfail, zpass)


// Buffers
// -------

_WRAP_METHOD(bindBuffer, 2) {
  EXJS_UNPACK_ARGV(GLenum target, UEXGLObjectId fBuffer);
  addToNextBatch([=] { glBindBuffer(target, lookupObject(fBuffer)); });
  return nullptr;
}

_WRAP_METHOD(bufferData, 3) {
  GLenum target = EXJSValueToNumberFast(jsCtx, jsArgv[0]);
  auto jsSecond = jsArgv[1];
  GLenum usage = EXJSValueToNumberFast(jsCtx, jsArgv[2]);

  if (JSValueIsNumber(jsCtx, jsSecond)) {
    GLsizeiptr length = EXJSValueToNumberFast(jsCtx, jsSecond);
    addToNextBatch([=] { glBufferData(target, length, nullptr, usage); });
  } else if (JSValueIsNull(jsCtx, jsSecond)) {
    addToNextBatch([=] { glBufferData(target, 0, nullptr, usage); });
  } else {
    size_t length;
    auto data = jsValueToSharedArray(jsCtx, jsSecond, &length);
    addToNextBatch([=] { glBufferData(target, length, data.get(), usage); });
  }
  return nullptr;
}

_WRAP_METHOD(bufferSubData, 3) {
  if (!JSValueIsNull(jsCtx, jsArgv[2])) {
    EXJS_UNPACK_ARGV(GLenum target, GLintptr offset);
    size_t length;
    auto data = jsValueToSharedArray(jsCtx, jsArgv[2], &length);
    addToNextBatch([=] { glBufferSubData(target, offset, length, data.get()); });
  }
  return nullptr;
}

_WRAP_METHOD(createBuffer, 0) {
  return addFutureToNextBatch(jsCtx, [] {
    GLuint buffer;
    glGenBuffers(1, &buffer);
    return buffer;
  });
}

_WRAP_METHOD(deleteBuffer, 1) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fBuffer);
  addToNextBatch([=] {
    GLuint buffer = lookupObject(fBuffer);
    glDeleteBuffers(1, &buffer);
  });
  return nullptr;
}

_WRAP_METHOD(getBufferParameter, 2) {
  EXJS_UNPACK_ARGV(GLenum target, GLenum pname);
  GLint glResult;
  addBlockingToNextBatch([&] { glGetBufferParameteriv(target, pname, &glResult); });
  return JSValueMakeNumber(jsCtx, glResult);
}

#define _WRAP_METHOD_IS_OBJECT_INTERNAL(type, requiresWebGL2) \
_WRAP_METHOD_INTERNAL(is ## type, 1, requiresWebGL2) { \
  EXJS_UNPACK_ARGV(UEXGLObjectId f);            \
  GLboolean glResult;                           \
  addBlockingToNextBatch([&] {                  \
    glResult = glIs ## type(lookupObject(f));   \
  });                                           \
  return JSValueMakeBoolean(jsCtx, glResult);   \
}

#define _WRAP_METHOD_IS_OBJECT(type)        _WRAP_METHOD_IS_OBJECT_INTERNAL(type, false)
#define _WRAP_WEBGL2_METHOD_IS_OBJECT(type) _WRAP_METHOD_IS_OBJECT_INTERNAL(type, true)

_WRAP_METHOD_IS_OBJECT(Buffer)


// Buffers (WebGL2)

_WRAP_WEBGL2_METHOD_SIMPLE(copyBufferSubData, glCopyBufferSubData,
                    readTarget, writeTarget, readOffset, writeOffset, size)

// glGetBufferSubData is not available in OpenGL ES
_WRAP_METHOD_UNIMPL(getBufferSubData)


// Framebuffers
// ------------

_WRAP_METHOD(bindFramebuffer, 2) {
  EXJS_UNPACK_ARGV(GLenum target);
  if (JSValueIsNull(jsCtx, jsArgv[1])) {
    addToNextBatch([=] { glBindFramebuffer(target, defaultFramebuffer); });
  } else {
    UEXGLObjectId fFramebuffer = EXJSValueToNumberFast(jsCtx, jsArgv[1]);
    addToNextBatch([=] { glBindFramebuffer(target, lookupObject(fFramebuffer)); });
  }
  return nullptr;
}

_WRAP_METHOD(checkFramebufferStatus, 1) {
  GLenum glResult;
  EXJS_UNPACK_ARGV(GLenum target);
  addBlockingToNextBatch([&] { glResult = glCheckFramebufferStatus(target); });
  return JSValueMakeNumber(jsCtx, glResult);
}

_WRAP_METHOD(createFramebuffer, 0) {
  return addFutureToNextBatch(jsCtx, [] {
    GLuint framebuffer;
    glGenFramebuffers(1, &framebuffer);
    return framebuffer;
  });
}

_WRAP_METHOD(deleteFramebuffer, 1) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fFramebuffer);
  addToNextBatch([=] {
    GLuint framebuffer = lookupObject(fFramebuffer);
    glDeleteFramebuffers(1, &framebuffer);
  });
  return nullptr;
}

_WRAP_METHOD(framebufferRenderbuffer, 4) {
  EXJS_UNPACK_ARGV(GLenum target, GLenum attachment, GLenum renderbuffertarget, UEXGLObjectId fRenderbuffer);
  addToNextBatch([=] {
    GLuint renderbuffer = lookupObject(fRenderbuffer);
    glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer);
  });
  return nullptr;
}

_WRAP_METHOD(framebufferTexture2D, 5) {
  EXJS_UNPACK_ARGV(GLenum target, GLenum attachment, GLenum textarget, UEXGLObjectId fTexture, GLint level);
  addToNextBatch([=] {
    glFramebufferTexture2D(target, attachment, textarget, lookupObject(fTexture), level);
  });
  return nullptr;
}

_WRAP_METHOD_UNIMPL(getFramebufferAttachmentParameter)

_WRAP_METHOD_IS_OBJECT(Framebuffer)

_WRAP_METHOD(readPixels, 7) {
  EXJS_UNPACK_ARGV(GLint x, GLint y, GLsizei width, GLsizei height, GLenum format, GLenum type);
  if (usingTypedArrayHack) {
    size_t byteLength = width * height * bytesPerPixel(type, format);
    auto pixels = std::shared_ptr<void>(malloc(byteLength), free);
    addBlockingToNextBatch([&] {
      glReadPixels(x, y, width, height, format, type, pixels.get());
    });
    JSObjectSetTypedArrayData(jsCtx, (JSObjectRef) jsArgv[6], pixels.get(), byteLength);
  } else {
    void *pixels = JSObjectGetTypedArrayBytesPtr(jsCtx, (JSObjectRef) jsArgv[6], nullptr);
    addBlockingToNextBatch([&] {
      glReadPixels(x, y, width, height, format, type, pixels);
    });
  }
  return nullptr;
}


// Framebuffers (WebGL2)
// ---------------------

_WRAP_METHOD_SIMPLE(blitFramebuffer, glBlitFramebuffer,
                    srcX0, srcY0, srcX1, srcY1,
                    dstX0, dstY0, dstX1, dstY1,
                    mask, filter)

_WRAP_WEBGL2_METHOD(framebufferTextureLayer, 5) {
  EXJS_UNPACK_ARGV(GLenum target, GLenum attachment, UEXGLObjectId texture, GLint level, GLint layer);
  addToNextBatch([=] {
    glFramebufferTextureLayer(target, attachment, lookupObject(texture), level, layer);
  });
  return nullptr;
}

_WRAP_WEBGL2_METHOD(invalidateFramebuffer, 2) {
  EXJS_UNPACK_ARGV(GLenum target);
  size_t length;
  auto attachments = jsValueToSharedArray(jsCtx, jsArgv[1], &length);
  addToNextBatch([=] {
    glInvalidateFramebuffer(target, (GLsizei) length, (GLenum *) attachments.get());
  });
  return nullptr;
}

_WRAP_WEBGL2_METHOD(invalidateSubFramebuffer, 6) {
  EXJS_UNPACK_ARGV(GLenum target);
  EXJS_UNPACK_ARGV_OFFSET(2, GLint x, GLint y, GLint width, GLint height);
  size_t length;
  auto attachments = jsValueToSharedArray(jsCtx, jsArgv[1], &length);
  addToNextBatch([=] {
    glInvalidateSubFramebuffer(target, (GLsizei) length, (GLenum *) attachments.get(), x, y, width, height);
  });
  return nullptr;
}

_WRAP_WEBGL2_METHOD_SIMPLE(readBuffer, glReadBuffer, mode)


// Renderbuffers
// -------------

_WRAP_METHOD(bindRenderbuffer, 2) {
  EXJS_UNPACK_ARGV(GLenum target, UEXGLObjectId fRenderbuffer);
  addToNextBatch([=] {
    GLuint renderbuffer = lookupObject(fRenderbuffer);
    glBindRenderbuffer(target, renderbuffer);
  });
  return nullptr;
}

_WRAP_METHOD(createRenderbuffer, 0) {
  return addFutureToNextBatch(jsCtx, [] {
    GLuint renderbuffer;
    glGenRenderbuffers(1, &renderbuffer);
    return renderbuffer;
  });
}

_WRAP_METHOD(deleteRenderbuffer, 1) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fRenderbuffer);
  addToNextBatch([=] {
    GLuint renderbuffer = lookupObject(fRenderbuffer);
    glDeleteRenderbuffers(1, &renderbuffer);
  });
  return nullptr;
}

_WRAP_METHOD_UNIMPL(getRenderbufferParameter)

_WRAP_METHOD_IS_OBJECT(Renderbuffer)

_WRAP_METHOD(renderbufferStorage, 4) {
  EXJS_UNPACK_ARGV(GLenum target, GLint internalformat, GLsizei width, GLsizei height);
  addToNextBatch([=] {
    glRenderbufferStorage(target, internalformat, width, height);
  });
  return nullptr;
}


// Renderbuffers (WebGL2)
// ----------------------

_WRAP_METHOD_UNIMPL(getInternalformatParameter)

_WRAP_METHOD_UNIMPL(renderbufferStorageMultisample)


// Textures
// --------

_WRAP_METHOD(bindTexture, 2) {
  EXJS_UNPACK_ARGV(GLenum target);
  if (JSValueIsNull(jsCtx, jsArgv[1])) {
    addToNextBatch(std::bind(glBindTexture, target, 0));
  } else {
    UEXGLObjectId fTexture = EXJSValueToNumberFast(jsCtx, jsArgv[1]);
    addToNextBatch([=] { glBindTexture(target, lookupObject(fTexture)); });
  }
  return nullptr;
}

_WRAP_METHOD_UNIMPL(compressedTexImage2D)

_WRAP_METHOD_UNIMPL(compressedTexSubImage2D)

_WRAP_METHOD_SIMPLE(copyTexImage2D, glCopyTexImage2D,
                    target, level, internalformat,
                    x, y, width, height, border)

_WRAP_METHOD_SIMPLE(copyTexSubImage2D, glCopyTexSubImage2D,
                    target, level,
                    xoffset, yoffset, x, y, width, height)

_WRAP_METHOD(createTexture, 0) {
  return addFutureToNextBatch(jsCtx, [] {
    GLuint texture;
    glGenTextures(1, &texture);
    return texture;
  });
}

_WRAP_METHOD(deleteTexture, 1) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fTexture);
  addToNextBatch([=] {
    GLuint texture = lookupObject(fTexture);
    glDeleteTextures(1, &texture);
  });
  return nullptr;
}

_WRAP_METHOD_SIMPLE(generateMipmap, glGenerateMipmap, target)

_WRAP_METHOD_UNIMPL(getTexParameter)

_WRAP_METHOD_IS_OBJECT(Texture)

_WRAP_METHOD(texImage2D, 6) {
  GLenum target;
  GLint level, internalformat;
  GLsizei width = 0, height = 0, border = 0;
  GLenum format, type;
  JSObjectRef jsPixels;

  if (jsArgc == 9) {
    // 9-argument version
    EXJS_UNPACK_ARGV(target, level, internalformat, width, height, border, format, type);
    jsPixels = (JSObjectRef) jsArgv[8];
  } else if  (jsArgc == 6) {
    // 6-argument version
    EXJS_UNPACK_ARGV(target, level, internalformat, format, type);
    jsPixels = (JSObjectRef) jsArgv[5];
  } else {
    throw std::runtime_error("EXGL: Invalid number of arguments to gl.texImage2D()!");
  }

  // Null?
  if (JSValueIsNull(jsCtx, jsPixels)) {
    addToNextBatch([=] {
      glTexImage2D(target, level, internalformat, width, height, border, format, type, nullptr);
    });
    return nullptr;
  }

  std::shared_ptr<void> data(nullptr);

  // Try TypedArray
  if (jsArgc == 9) {
    data = jsValueToSharedArray(jsCtx, jsPixels, nullptr);
  }

  // Try object with `.localUri` member
  if (!data) {
    data = loadImage(jsCtx, jsPixels, &width, &height, nullptr);
  }

  if (data) {
    if (unpackFLipY) {
      flipPixels((GLubyte *) data.get(), width * bytesPerPixel(type, format), height);
    }
    addToNextBatch([=] {
      glTexImage2D(target, level, internalformat, width, height, border, format, type, data.get());
    });
    return nullptr;
  }

  // Nothing worked...
  throw std::runtime_error("EXGL: Invalid pixel data argument for gl.texImage2D()!");
}

_WRAP_METHOD(texSubImage2D, 7) {
  GLenum target;
  GLint level, xoffset, yoffset;
  GLsizei width = 0, height = 0;
  GLenum format, type;
  JSObjectRef jsPixels;

  if (jsArgc == 9) {
    // 9-argument version
    EXJS_UNPACK_ARGV(target, level, xoffset, yoffset, width, height, format, type);
    jsPixels = (JSObjectRef) jsArgv[8];
  } else if  (jsArgc == 7) {
    // 7-argument version
    EXJS_UNPACK_ARGV(target, level, xoffset, yoffset, format, type);
    jsPixels = (JSObjectRef) jsArgv[6];
  } else {
    throw std::runtime_error("EXGL: Invalid number of arguments to gl.texSubImage2D()!");
  }

  // Null?
  if (JSValueIsNull(jsCtx, jsPixels)) {
    addToNextBatch([=] {
      void *nulled = calloc(width * height, bytesPerPixel(type, format));
      glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, nulled);
      free(nulled);
    });
    return nullptr;
  }

  std::shared_ptr<void> data(nullptr);

  // Try TypedArray
  if (jsArgc == 9) {
    data = jsValueToSharedArray(jsCtx, jsPixels, nullptr);
  }

  // Try object with `.localUri` member
  if (!data) {
    data = loadImage(jsCtx, jsPixels, &width, &height, nullptr);
  }

  if (data) {
    if (unpackFLipY) {
      flipPixels((GLubyte *) data.get(), width * bytesPerPixel(type, format), height);
    }
    addToNextBatch([=] {
      glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, data.get());
    });
    return nullptr;
  }

  // Nothing worked...
  throw std::runtime_error("EXGL: Invalid pixel data argument for gl.texSubImage2D()!");
}

_WRAP_METHOD_SIMPLE(texParameterf, glTexParameterf, target, pname, param)

_WRAP_METHOD_SIMPLE(texParameteri, glTexParameteri, target, pname, param)


// Textures (WebGL2)
// -----------------

_WRAP_METHOD_SIMPLE(texStorage2D, glTexStorage2D, target, levels, internalformat, width, height)

_WRAP_METHOD_SIMPLE(texStorage3D, glTexStorage3D, target, levels, internalformat, width, height, depth)

_WRAP_WEBGL2_METHOD(texImage3D, 10) {
  GLenum target;
  GLint level, internalformat;
  GLsizei width, height, depth, border;
  GLenum format, type;
  JSObjectRef jsPixels;

  EXJS_UNPACK_ARGV(target, level, internalformat, width, height, depth, border, format, type);
  jsPixels = (JSObjectRef) jsArgv[9];

  // Null?
  if (JSValueIsNull(jsCtx, jsPixels)) {
    addToNextBatch([=] {
      glTexImage3D(target, level, internalformat, width, height, depth, border, format, type, nullptr);
    });
    return nullptr;
  }

  std::shared_ptr<void> data(nullptr);

  // Try TypedArray
  data = jsValueToSharedArray(jsCtx, jsPixels, nullptr);

  // Try object with `.localUri` member
  if (!data) {
    data = loadImage(jsCtx, jsPixels, &width, &height, nullptr);
  }

  if (data) {
    if (unpackFLipY) {
      GLubyte *texels = (GLubyte *) data.get();
      GLubyte *texelLayer = texels;
      for (int z = 0; z < depth; z++) {
        flipPixels(texelLayer, width * bytesPerPixel(type, format), height);
        texelLayer += bytesPerPixel(type, format) * width * height;
      }
    }
    addToNextBatch([=] {
      glTexImage3D(target, level, internalformat, width, height, depth, border, format, type, data.get());
    });
    return nullptr;
  }

  // Nothing worked...
  throw std::runtime_error("EXGL: Invalid pixel data argument for gl.texImage3D()!");
}

_WRAP_WEBGL2_METHOD(texSubImage3D, 11) {
  GLenum target;
  GLint level, xoffset, yoffset, zoffset;
  GLsizei width, height, depth;
  GLenum format, type;
  JSObjectRef jsPixels;

  EXJS_UNPACK_ARGV(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type);
  jsPixels = (JSObjectRef) jsArgv[10];

  // Null?
  if (JSValueIsNull(jsCtx, jsPixels)) {
    addToNextBatch([=] {
      void *nulled = calloc(width * height, bytesPerPixel(type, format));
      glTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, nulled);
      free(nulled);
    });
    return nullptr;
  }

  std::shared_ptr<void> data(nullptr);

  // Try TypedArray
  data = jsValueToSharedArray(jsCtx, jsPixels, nullptr);

  // Try object with `.localUri` member
  if (!data) {
    data = loadImage(jsCtx, jsPixels, &width, &height, nullptr);
  }

  if (data) {
    if (unpackFLipY) {
      GLubyte *texels = (GLubyte *) data.get();
      GLubyte *texelLayer = texels;
      for (int z = 0; z < depth; z++) {
        flipPixels(texelLayer, width * bytesPerPixel(type, format), height);
        texelLayer += bytesPerPixel(type, format) * width * height;
      }
    }
    addToNextBatch([=] {
      glTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, data.get());
    });
    return nullptr;
  }

  // Nothing worked...
  throw std::runtime_error("EXGL: Invalid pixel data argument for gl.texSubImage3D()!");
}

_WRAP_WEBGL2_METHOD_SIMPLE(copyTexSubImage3D, glCopyTexSubImage3D,
  target, level, xoffset, yoffset, zoffset, x, y, width, height)

_WRAP_METHOD_UNIMPL(compressedTexImage3D)

_WRAP_METHOD_UNIMPL(compressedTexSubImage3D)


// Programs and shaders
// --------------------

_WRAP_METHOD(attachShader, 2) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fProgram, UEXGLObjectId fShader);
  addToNextBatch([=] { glAttachShader(lookupObject(fProgram), lookupObject(fShader)); });
  return nullptr;
}

_WRAP_METHOD(bindAttribLocation, 3) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fProgram, GLuint index);
  auto name = jsValueToSharedStr(jsCtx, jsArgv[2]);
  addToNextBatch([=] { glBindAttribLocation(lookupObject(fProgram), index, name.get()); });
  return nullptr;
}

_WRAP_METHOD(compileShader, 1) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fShader);
  addToNextBatch([=] { glCompileShader(lookupObject(fShader)); });
  return nullptr;
}

_WRAP_METHOD(createProgram, 0) {
  return addFutureToNextBatch(jsCtx, &glCreateProgram);
}

_WRAP_METHOD(createShader, 1) {
  EXJS_UNPACK_ARGV(GLenum type);
  if (type == GL_VERTEX_SHADER || type == GL_FRAGMENT_SHADER) {
    return addFutureToNextBatch(jsCtx, std::bind(glCreateShader, type));
  } else {
    return JSValueMakeNull(jsCtx);
  }
}

_WRAP_METHOD(deleteProgram, 1) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fProgram);
  addToNextBatch([=] { glDeleteProgram(lookupObject(fProgram)); });
  return nullptr;
}

_WRAP_METHOD(deleteShader, 1) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fShader);
  addToNextBatch([=] { glDeleteShader(lookupObject(fShader)); });
  return nullptr;
}

_WRAP_METHOD(detachShader, 2) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fProgram, UEXGLObjectId fShader);
  addToNextBatch([=] { glDetachShader(lookupObject(fProgram), lookupObject(fShader)); });
  return nullptr;
}

_WRAP_METHOD(getAttachedShaders, 1) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fProgram);

  GLint count;
  std::vector<GLuint> glResults;
  addBlockingToNextBatch([&] {
    GLuint program = lookupObject(fProgram);
    glGetProgramiv(program, GL_ATTACHED_SHADERS, &count);
    glResults.resize(count);
    glGetAttachedShaders(program, count, nullptr, glResults.data());
  });

  JSValueRef jsResults[count];
  for (auto i = 0; i < count; ++i) {
    UEXGLObjectId exglObjId = 0;
    for (const auto &pair : objects) {
      if (pair.second == glResults[i]) {
        exglObjId = pair.first;
      }
    }
    if (exglObjId == 0) {
      throw new std::runtime_error("EXGL: Internal error: couldn't find UEXGLObjectId "
                                   "associated with shader in getAttachedShaders()!");
    }
    jsResults[i] = JSValueMakeNumber(jsCtx, exglObjId);
  }
  return JSObjectMakeArray(jsCtx, count, jsResults, nullptr);
}

_WRAP_METHOD(getProgramParameter, 2) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fProgram, GLenum pname);
  GLint glResult;
  addBlockingToNextBatch([&] { glGetProgramiv(lookupObject(fProgram), pname, &glResult); });
  if (pname == GL_DELETE_STATUS || pname == GL_LINK_STATUS || pname == GL_VALIDATE_STATUS) {
    return JSValueMakeBoolean(jsCtx, glResult);
  } else {
    return JSValueMakeNumber(jsCtx, glResult);
  }
}

_WRAP_METHOD(getShaderParameter, 2) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fShader, GLenum pname);
  GLint glResult;
  addBlockingToNextBatch([&] { glGetShaderiv(lookupObject(fShader), pname, &glResult); });
  if (pname == GL_DELETE_STATUS || pname == GL_COMPILE_STATUS) {
    return JSValueMakeBoolean(jsCtx, glResult);
  } else {
    return JSValueMakeNumber(jsCtx, glResult);
  }
}

_WRAP_METHOD(getShaderPrecisionFormat, 2) {
  EXJS_UNPACK_ARGV(GLenum shaderType, GLenum precisionType);

  GLint range[2], precision;
  addBlockingToNextBatch([&] {
    glGetShaderPrecisionFormat(shaderType, precisionType, range, &precision);
  });

  JSObjectRef jsResult = JSObjectMake(jsCtx, nullptr, nullptr);
  EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "rangeMin",
                                        JSValueMakeNumber(jsCtx, range[0]));
  EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "rangeMax",
                                        JSValueMakeNumber(jsCtx, range[1]));
  EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsResult, "precision",
                                        JSValueMakeNumber(jsCtx, precision));
  return jsResult;
}

_WRAP_METHOD(getProgramInfoLog, 1) {
  return getShaderOrProgramStr(jsCtx, jsArgv,
                               glGetProgramiv, GL_INFO_LOG_LENGTH,
                               glGetProgramInfoLog);
}

_WRAP_METHOD(getShaderInfoLog, 1) {
  return getShaderOrProgramStr(jsCtx, jsArgv,
                               glGetShaderiv, GL_INFO_LOG_LENGTH,
                               glGetShaderInfoLog);
}

_WRAP_METHOD(getShaderSource, 1) {
  return getShaderOrProgramStr(jsCtx, jsArgv,
                               glGetShaderiv, GL_SHADER_SOURCE_LENGTH,
                               glGetShaderSource);
}

_WRAP_METHOD_IS_OBJECT(Program)

_WRAP_METHOD_IS_OBJECT(Shader)

_WRAP_METHOD(linkProgram, 1) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fProgram);
  addToNextBatch([=] { glLinkProgram(lookupObject(fProgram)); });
  return nullptr;
}

_WRAP_METHOD(shaderSource, 2) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fShader);
  auto str = jsValueToSharedStr(jsCtx, jsArgv[1]);
  addToNextBatch([=] {
    char *pstr = str.get();
    glShaderSource(lookupObject(fShader), 1, (const char **) &pstr, nullptr);
  });
  return nullptr;
}

_WRAP_METHOD(useProgram, 1) {
  if (JSValueIsNull(jsCtx, jsArgv[0])) {
    addToNextBatch(std::bind(glUseProgram, 0));
  } else {
    EXJS_UNPACK_ARGV(UEXGLObjectId fProgram);
    addToNextBatch([=] { glUseProgram(lookupObject(fProgram)); });
  }
  return nullptr;
}

_WRAP_METHOD(validateProgram, 1) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fProgram);
  addToNextBatch([=] { glValidateProgram(lookupObject(fProgram)); });
  return nullptr;
}


// Programs and shaders (WebGL2)

_WRAP_METHOD(getFragDataLocation, 2) {
  EXJS_UNPACK_ARGV(UEXGLObjectId program);
  auto name = jsValueToSharedStr(jsCtx, jsArgv[1]);
  GLint location;
  addBlockingToNextBatch([&] {
    location = glGetFragDataLocation(lookupObject(program), name.get());
  });
  return location == -1 ? JSValueMakeNull(jsCtx) : JSValueMakeNumber(jsCtx, location);
}


// Uniforms and attributes
// -----------------------

_WRAP_METHOD_SIMPLE(disableVertexAttribArray, glDisableVertexAttribArray, index)

_WRAP_METHOD_SIMPLE(enableVertexAttribArray, glEnableVertexAttribArray, index)

_WRAP_METHOD(getActiveAttrib, 2) {
  return getActiveInfo(jsCtx, jsArgv, GL_ACTIVE_ATTRIBUTE_MAX_LENGTH, glGetActiveAttrib);
}

_WRAP_METHOD(getActiveUniform, 2) {
  return getActiveInfo(jsCtx, jsArgv, GL_ACTIVE_UNIFORM_MAX_LENGTH, glGetActiveUniform);
}

_WRAP_METHOD(getAttribLocation, 2) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fProgram);
  auto name = jsValueToSharedStr(jsCtx, jsArgv[1]);
  GLint location;
  addBlockingToNextBatch([&] {
    location = glGetAttribLocation(lookupObject(fProgram), name.get());
  });
  return JSValueMakeNumber(jsCtx, location);
}

_WRAP_METHOD_UNIMPL(getUniform)

_WRAP_METHOD(getUniformLocation, 2) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fProgram);
  auto name = jsValueToSharedStr(jsCtx, jsArgv[1]);
  GLint location;
  addBlockingToNextBatch([&] {
    location = glGetUniformLocation(lookupObject(fProgram), name.get());
  });
  return location == -1 ? JSValueMakeNull(jsCtx) : JSValueMakeNumber(jsCtx, location);
}

_WRAP_METHOD_UNIMPL(getVertexAttrib)

_WRAP_METHOD_UNIMPL(getVertexAttribOffset)

_WRAP_METHOD_SIMPLE(uniform1f, glUniform1f, uniform, x)
_WRAP_METHOD_SIMPLE(uniform2f, glUniform2f, uniform, x, y)
_WRAP_METHOD_SIMPLE(uniform3f, glUniform3f, uniform, x, y, z)
_WRAP_METHOD_SIMPLE(uniform4f, glUniform4f, uniform, x, y, z, w)
_WRAP_METHOD_SIMPLE(uniform1i, glUniform1i, uniform, x)
_WRAP_METHOD_SIMPLE(uniform2i, glUniform2i, uniform, x, y)
_WRAP_METHOD_SIMPLE(uniform3i, glUniform3i, uniform, x, y, z)
_WRAP_METHOD_SIMPLE(uniform4i, glUniform4i, uniform, x, y, z, w)

#define _WRAP_METHOD_UNIFORM_V(suffix, dim, Type)                     \
_WRAP_METHOD(uniform##suffix, 2) {                                  \
  GLuint uniform = EXJSValueToNumberFast(jsCtx, jsArgv[0]);         \
  size_t bytes;                                                     \
  auto data = jsValueToSharedArray(jsCtx, jsArgv[1], &bytes);       \
  GLsizei count = (GLsizei) bytes / sizeof(Type);                   \
  addToNextBatch([=] {                                              \
    glUniform##suffix(uniform, count / dim, (Type *) data.get());   \
  });                                                               \
  return nullptr;                                                   \
}
_WRAP_METHOD_UNIFORM_V(1fv, 1, GLfloat)
_WRAP_METHOD_UNIFORM_V(2fv, 2, GLfloat)
_WRAP_METHOD_UNIFORM_V(3fv, 3, GLfloat)
_WRAP_METHOD_UNIFORM_V(4fv, 4, GLfloat)
_WRAP_METHOD_UNIFORM_V(1iv, 1, GLint)
_WRAP_METHOD_UNIFORM_V(2iv, 2, GLint)
_WRAP_METHOD_UNIFORM_V(3iv, 3, GLint)
_WRAP_METHOD_UNIFORM_V(4iv, 4, GLint)

#define _WRAP_METHOD_UNIFORM_MATRIX(suffix, dim)                        \
_WRAP_METHOD(uniformMatrix##suffix, 3) {                              \
  GLuint uniform = EXJSValueToNumberFast(jsCtx, jsArgv[0]);           \
  GLboolean transpose = JSValueToBoolean(jsCtx, jsArgv[1]);           \
  size_t bytes;                                                       \
  auto data = jsValueToSharedArray(jsCtx, jsArgv[2], &bytes);         \
  GLsizei count = (GLsizei) bytes / sizeof(GLfloat);                  \
  addToNextBatch([=] {                                                \
    glUniformMatrix##suffix(uniform, count / dim, transpose, (GLfloat *) data.get()); \
  });                                                                 \
  return nullptr;                                                     \
}
_WRAP_METHOD_UNIFORM_MATRIX(2fv, 4)
_WRAP_METHOD_UNIFORM_MATRIX(3fv, 9)
_WRAP_METHOD_UNIFORM_MATRIX(4fv, 16)

#define _WRAP_METHOD_VERTEX_ATTRIB_V(suffix, Type)                      \
_WRAP_METHOD(vertexAttrib##suffix, 2) {                               \
  GLuint index = EXJSValueToNumberFast(jsCtx, jsArgv[0]);             \
  auto data = jsValueToSharedArray(jsCtx, jsArgv[1], nullptr);        \
  addToNextBatch([=] { glVertexAttrib##suffix(index, (Type *) data.get());}); \
  return nullptr;                                                     \
}
_WRAP_METHOD_VERTEX_ATTRIB_V(1fv, GLfloat)
_WRAP_METHOD_VERTEX_ATTRIB_V(2fv, GLfloat)
_WRAP_METHOD_VERTEX_ATTRIB_V(3fv, GLfloat)
_WRAP_METHOD_VERTEX_ATTRIB_V(4fv, GLfloat)

_WRAP_METHOD_SIMPLE(vertexAttrib1f, glVertexAttrib1f, index, x)
_WRAP_METHOD_SIMPLE(vertexAttrib2f, glVertexAttrib2f, index, x, y)
_WRAP_METHOD_SIMPLE(vertexAttrib3f, glVertexAttrib3f, index, x, y, z)
_WRAP_METHOD_SIMPLE(vertexAttrib4f, glVertexAttrib4f, index, x, y, z, w)

_WRAP_METHOD(vertexAttribPointer, 6) {
  EXJS_UNPACK_ARGV(GLuint index, GLuint itemSize, GLenum type,
                   GLboolean normalized, GLsizei stride, GLint offset);
  addToNextBatch(std::bind(glVertexAttribPointer, index, itemSize, type,
                           normalized, stride, bufferOffset(offset)));
  return nullptr;
}


// Uniforms and attributes (WebGL2)
// --------------------------------

_WRAP_METHOD_SIMPLE(uniform1ui, glUniform1ui, location, x)
_WRAP_METHOD_SIMPLE(uniform2ui, glUniform2ui, location, x, y)
_WRAP_METHOD_SIMPLE(uniform3ui, glUniform3ui, location, x, y, z)
_WRAP_METHOD_SIMPLE(uniform4ui, glUniform4ui, location, x, y, z, w)

_WRAP_METHOD_UNIFORM_V(1uiv, 1, GLuint)
_WRAP_METHOD_UNIFORM_V(2uiv, 2, GLuint)
_WRAP_METHOD_UNIFORM_V(3uiv, 3, GLuint)
_WRAP_METHOD_UNIFORM_V(4uiv, 4, GLuint)

_WRAP_METHOD_UNIFORM_MATRIX(3x2fv, 6)
_WRAP_METHOD_UNIFORM_MATRIX(4x2fv, 8)
_WRAP_METHOD_UNIFORM_MATRIX(2x3fv, 6)
_WRAP_METHOD_UNIFORM_MATRIX(4x3fv, 12)
_WRAP_METHOD_UNIFORM_MATRIX(2x4fv, 8)
_WRAP_METHOD_UNIFORM_MATRIX(3x4fv, 12)

_WRAP_METHOD_SIMPLE(vertexAttribI4i, glVertexAttribI4i, index, x, y, z, w)
_WRAP_METHOD_SIMPLE(vertexAttribI4ui, glVertexAttribI4ui, index, x, y, z, w)

_WRAP_METHOD_VERTEX_ATTRIB_V(I4iv, GLint)
_WRAP_METHOD_VERTEX_ATTRIB_V(I4uiv, GLuint)

_WRAP_METHOD(vertexAttribIPointer, 5) {
  EXJS_UNPACK_ARGV(GLuint index, GLuint size, GLenum type, GLsizei stride, GLint offset);
  addToNextBatch(std::bind(glVertexAttribIPointer, index, size, type, stride, bufferOffset(offset)));
  return nullptr;
}

#undef _WRAP_METHOD_UNIFORM_V
#undef _WRAP_METHOD_UNIFORM_MATRIX
#undef _WRAP_METHOD_VERTEX_ATTRIB_V


// Drawing buffers
// ---------------

_WRAP_METHOD_SIMPLE(clear, glClear, mask)

_WRAP_METHOD_SIMPLE(drawArrays, glDrawArrays, mode, first, count)

_WRAP_METHOD(drawElements, 4) {
  EXJS_UNPACK_ARGV(GLenum mode, GLsizei count, GLenum type, GLint offset);
  addToNextBatch(std::bind(glDrawElements, mode, count, type, bufferOffset(offset)));
  return nullptr;
}

_WRAP_METHOD(finish, 0) {
  addToNextBatch(glFinish);
  return nullptr;
}

_WRAP_METHOD(flush, 0) {
  addToNextBatch(glFlush);
  return nullptr;
}


// Drawing buffers (WebGL2)
// ------------------------

_WRAP_WEBGL2_METHOD_SIMPLE(vertexAttribDivisor, glVertexAttribDivisor, index, divisor)

_WRAP_WEBGL2_METHOD_SIMPLE(drawArraysInstanced, glDrawArraysInstanced, mode, first, count, instancecount)

_WRAP_WEBGL2_METHOD(drawElementsInstanced, 5) {
  EXJS_UNPACK_ARGV(GLenum mode, GLsizei count, GLenum type, GLint offset, GLsizei instanceCount);
  addToNextBatch([=] {
    glDrawElementsInstanced(mode, count, type, bufferOffset(offset), instanceCount);
  });
  return nullptr;
}

_WRAP_WEBGL2_METHOD(drawRangeElements, 6) {
  EXJS_UNPACK_ARGV(GLenum mode, GLuint start, GLuint end, GLsizei count, GLenum type, GLint offset);
  addToNextBatch([=] {
    glDrawRangeElements(mode, start, end, count, type, bufferOffset(offset));
  });
  return nullptr;
}

_WRAP_WEBGL2_METHOD(drawBuffers, 1) {
  size_t length;
  auto data = jsValueToSharedArray(jsCtx, jsArgv[0], &length);
  addToNextBatch([=] { glDrawBuffers((GLsizei) length, (GLenum *) data.get()); });
  return nullptr;
}

#define _WRAP_METHOD_CLEAR_BUFFER(suffix, Type)                         \
_WRAP_WEBGL2_METHOD(clearBuffer##suffix, 4) {                         \
  EXJS_UNPACK_ARGV(GLenum buffer, GLint drawbuffer);                  \
  auto values = jsValueToSharedArray(jsCtx, jsArgv[2], nullptr);      \
  addToNextBatch([=] {                                                \
    glClearBuffer##suffix(buffer, drawbuffer, (Type *) values.get()); \
  });                                                                 \
  return nullptr;                                                     \
}

_WRAP_METHOD_CLEAR_BUFFER(fv, GLfloat)
_WRAP_METHOD_CLEAR_BUFFER(iv, GLint)
_WRAP_METHOD_CLEAR_BUFFER(uiv, GLuint)
#undef _WRAP_METHOD_CLEAR_BUFFER

_WRAP_WEBGL2_METHOD_SIMPLE(clearBufferfi, glClearBufferfi, buffer, drawbuffer, depth, stencil)


// Query objects (WebGL2)
// ----------------------

_WRAP_WEBGL2_METHOD(createQuery, 0) {
  return addFutureToNextBatch(jsCtx, [] {
    GLuint query;
    glGenQueries(1, &query);
    return query;
  });
}

_WRAP_WEBGL2_METHOD(deleteQuery, 1) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fQuery);
  addToNextBatch([=] {
    GLuint query = lookupObject(fQuery);
    glDeleteQueries(1, &query);
  });
  return nullptr;
}

_WRAP_WEBGL2_METHOD_IS_OBJECT(Query)

_WRAP_WEBGL2_METHOD(beginQuery, 2) {
  EXJS_UNPACK_ARGV(GLenum target, UEXGLObjectId query);
  addToNextBatch([=] { glBeginQuery(target, lookupObject(query)); });
  return nullptr;
}

_WRAP_WEBGL2_METHOD_SIMPLE(endQuery, glEndQuery, target)

_WRAP_WEBGL2_METHOD(getQuery, 2) {
  EXJS_UNPACK_ARGV(GLenum target, GLenum pname);
  GLint params;
  addBlockingToNextBatch([&] { glGetQueryiv(target, pname, &params); });
  return params == 0 ? JSValueMakeNull(jsCtx) : JSValueMakeNumber(jsCtx, params);
}

_WRAP_WEBGL2_METHOD(getQueryParameter, 2) {
  EXJS_UNPACK_ARGV(UEXGLObjectId query, GLenum pname);
  GLuint params;
  addBlockingToNextBatch([&] { glGetQueryObjectuiv(lookupObject(query), pname, &params); });
  return params == 0 ? JSValueMakeNull(jsCtx) : JSValueMakeNumber(jsCtx, params);
}


// Samplers (WebGL2)
// -----------------

_WRAP_WEBGL2_METHOD(createSampler, 0) {
  return addFutureToNextBatch(jsCtx, [] {
    GLuint sampler;
    glGenSamplers(1, &sampler);
    return sampler;
  });
}

_WRAP_WEBGL2_METHOD(deleteSampler, 1) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fSampler);
  addToNextBatch([=] {
    GLuint sampler = lookupObject(fSampler);
    glDeleteSamplers(1, &sampler);
  });
  return nullptr;
}

_WRAP_WEBGL2_METHOD(bindSampler, 2) {
  EXJS_UNPACK_ARGV(GLuint unit, UEXGLObjectId sampler);
  addToNextBatch([=] { glBindSampler(unit, lookupObject(sampler)); });
  return nullptr;
}

_WRAP_WEBGL2_METHOD_IS_OBJECT(Sampler)

_WRAP_WEBGL2_METHOD(samplerParameteri, 3) {
  EXJS_UNPACK_ARGV(UEXGLObjectId sampler, GLenum pname, GLint param);
  addToNextBatch([=] { glSamplerParameteri(lookupObject(sampler), pname, param); });
  return nullptr;
}

_WRAP_WEBGL2_METHOD(samplerParameterf, 3) {
  EXJS_UNPACK_ARGV(UEXGLObjectId sampler, GLenum pname, GLfloat param);
  addToNextBatch([=] { glSamplerParameterf(lookupObject(sampler), pname, param); });
  return nullptr;
}

_WRAP_WEBGL2_METHOD(getSamplerParameter, 2) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fSampler, GLenum pname);
  bool isFloatParam = pname == GL_TEXTURE_MAX_LOD || pname == GL_TEXTURE_MIN_LOD;
  GLfloat paramf;
  GLint parami;

  addBlockingToNextBatch([&] {
    GLuint sampler = lookupObject(fSampler);

    if (isFloatParam) {
      glGetSamplerParameterfv(sampler, pname, &paramf);
    } else {
      glGetSamplerParameteriv(sampler, pname, &parami);
    }
  });
  return JSValueMakeNumber(jsCtx, isFloatParam ? paramf : parami);
}


// Sync objects (WebGL2)
// ---------------------

_WRAP_METHOD_UNIMPL(fenceSync)

_WRAP_METHOD_UNIMPL(isSync)

_WRAP_METHOD_UNIMPL(deleteSync)

_WRAP_METHOD_UNIMPL(clientWaitSync)

_WRAP_METHOD_UNIMPL(waitSync)

_WRAP_METHOD_UNIMPL(getSyncParameter)


// Transform feedback (WebGL2)
// ---------------------------

_WRAP_WEBGL2_METHOD(createTransformFeedback, 0) {
  return addFutureToNextBatch(jsCtx, [] {
    GLuint transformFeedback;
    glGenTransformFeedbacks(1, &transformFeedback);
    return transformFeedback;
  });
}

_WRAP_WEBGL2_METHOD(deleteTransformFeedback, 1) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fTransformFeedback);
  addToNextBatch([=] {
    GLuint transformFeedback = lookupObject(fTransformFeedback);
    glDeleteTransformFeedbacks(1, &transformFeedback);
  });
  return nullptr;
}

_WRAP_WEBGL2_METHOD_IS_OBJECT(TransformFeedback)

_WRAP_WEBGL2_METHOD(bindTransformFeedback, 1) {
  EXJS_UNPACK_ARGV(GLenum target, UEXGLObjectId transformFeedback);
  addToNextBatch([=] { glBindTransformFeedback(target, lookupObject(transformFeedback)); });
  return nullptr;
}

_WRAP_WEBGL2_METHOD_SIMPLE(beginTransformFeedback, glBeginTransformFeedback, primitiveMode)

_WRAP_WEBGL2_METHOD(endTransformFeedback, 0) {
  addToNextBatch([=] { glEndTransformFeedback(); });
  return nullptr;
}

_WRAP_WEBGL2_METHOD(transformFeedbackVaryings, 3) {
  EXJS_UNPACK_ARGV(UEXGLObjectId program);
  EXJS_UNPACK_ARGV_OFFSET(2, GLenum bufferMode);
  int length;
  auto varyings = jsValueToSharedStringArray(jsCtx, jsArgv[1], &length);

  addToNextBatch([=] {
    glTransformFeedbackVaryings(lookupObject(program), length, (const GLchar *const *) varyings.get(), bufferMode);
  });
  return nullptr;
}

_WRAP_WEBGL2_METHOD(getTransformFeedbackVarying, 2) {
  return getActiveInfo(jsCtx, jsArgv, GL_TRANSFORM_FEEDBACK_VARYING_MAX_LENGTH, glGetTransformFeedbackVarying);
}

_WRAP_WEBGL2_METHOD(pauseTransformFeedback, 0) {
  addToNextBatch([=] { glPauseTransformFeedback(); });
  return nullptr;
}

_WRAP_WEBGL2_METHOD(resumeTransformFeedback, 0) {
  addToNextBatch([=] { glResumeTransformFeedback(); });
  return nullptr;
}


// Uniform buffer objects (WebGL2)
// -------------------------------

_WRAP_WEBGL2_METHOD(bindBufferBase, 3) {
  EXJS_UNPACK_ARGV(GLenum target, GLuint index, UEXGLObjectId buffer);
  addToNextBatch([=] { glBindBufferBase(target, index, lookupObject(buffer)); });
  return nullptr;
}

_WRAP_WEBGL2_METHOD(bindBufferRange, 5) {
  EXJS_UNPACK_ARGV(GLenum target, GLuint index, UEXGLObjectId buffer, GLint offset, GLsizei size);
  addToNextBatch([=] { glBindBufferRange(target, index, lookupObject(buffer), offset, size); });
  return nullptr;
}

_WRAP_WEBGL2_METHOD(getUniformIndices, 2) {
  EXJS_UNPACK_ARGV(UEXGLObjectId program);
  int length;
  auto uniformNames = jsValueToSharedStringArray(jsCtx, jsArgv[1], &length);
  GLuint indices[length];

  addBlockingToNextBatch([&] {
    glGetUniformIndices(lookupObject(program), length, (const GLchar *const *) uniformNames.get(), indices);
  });
  return makeTypedArray(jsCtx, kJSTypedArrayTypeUint32Array, indices, sizeof(indices));
}

_WRAP_WEBGL2_METHOD(getActiveUniforms, 3) {
  EXJS_UNPACK_ARGV(UEXGLObjectId program);
  EXJS_UNPACK_ARGV_OFFSET(2, GLenum pname);
  size_t length;
  auto uniformIndices = jsValueToSharedArray(jsCtx, jsArgv[1], &length);
  int count = (int) length / sizeof(GLuint);
  GLint params[count];

  addBlockingToNextBatch([&] {
    glGetActiveUniformsiv(lookupObject(program), (GLsizei) count, (const GLuint *) uniformIndices.get(), pname, params);
  });
  return makeTypedArray(jsCtx, kJSTypedArrayTypeInt32Array, params, sizeof(params));
}

_WRAP_WEBGL2_METHOD(getUniformBlockIndex, 2) {
  EXJS_UNPACK_ARGV(UEXGLObjectId program);
  auto uniformBlockName = jsValueToSharedStr(jsCtx, jsArgv[1]);
  GLuint blockIndex;

  addBlockingToNextBatch([&] {
    blockIndex = glGetUniformBlockIndex(lookupObject(program), uniformBlockName.get());
  });
  return JSValueMakeNumber(jsCtx, blockIndex);
}

_WRAP_METHOD_UNIMPL(getActiveUniformBlockParameter)

_WRAP_WEBGL2_METHOD(getActiveUniformBlockName, 2) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fProgram, GLuint uniformBlockIndex);
  std::string blockName;

  addBlockingToNextBatch([&] {
    GLuint program = lookupObject(fProgram);
    GLint bufSize;
    glGetActiveUniformBlockiv(program, uniformBlockIndex, GL_UNIFORM_BLOCK_NAME_LENGTH, &bufSize);
    glGetActiveUniformBlockName(program, uniformBlockIndex, bufSize, NULL, &blockName[0]);
  });
  return EXJSValueMakeStringFromUTF8CString(jsCtx, blockName.c_str());
}

_WRAP_WEBGL2_METHOD(uniformBlockBinding, 3) {
  EXJS_UNPACK_ARGV(UEXGLObjectId program, GLuint uniformBlockIndex, GLuint uniformBlockBinding);
  addToNextBatch([=] {
    glUniformBlockBinding(lookupObject(program), uniformBlockIndex, uniformBlockBinding);
  });
  return nullptr;
}


// Vertex Array Object (WebGL2)
// ----------------------------

_WRAP_WEBGL2_METHOD(createVertexArray, 0) {
  return addFutureToNextBatch(jsCtx, [] {
    GLuint vertexArray;
    glGenVertexArrays(1, &vertexArray);
    return vertexArray;
  });
}

_WRAP_WEBGL2_METHOD(deleteVertexArray, 1) {
  EXJS_UNPACK_ARGV(UEXGLObjectId fVertexArray);
  addToNextBatch([=] {
    GLuint vertexArray = lookupObject(fVertexArray);
    glDeleteVertexArrays(1, &vertexArray);
  });
  return nullptr;
}

_WRAP_WEBGL2_METHOD_IS_OBJECT(VertexArray)

_WRAP_WEBGL2_METHOD(bindVertexArray, 1) {
  EXJS_UNPACK_ARGV(UEXGLObjectId vertexArray);
  addToNextBatch([=] { glBindVertexArray(lookupObject(vertexArray)); });
  return nullptr;
}


// Extensions
// ----------

_WRAP_METHOD(getSupportedExtensions, 0) {
  return JSObjectMakeArray(jsCtx, 0, NULL, NULL);
}

_WRAP_METHOD(getExtension, 1) {
  return JSValueMakeNull(jsCtx);
}


// Exponent extensions
// -------------------

_WRAP_METHOD(endFrameEXP, 0) {
  addToNextBatch([=] {
    setNeedsRedraw(true);
  });
  endNextBatch();
  flushOnGLThread();
  return nullptr;
}

_WRAP_METHOD(flushEXP, 0) {
  addBlockingToNextBatch([&] {
    // nothing, it's just a helper so that we can measure how much time some operations take
  });
  return nullptr;
}
