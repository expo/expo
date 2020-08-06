#include "EXGLContext.h"
#include "EXGLImageUtils.h"

#include <algorithm>

#define ARG(index, type)                                   \
  (argc > index ? unpackArg<type>(runtime, jsArgv + index) \
                : throw std::runtime_error("EXGL: Too few arguments"))

#define NATIVE_METHOD(name, ...)                 \
  jsi::Value EXGLContext::glNativeMethod_##name( \
      jsi::Runtime &runtime, const jsi::Value &jsThis, const jsi::Value *jsArgv, size_t argc)

#define SIMPLE_NATIVE_METHOD(name, func)                               \
  NATIVE_METHOD(name) {                                                \
    addToNextBatch(generateNativeMethod(runtime, func, jsArgv, argc)); \
    return nullptr;                                                    \
  }

#define UNIMPL_NATIVE_METHOD(name)   \
  NATIVE_METHOD(name) {              \
    return exglUnimplemented(#name); \
  }

// This listing follows the order in
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext

// The WebGL context
// -----------------

NATIVE_METHOD(getContextAttributes) {
  jsi::Object jsResult(runtime);
  jsResult.setProperty(runtime, "alpha", true);
  jsResult.setProperty(runtime, "depth", true);
  jsResult.setProperty(runtime, "stencil", false);
  jsResult.setProperty(runtime, "antialias", false);
  jsResult.setProperty(runtime, "premultipliedAlpha", false);
  return jsResult;
}

NATIVE_METHOD(isContextLost) {
  return false;
}

// Viewing and clipping
// --------------------

SIMPLE_NATIVE_METHOD(scissor, glScissor); // x, y, width, height

SIMPLE_NATIVE_METHOD(viewport, glViewport); // x, y, width, height

// State information
// -----------------

SIMPLE_NATIVE_METHOD(activeTexture, glActiveTexture); // texture

SIMPLE_NATIVE_METHOD(blendColor, glBlendColor); // red, green, blue, alpha

SIMPLE_NATIVE_METHOD(blendEquation, glBlendEquation); // mode

SIMPLE_NATIVE_METHOD(blendEquationSeparate, glBlendEquationSeparate); // modeRGB, modeAlpha

SIMPLE_NATIVE_METHOD(blendFunc, glBlendFunc); // sfactor, dfactor

SIMPLE_NATIVE_METHOD(blendFuncSeparate, glBlendFuncSeparate); // srcRGB, dstRGB, srcAlpha, dstAlpha

SIMPLE_NATIVE_METHOD(clearColor, glClearColor); // red, green, blue, alpha

SIMPLE_NATIVE_METHOD(clearDepth, glClearDepthf); // depth

SIMPLE_NATIVE_METHOD(clearStencil, glClearStencil); // s

SIMPLE_NATIVE_METHOD(colorMask, glColorMask); // red, green, blue, alpha

SIMPLE_NATIVE_METHOD(cullFace, glCullFace); // mode

SIMPLE_NATIVE_METHOD(depthFunc, glDepthFunc); // func

SIMPLE_NATIVE_METHOD(depthMask, glDepthMask); // flag

SIMPLE_NATIVE_METHOD(depthRange, glDepthRangef); // zNear, zFar

SIMPLE_NATIVE_METHOD(disable, glDisable); // cap

SIMPLE_NATIVE_METHOD(enable, glEnable); // cap

SIMPLE_NATIVE_METHOD(frontFace, glFrontFace); // mode

NATIVE_METHOD(getParameter) {
  auto pname = ARG(0, GLenum);

  switch (pname) {
      // Float32Array[0]
    case GL_COMPRESSED_TEXTURE_FORMATS:
      return TypedArray<TypedArrayKind::Float32Array>(runtime, {});

      // FLoat32Array[2]
    case GL_ALIASED_LINE_WIDTH_RANGE:
    case GL_ALIASED_POINT_SIZE_RANGE:
    case GL_DEPTH_RANGE: {
      std::vector<TypedArrayBase::ContentType<TypedArrayKind::Float32Array>> glResults(2);
      addBlockingToNextBatch([&] { glGetFloatv(pname, glResults.data()); });
      return TypedArray<TypedArrayKind::Float32Array>(runtime, glResults);
    }
      // FLoat32Array[4]
    case GL_BLEND_COLOR:
    case GL_COLOR_CLEAR_VALUE: {
      std::vector<TypedArrayBase::ContentType<TypedArrayKind::Float32Array>> glResults(4);
      addBlockingToNextBatch([&] { glGetFloatv(pname, glResults.data()); });
      return TypedArray<TypedArrayKind::Float32Array>(runtime, glResults);
    }
      // Int32Array[2]
    case GL_MAX_VIEWPORT_DIMS: {
      std::vector<TypedArrayBase::ContentType<TypedArrayKind::Int32Array>> glResults(2);
      addBlockingToNextBatch([&] { glGetIntegerv(pname, glResults.data()); });
      return TypedArray<TypedArrayKind::Int32Array>(runtime, glResults);
    }
      // Int32Array[4]
    case GL_SCISSOR_BOX:
    case GL_VIEWPORT: {
      std::vector<TypedArrayBase::ContentType<TypedArrayKind::Int32Array>> glResults(4);
      addBlockingToNextBatch([&] { glGetIntegerv(pname, glResults.data()); });
      return TypedArray<TypedArrayKind::Int32Array>(runtime, glResults);
    }
      // boolean[4]
    case GL_COLOR_WRITEMASK: {
      GLint glResults[4];
      addBlockingToNextBatch([&] { glGetIntegerv(pname, glResults); });
      return jsi::Array::createWithElements(
          runtime,
          {jsi::Value(glResults[0]),
           jsi::Value(glResults[1]),
           jsi::Value(glResults[2]),
           jsi::Value(glResults[3])});
    }

      // boolean
    case GL_UNPACK_FLIP_Y_WEBGL:
      return unpackFLipY;
    case GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL:
    case GL_UNPACK_COLORSPACE_CONVERSION_WEBGL:
      return false;
    case GL_RASTERIZER_DISCARD:
    case GL_SAMPLE_ALPHA_TO_COVERAGE:
    case GL_SAMPLE_COVERAGE:
    case GL_TRANSFORM_FEEDBACK_ACTIVE:
    case GL_TRANSFORM_FEEDBACK_PAUSED: {
      GLint glResult;
      addBlockingToNextBatch([&] { glGetIntegerv(pname, &glResult); });
      return jsi::Value(glResult);
    }

      // string
    case GL_RENDERER:
    case GL_SHADING_LANGUAGE_VERSION:
    case GL_VENDOR:
    case GL_VERSION: {
      const GLubyte *glStr;
      addBlockingToNextBatch([&] { glStr = glGetString(pname); });
      return jsi::String::createFromUtf8(
          runtime, std::string(reinterpret_cast<const char *>(glStr)));
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
      return static_cast<double>(glFloat);
    }

      // UEXGLObjectId
    case GL_ARRAY_BUFFER_BINDING:
    case GL_ELEMENT_ARRAY_BUFFER_BINDING:
    case GL_CURRENT_PROGRAM: {
      GLint glInt;
      addBlockingToNextBatch([&] { glGetIntegerv(pname, &glInt); });
      for (const auto &pair : objects) {
        if (pair.second == glInt) {
          return static_cast<double>(pair.first);
        }
      }
      return nullptr;
    }

      // Unimplemented...
    case GL_COPY_READ_BUFFER_BINDING:
    case GL_COPY_WRITE_BUFFER_BINDING:
    case GL_DRAW_FRAMEBUFFER_BINDING:
    case GL_READ_FRAMEBUFFER_BINDING:
    case GL_RENDERBUFFER:
    case GL_SAMPLER_BINDING:
    case GL_TEXTURE_BINDING_2D_ARRAY:
    case GL_TEXTURE_BINDING_2D:
    case GL_TEXTURE_BINDING_3D:
    case GL_TEXTURE_BINDING_CUBE_MAP:
    case GL_TRANSFORM_FEEDBACK_BINDING:
    case GL_TRANSFORM_FEEDBACK_BUFFER_BINDING:
    case GL_UNIFORM_BUFFER_BINDING:
    case GL_VERTEX_ARRAY_BINDING:
      throw std::runtime_error(
          "EXGL: getParameter() doesn't support gl." + std::to_string(pname) + " yet!");

      // int
    default: {
      GLint glInt;
      addBlockingToNextBatch([&] { glGetIntegerv(pname, &glInt); });
      return jsi::Value(glInt);
    }
  }
}

NATIVE_METHOD(getError) {
  GLenum glResult;
  addBlockingToNextBatch([&] { glResult = glGetError(); });
  return static_cast<double>(glResult);
}

SIMPLE_NATIVE_METHOD(hint, glHint); // target, mode

NATIVE_METHOD(isEnabled) {
  auto cap = ARG(0, GLenum);
  GLboolean glResult;
  addBlockingToNextBatch([&] { glResult = glIsEnabled(cap); });
  return glResult == GL_TRUE;
}

SIMPLE_NATIVE_METHOD(lineWidth, glLineWidth); // width

NATIVE_METHOD(pixelStorei) {
  auto pname = ARG(0, GLenum);
  switch (pname) {
    case GL_UNPACK_FLIP_Y_WEBGL: {
      unpackFLipY = ARG(1, GLboolean);
      break;
    }
    default:
      jsConsoleLog(runtime, "EXGL: gl.pixelStorei() doesn't support this parameter yet!");
  }
  return nullptr;
}

SIMPLE_NATIVE_METHOD(polygonOffset, glPolygonOffset); // factor, units

SIMPLE_NATIVE_METHOD(sampleCoverage, glSampleCoverage); // value, invert

SIMPLE_NATIVE_METHOD(stencilFunc, glStencilFunc); // func, ref, mask

SIMPLE_NATIVE_METHOD(stencilFuncSeparate, glStencilFuncSeparate); // face, func, ref, mask

SIMPLE_NATIVE_METHOD(stencilMask, glStencilMask); // mask

SIMPLE_NATIVE_METHOD(stencilMaskSeparate, glStencilMaskSeparate); // face, mask

SIMPLE_NATIVE_METHOD(stencilOp, glStencilOp) // fail, zfail, zpass

SIMPLE_NATIVE_METHOD(stencilOpSeparate, glStencilOpSeparate); // face, fail, zfail, zpass

// Buffers
// -------

NATIVE_METHOD(bindBuffer) {
  auto target = ARG(0, GLenum);
  auto buffer = ARG(1, UEXGLObjectId);
  addToNextBatch([=] { glBindBuffer(target, lookupObject(buffer)); });
  return nullptr;
}

NATIVE_METHOD(bufferData) {
  auto target = ARG(0, GLenum);
  auto &sizeOrData = ARG(1, const jsi::Value &);
  auto usage = ARG(2, GLenum);

  if (sizeOrData.isNumber()) {
    GLsizeiptr length = sizeOrData.getNumber();
    addToNextBatch([=] { glBufferData(target, length, nullptr, usage); });
  } else if (sizeOrData.isNull() || sizeOrData.isUndefined()) {
    addToNextBatch([=] { glBufferData(target, 0, nullptr, usage); });
  } else if (sizeOrData.isObject()) {
    auto data = rawArrayBuffer(runtime, sizeOrData.getObject(runtime));
    addToNextBatch(
        [=, data{std::move(data)}] { glBufferData(target, data.size(), data.data(), usage); });
  }
  return nullptr;
}

NATIVE_METHOD(bufferSubData) {
  auto target = ARG(0, GLenum);
  auto offset = ARG(1, GLintptr);
  if (ARG(2, const jsi::Value &).isNull()) {
    addToNextBatch([=] { glBufferSubData(target, offset, 0, nullptr); });
  } else {
    auto data = rawArrayBuffer(runtime, ARG(2, jsi::Object));
    addToNextBatch(
        [=, data{std::move(data)}] { glBufferSubData(target, offset, data.size(), data.data()); });
  }
  return nullptr;
}

NATIVE_METHOD(createBuffer) {
  return exglGenObject(runtime, glGenBuffers);
}

NATIVE_METHOD(deleteBuffer) {
  return exglDeleteObject(ARG(0, UEXGLObjectId), glDeleteBuffers);
}

NATIVE_METHOD(getBufferParameter) {
  auto target = ARG(0, GLenum);
  auto pname = ARG(1, GLenum);
  GLint glResult;
  addBlockingToNextBatch([&] { glGetBufferParameteriv(target, pname, &glResult); });
  return jsi::Value(glResult);
}

NATIVE_METHOD(isBuffer) {
  return exglIsObject(ARG(0, UEXGLObjectId), glIsBuffer);
}

// Buffers (WebGL2)

SIMPLE_NATIVE_METHOD(
    copyBufferSubData,
    glCopyBufferSubData) // readTarget, writeTarget, readOffset, writeOffset, size

// glGetBufferSubData is not available in OpenGL ES
UNIMPL_NATIVE_METHOD(getBufferSubData);

// Framebuffers
// ------------

NATIVE_METHOD(bindFramebuffer) {
  auto target = ARG(0, GLenum);
  auto framebuffer = ARG(1, UEXGLObjectId);
  addToNextBatch([=] {
    glBindFramebuffer(target, framebuffer == 0 ? defaultFramebuffer : lookupObject(framebuffer));
  });
  return nullptr;
}

NATIVE_METHOD(checkFramebufferStatus) {
  auto target = ARG(0, GLenum);
  GLenum glResult;
  addBlockingToNextBatch([&] { glResult = glCheckFramebufferStatus(target); });
  return static_cast<double>(glResult);
}

NATIVE_METHOD(createFramebuffer) {
  return exglGenObject(runtime, glGenFramebuffers);
}

NATIVE_METHOD(deleteFramebuffer) {
  return exglDeleteObject(ARG(0, UEXGLObjectId), glDeleteFramebuffers);
}

NATIVE_METHOD(framebufferRenderbuffer) {
  auto target = ARG(0, GLenum);
  auto attachment = ARG(1, GLenum);
  auto renderbuffertarget = ARG(2, GLenum);
  auto fRenderbuffer = ARG(3, UEXGLObjectId);
  addToNextBatch([=] {
    GLuint renderbuffer = lookupObject(fRenderbuffer);
    glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer);
  });
  return nullptr;
}

NATIVE_METHOD(framebufferTexture2D, 5) {
  auto target = ARG(0, GLenum);
  auto attachment = ARG(1, GLenum);
  auto textarget = ARG(2, GLenum);
  auto fTexture = ARG(3, UEXGLObjectId);
  auto level = ARG(4, GLint);
  addToNextBatch([=] {
    glFramebufferTexture2D(target, attachment, textarget, lookupObject(fTexture), level);
  });
  return nullptr;
}

UNIMPL_NATIVE_METHOD(getFramebufferAttachmentParameter)

NATIVE_METHOD(isFramebuffer) {
  return exglIsObject(ARG(0, UEXGLObjectId), glIsFramebuffer);
}

NATIVE_METHOD(readPixels) {
  auto x = ARG(0, GLint);
  auto y = ARG(1, GLint);
  auto width = ARG(2, GLuint); // GLsizei allows negative values
  auto height = ARG(3, GLuint);
  auto format = ARG(4, GLenum);
  auto type = ARG(5, GLenum);
  size_t byteLength = width * height * bytesPerPixel(type, format);
  std::vector<uint8_t> pixels(byteLength);
  addBlockingToNextBatch([&] { glReadPixels(x, y, width, height, format, type, pixels.data()); });

  TypedArrayBase arr = ARG(6, TypedArrayBase);
  jsi::ArrayBuffer buffer = arr.getBuffer(runtime);
  arrayBufferUpdate(runtime, buffer, pixels, arr.byteOffset(runtime));
  return nullptr;
}

// Framebuffers (WebGL2)
// ---------------------

SIMPLE_NATIVE_METHOD(blitFramebuffer, glBlitFramebuffer);
// srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter

NATIVE_METHOD(framebufferTextureLayer) {
  auto target = ARG(0, GLenum);
  auto attachment = ARG(1, GLenum);
  auto texture = ARG(2, UEXGLObjectId);
  auto level = ARG(3, GLint);
  auto layer = ARG(4, GLint);
  addToNextBatch(
      [=] { glFramebufferTextureLayer(target, attachment, lookupObject(texture), level, layer); });
  return nullptr;
}

NATIVE_METHOD(invalidateFramebuffer) {
  auto target = ARG(0, GLenum);
  auto jsAttachments = ARG(1, jsi::Array);

  std::vector<GLenum> attachments(jsAttachments.size(runtime));
  for (int i = 0; i < attachments.size(); i++) {
    attachments[i] = jsAttachments.getValueAtIndex(runtime, i).asNumber();
  }
  addToNextBatch([=, attachaments{std::move(attachments)}] {
    glInvalidateFramebuffer(target, attachments.size(), attachments.data());
  });
  return nullptr; // breaking change TypedArray -> Array (bug in previous implementation)
}

NATIVE_METHOD(invalidateSubFramebuffer) {
  auto target = ARG(0, GLenum);
  auto jsAttachments = ARG(1, jsi::Array);
  auto x = ARG(2, GLint);
  auto y = ARG(3, GLint);
  auto width = ARG(4, GLint);
  auto height = ARG(5, GLint);
  std::vector<GLenum> attachments(jsAttachments.size(runtime));
  for (int i = 0; i < attachments.size(); i++) {
    attachments[i] = jsAttachments.getValueAtIndex(runtime, i).asNumber();
  }
  addToNextBatch([=, attachments{std::move(attachments)}] {
    glInvalidateSubFramebuffer(target, attachments.size(), attachments.data(), x, y, width, height);
  });
  return nullptr;
}

SIMPLE_NATIVE_METHOD(readBuffer, glReadBuffer); // mode

// Renderbuffers
// -------------

NATIVE_METHOD(bindRenderbuffer) {
  auto target = ARG(0, GLenum);
  auto fRenderbuffer = ARG(1, UEXGLObjectId);
  addToNextBatch([=] { glBindRenderbuffer(target, lookupObject(fRenderbuffer)); });
  return nullptr;
}

NATIVE_METHOD(createRenderbuffer) {
  return exglGenObject(runtime, glGenRenderbuffers);
}

NATIVE_METHOD(deleteRenderbuffer) {
  return exglDeleteObject(ARG(0, UEXGLObjectId), glDeleteRenderbuffers);
}

UNIMPL_NATIVE_METHOD(getRenderbufferParameter)

NATIVE_METHOD(isRenderbuffer) {
  return exglIsObject(ARG(0, UEXGLObjectId), glIsRenderbuffer);
}

NATIVE_METHOD(renderbufferStorage) {
  auto target = ARG(0, GLenum);
  auto internalformat = ARG(1, GLint);
  auto width = ARG(2, GLsizei);
  auto height = ARG(3, GLsizei);

  // WebGL allows `GL_DEPTH_STENCIL` flag to be passed here,
  // however OpenGL ES seems to require sized format, so we fall back to `GL_DEPTH24_STENCIL8`.
  internalformat = internalformat == GL_DEPTH_STENCIL ? GL_DEPTH24_STENCIL8 : internalformat;

  addToNextBatch([=] { glRenderbufferStorage(target, internalformat, width, height); });
  return nullptr;
}

// Renderbuffers (WebGL2)
// ----------------------

UNIMPL_NATIVE_METHOD(getInternalformatParameter)

UNIMPL_NATIVE_METHOD(renderbufferStorageMultisample)

// Textures
// --------

NATIVE_METHOD(bindTexture) {
  auto target = ARG(0, GLenum);
  auto texture = ARG(1, UEXGLObjectId);
  addToNextBatch([=] { glBindTexture(target, lookupObject(texture)); });
  return nullptr;
}

UNIMPL_NATIVE_METHOD(compressedTexImage2D)

UNIMPL_NATIVE_METHOD(compressedTexSubImage2D)

SIMPLE_NATIVE_METHOD(
    copyTexImage2D,
    glCopyTexImage2D); // target, level, internalformat, x, y, width, height, border

SIMPLE_NATIVE_METHOD(
    copyTexSubImage2D,
    glCopyTexSubImage2D) // target, level, xoffset, yoffset, x, y, width, height

NATIVE_METHOD(createTexture) {
  return exglGenObject(runtime, glGenTextures);
}

NATIVE_METHOD(deleteTexture) {
  return exglDeleteObject(ARG(0, UEXGLObjectId), glDeleteTextures);
}

SIMPLE_NATIVE_METHOD(generateMipmap, glGenerateMipmap) // target

UNIMPL_NATIVE_METHOD(getTexParameter)

NATIVE_METHOD(isTexture) {
  return exglIsObject(ARG(0, UEXGLObjectId), glIsTexture);
}

NATIVE_METHOD(texImage2D, 6) {
  auto target = ARG(0, GLenum);
  auto level = ARG(1, GLint);
  auto internalformat = ARG(2, GLint);
  if (argc == 9) {
    auto width = ARG(3, GLsizei);
    auto height = ARG(4, GLsizei);
    auto border = ARG(5, GLsizei);
    auto format = ARG(6, GLenum);
    auto type = ARG(7, GLenum);
    if (ARG(8, const jsi::Value &).isNull()) {
      addToNextBatch([=] {
        glTexImage2D(target, level, internalformat, width, height, border, format, type, nullptr);
      });
      return nullptr;
    }
    auto data = ARG(8, jsi::Object);

    if (data.isArrayBuffer(runtime) || isTypedArray(runtime, data)) {
      std::vector<uint8_t> vec = rawArrayBuffer(runtime, std::move(data));
      if (unpackFLipY) {
        flipPixels(vec.data(), width * bytesPerPixel(type, format), height);
      }
      addToNextBatch([=, vec{std::move(vec)}] {
        glTexImage2D(
            target, level, internalformat, width, height, border, format, type, vec.data());
      });
    } else {
      auto image = loadImage(runtime, data, &width, &height, nullptr);
      if (unpackFLipY) {
        flipPixels(image.get(), width * bytesPerPixel(type, format), height);
      }
      addToNextBatch([=] {
        glTexImage2D(
            target, level, internalformat, width, height, border, format, type, image.get());
      });
    }
  } else if (argc == 6) {
    auto format = ARG(3, GLenum);
    auto type = ARG(4, GLenum);
    auto data = ARG(5, jsi::Object);
    GLsizei width = 0, height = 0, border = 0;
    auto image = loadImage(runtime, data, &width, &height, nullptr);
    if (unpackFLipY) {
      flipPixels(image.get(), width * bytesPerPixel(type, format), height);
    }
    addToNextBatch([=] {
      glTexImage2D(target, level, internalformat, width, height, border, format, type, image.get());
    });
  } else {
    throw std::runtime_error("EXGL: Invalid number of arguments to gl.texImage2D()!");
  }
  return nullptr;
}

NATIVE_METHOD(texSubImage2D, 6) {
  auto target = ARG(0, GLenum);
  auto level = ARG(1, GLint);
  auto xoffset = ARG(2, GLint);
  auto yoffset = ARG(3, GLint);
  if (argc == 9) {
    auto width = ARG(4, GLsizei);
    auto height = ARG(5, GLsizei);
    auto format = ARG(6, GLenum);
    auto type = ARG(7, GLenum);
    if (ARG(8, const jsi::Value &).isNull()) {
      addToNextBatch([=] {
        auto empty = std::make_unique<uint8_t>(width * height * bytesPerPixel(type, format));
        std::memset(empty.get(), 0, width * height * bytesPerPixel(type, format));
        glTexImage2D(target, level, xoffset, yoffset, width, height, format, type, empty.get());
      });
      return nullptr;
    }

    auto data = ARG(8, jsi::Object);

    if (data.isArrayBuffer(runtime) || isTypedArray(runtime, data)) {
      std::vector<uint8_t> vec = rawArrayBuffer(runtime, std::move(data));
      if (unpackFLipY) {
        flipPixels(vec.data(), width * bytesPerPixel(type, format), height);
      }
      addToNextBatch([=, vec{std::move(vec)}] {
        glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, vec.data());
      });
    } else {
      auto image = loadImage(runtime, data, &width, &height, nullptr);
      if (unpackFLipY) {
        flipPixels(image.get(), width * bytesPerPixel(type, format), height);
      }
      addToNextBatch([=] {
        glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, image.get());
      });
    }
  } else if (argc == 7) {
    auto format = ARG(4, GLenum);
    auto type = ARG(5, GLenum);
    auto data = ARG(6, jsi::Object);
    GLsizei width = 0, height = 0;
    auto image = loadImage(runtime, data, &width, &height, nullptr);
    if (unpackFLipY) {
      flipPixels(image.get(), width * bytesPerPixel(type, format), height);
    }
    addToNextBatch([=] {
      glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, image.get());
    });
  } else {
    throw std::runtime_error("EXGL: Invalid number of arguments to gl.texSubImage2D()!");
  }
  return nullptr;
}

SIMPLE_NATIVE_METHOD(texParameterf, glTexParameterf); // target, pname, param

SIMPLE_NATIVE_METHOD(texParameteri, glTexParameteri); // target, pname, param

// Textures (WebGL2)
// -----------------

SIMPLE_NATIVE_METHOD(texStorage2D, glTexStorage2D); // target, levels, internalformat, width, height

SIMPLE_NATIVE_METHOD(
    texStorage3D,
    glTexStorage3D); // target, levels, internalformat, width, height, depth

NATIVE_METHOD(texImage3D) {
  auto target = ARG(0, GLenum);
  auto level = ARG(1, GLint);
  auto internalformat = ARG(2, GLint);
  auto width = ARG(3, GLsizei);
  auto height = ARG(4, GLsizei);
  auto depth = ARG(5, GLsizei);
  auto border = ARG(6, GLsizei);
  auto format = ARG(7, GLenum);
  auto type = ARG(8, GLenum);

  if (ARG(9, const jsi::Value &).isNull()) {
    addToNextBatch([=] {
      glTexImage3D(
          target, level, internalformat, width, height, depth, border, format, type, nullptr);
    });
    return nullptr;
  }
  auto data = ARG(9, jsi::Object);
  auto flip = [&](uint8_t *data) {
    GLubyte *texelLayer = data;
    for (int z = 0; z < depth; z++) {
      flipPixels(texelLayer, width * bytesPerPixel(type, format), height);
      texelLayer += bytesPerPixel(type, format) * width * height;
    }
  };

  if (data.isArrayBuffer(runtime) || isTypedArray(runtime, data)) {
    std::vector<uint8_t> vec = rawArrayBuffer(runtime, std::move(data));
    if (unpackFLipY) {
      flip(vec.data());
    }
    addToNextBatch([=, vec{std::move(vec)}] {
      glTexImage3D(
          target, level, internalformat, width, height, depth, border, format, type, vec.data());
    });
  } else {
    auto image = loadImage(runtime, data, &width, &height, nullptr);
    if (unpackFLipY) {
      flip(image.get());
    }
    addToNextBatch([=] {
      glTexImage3D(
          target, level, internalformat, width, height, depth, border, format, type, image.get());
    });
  }
  return nullptr;
}

NATIVE_METHOD(texSubImage3D) {
  auto target = ARG(0, GLenum);
  auto level = ARG(1, GLint);
  auto xoffset = ARG(2, GLint);
  auto yoffset = ARG(3, GLint);
  auto zoffset = ARG(4, GLint);
  auto width = ARG(5, GLsizei);
  auto height = ARG(6, GLsizei);
  auto depth = ARG(7, GLsizei);
  auto format = ARG(8, GLenum);
  auto type = ARG(9, GLenum);

  if (ARG(10, const jsi::Value &).isNull()) {
    addToNextBatch([=] {
      auto empty = std::make_unique<uint8_t>(width * height * depth * bytesPerPixel(type, format));
      std::memset(empty.get(), 0, width * height * depth * bytesPerPixel(type, format));
      auto ptr = empty.get();
      glTexSubImage3D(
          target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, ptr);
    });
    return nullptr;
  }
  auto data = ARG(10, jsi::Object);
  auto flip = [&](uint8_t *data) {
    GLubyte *texelLayer = data;
    for (int z = 0; z < depth; z++) {
      flipPixels(texelLayer, width * bytesPerPixel(type, format), height);
      texelLayer += bytesPerPixel(type, format) * width * height;
    }
  };

  if (data.isArrayBuffer(runtime) || isTypedArray(runtime, data)) {
    std::vector<uint8_t> vec = rawArrayBuffer(runtime, std::move(data));
    if (unpackFLipY) {
      flip(vec.data());
    }
    addToNextBatch([=, vec{std::move(vec)}] {
      glTexSubImage3D(
          target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, vec.data());
    });
  } else {
    auto image = loadImage(runtime, data, &width, &height, nullptr);
    if (unpackFLipY) {
      flip(image.get());
    }
    addToNextBatch([=] {
      glTexSubImage3D(
          target,
          level,
          xoffset,
          yoffset,
          zoffset,
          width,
          height,
          depth,
          format,
          type,
          image.get());
    });
  }
  return nullptr;
}

SIMPLE_NATIVE_METHOD(
    copyTexSubImage3D,
    glCopyTexSubImage3D); // target, level, xoffset, yoffset, zoffset, x, y, width, height

UNIMPL_NATIVE_METHOD(compressedTexImage3D)

UNIMPL_NATIVE_METHOD(compressedTexSubImage3D)

// Programs and shaders
// --------------------

NATIVE_METHOD(attachShader) {
  auto program = ARG(0, UEXGLObjectId);
  auto shader = ARG(1, UEXGLObjectId);
  addToNextBatch([=] { glAttachShader(lookupObject(program), lookupObject(shader)); });
  return nullptr;
}

NATIVE_METHOD(bindAttribLocation) {
  auto program = ARG(0, UEXGLObjectId);
  auto index = ARG(1, GLuint);
  auto name = ARG(2, std::string);
  addToNextBatch([=, name{std::move(name)}] {
    glBindAttribLocation(lookupObject(program), index, name.c_str());
  });
  return nullptr;
}

NATIVE_METHOD(compileShader) {
  auto shader = ARG(0, UEXGLObjectId);
  addToNextBatch([=] { glCompileShader(lookupObject(shader)); });
  return nullptr;
}

NATIVE_METHOD(createProgram) {
  return exglCreateObject(runtime, glCreateProgram);
}

NATIVE_METHOD(createShader) {
  auto type = ARG(0, GLenum);
  if (type == GL_VERTEX_SHADER || type == GL_FRAGMENT_SHADER) {
    return exglCreateObject(runtime, std::bind(glCreateShader, type));
  } else {
    throw std::runtime_error("unknown shader type passed to function");
  }
}

NATIVE_METHOD(deleteProgram) {
  return exglDeleteObject(ARG(0, UEXGLContextId), glDeleteProgram);
}

NATIVE_METHOD(deleteShader) {
  return exglDeleteObject(ARG(0, UEXGLContextId), glDeleteShader);
}

NATIVE_METHOD(detachShader) {
  auto program = ARG(0, UEXGLObjectId);
  auto shader = ARG(1, UEXGLObjectId);
  addToNextBatch([=] { glDetachShader(lookupObject(program), lookupObject(shader)); });
  return nullptr;
}

NATIVE_METHOD(getAttachedShaders) {
  auto fProgram = ARG(0, UEXGLObjectId);

  GLint count;
  std::vector<GLuint> glResults;
  addBlockingToNextBatch([&] {
    GLuint program = lookupObject(fProgram);
    glGetProgramiv(program, GL_ATTACHED_SHADERS, &count);
    glResults.resize(count);
    glGetAttachedShaders(program, count, nullptr, glResults.data());
  });

  jsi::Array jsResults(runtime, count);
  for (auto i = 0; i < count; ++i) {
    UEXGLObjectId exglObjId = 0;
    for (const auto &pair : objects) {
      if (pair.second == glResults[i]) {
        exglObjId = pair.first;
      }
    }
    if (exglObjId == 0) {
      throw std::runtime_error(
          "EXGL: Internal error: couldn't find UEXGLObjectId "
          "associated with shader in getAttachedShaders()!");
    }
    jsResults.setValueAtIndex(runtime, i, static_cast<double>(exglObjId));
  }
  return jsResults;
}

NATIVE_METHOD(getProgramParameter) {
  auto fProgram = ARG(0, UEXGLObjectId);
  auto pname = ARG(1, GLenum);
  GLint glResult;
  addBlockingToNextBatch([&] { glGetProgramiv(lookupObject(fProgram), pname, &glResult); });
  if (pname == GL_DELETE_STATUS || pname == GL_LINK_STATUS || pname == GL_VALIDATE_STATUS) {
    return glResult == GL_TRUE;
  } else {
    return glResult;
  }
}

NATIVE_METHOD(getShaderParameter) {
  auto fShader = ARG(0, UEXGLObjectId);
  auto pname = ARG(1, GLenum);
  GLint glResult;
  addBlockingToNextBatch([&] { glGetShaderiv(lookupObject(fShader), pname, &glResult); });
  if (pname == GL_DELETE_STATUS || pname == GL_COMPILE_STATUS) {
    return glResult == GL_TRUE;
  } else {
    return glResult;
  }
}

NATIVE_METHOD(getShaderPrecisionFormat) {
  auto shaderType = ARG(0, GLenum);
  auto precisionType = ARG(1, GLenum);

  GLint range[2], precision;
  addBlockingToNextBatch(
      [&] { glGetShaderPrecisionFormat(shaderType, precisionType, range, &precision); });

  jsi::Object jsResult(runtime);
  jsResult.setProperty(runtime, "rangeMin", jsi::Value(range[0]));
  jsResult.setProperty(runtime, "rangeMax", jsi::Value(range[1]));
  jsResult.setProperty(runtime, "precision", jsi::Value(precision));
  return jsResult;
}

NATIVE_METHOD(getProgramInfoLog) {
  auto fObj = ARG(0, UEXGLObjectId);
  std::string str;
  addBlockingToNextBatch([&] {
    GLuint obj = lookupObject(fObj);
    GLint length;
    glGetProgramiv(obj, GL_INFO_LOG_LENGTH, &length);
    str.resize(length > 0 ? length - 1 : 0);
    glGetProgramInfoLog(obj, length, nullptr, &str[0]);
  });
  return jsi::String::createFromUtf8(runtime, str);
}

NATIVE_METHOD(getShaderInfoLog) {
  auto fObj = ARG(0, UEXGLObjectId);
  std::string str;
  addBlockingToNextBatch([&] {
    GLuint obj = lookupObject(fObj);
    GLint length;
    glGetShaderiv(obj, GL_INFO_LOG_LENGTH, &length);
    str.resize(length > 0 ? length - 1 : 0);
    glGetShaderInfoLog(obj, length, nullptr, &str[0]);
  });
  return jsi::String::createFromUtf8(runtime, str);
}

NATIVE_METHOD(getShaderSource) {
  auto fObj = ARG(0, UEXGLObjectId);
  std::string str;
  addBlockingToNextBatch([&] {
    GLuint obj = lookupObject(fObj);
    GLint length;
    glGetShaderiv(obj, GL_SHADER_SOURCE_LENGTH, &length);
    str.resize(length > 0 ? length - 1 : 0);
    glGetShaderSource(obj, length, nullptr, &str[0]);
  });
  return jsi::String::createFromUtf8(runtime, str);
}

NATIVE_METHOD(isShader) {
  return exglIsObject(ARG(0, UEXGLObjectId), glIsShader);
}

NATIVE_METHOD(isProgram) {
  return exglIsObject(ARG(0, UEXGLObjectId), glIsProgram);
}

NATIVE_METHOD(linkProgram) {
  auto fProgram = ARG(0, UEXGLObjectId);
  addToNextBatch([=] { glLinkProgram(lookupObject(fProgram)); });
  return nullptr;
}

NATIVE_METHOD(shaderSource) {
  auto fShader = ARG(0, UEXGLObjectId);
  auto str = ARG(1, std::string);
  addToNextBatch([=, str{std::move(str)}] {
    const char *cstr = str.c_str();
    glShaderSource(lookupObject(fShader), 1, &cstr, nullptr);
  });
  return nullptr;
}

NATIVE_METHOD(useProgram) {
  auto program = ARG(0, UEXGLObjectId);
  addToNextBatch([=] { glUseProgram(lookupObject(program)); });
  return nullptr;
}

NATIVE_METHOD(validateProgram) {
  auto program = ARG(0, UEXGLObjectId);
  addToNextBatch([=] { glValidateProgram(lookupObject(program)); });
  return nullptr;
}

// Programs and shaders (WebGL2)

NATIVE_METHOD(getFragDataLocation) {
  auto program = ARG(0, UEXGLObjectId);
  auto name = ARG(1, std::string);
  GLint location;
  addBlockingToNextBatch(
      [&] { location = glGetFragDataLocation(lookupObject(program), name.c_str()); });
  return location == -1 ? jsi::Value::null() : jsi::Value(location);
}

// Uniforms and attributes
// -----------------------

SIMPLE_NATIVE_METHOD(disableVertexAttribArray, glDisableVertexAttribArray); // index

SIMPLE_NATIVE_METHOD(enableVertexAttribArray, glEnableVertexAttribArray); // index

NATIVE_METHOD(getActiveAttrib) {
  return exglGetActiveInfo(
      runtime,
      ARG(0, UEXGLObjectId),
      ARG(1, GLuint),
      GL_ACTIVE_ATTRIBUTE_MAX_LENGTH,
      glGetActiveAttrib);
}

NATIVE_METHOD(getActiveUniform) {
  return exglGetActiveInfo(
      runtime,
      ARG(0, UEXGLObjectId),
      ARG(1, GLuint),
      GL_ACTIVE_UNIFORM_MAX_LENGTH,
      glGetActiveUniform);
}

NATIVE_METHOD(getAttribLocation) {
  auto program = ARG(0, UEXGLObjectId);
  auto name = ARG(1, std::string);
  GLint location;
  addBlockingToNextBatch(
      [&] { location = glGetAttribLocation(lookupObject(program), name.c_str()); });
  return jsi::Value(location);
}

UNIMPL_NATIVE_METHOD(getUniform)

NATIVE_METHOD(getUniformLocation) {
  auto program = ARG(0, UEXGLObjectId);
  auto name = ARG(1, std::string);
  GLint location;
  addBlockingToNextBatch(
      [&] { location = glGetUniformLocation(lookupObject(program), name.c_str()); });
  return location == -1 ? jsi::Value::null() : location;
}

UNIMPL_NATIVE_METHOD(getVertexAttrib)

UNIMPL_NATIVE_METHOD(getVertexAttribOffset)

SIMPLE_NATIVE_METHOD(uniform1f, glUniform1f); // uniform, x
SIMPLE_NATIVE_METHOD(uniform2f, glUniform2f); // uniform, x, y
SIMPLE_NATIVE_METHOD(uniform3f, glUniform3f); // uniform, x, y, z
SIMPLE_NATIVE_METHOD(uniform4f, glUniform4f); // uniform, x, y, z, w
SIMPLE_NATIVE_METHOD(uniform1i, glUniform1i); // uniform, x
SIMPLE_NATIVE_METHOD(uniform2i, glUniform2i); // uniform, x, y
SIMPLE_NATIVE_METHOD(uniform3i, glUniform3i); // uniform, x, y, z
SIMPLE_NATIVE_METHOD(uniform4i, glUniform4i); // uniform, x, y, z, w

NATIVE_METHOD(uniform1fv) {
  return exglUniformv(glUniform1fv, ARG(0, GLuint), 1, ARG(1, std::vector<float>));
};

NATIVE_METHOD(uniform2fv) {
  return exglUniformv(glUniform2fv, ARG(0, GLuint), 2, ARG(1, std::vector<float>));
};

NATIVE_METHOD(uniform3fv) {
  return exglUniformv(glUniform3fv, ARG(0, GLuint), 3, ARG(1, std::vector<float>));
};

NATIVE_METHOD(uniform4fv) {
  return exglUniformv(glUniform4fv, ARG(0, GLuint), 4, ARG(1, std::vector<float>));
};

NATIVE_METHOD(uniform1iv) {
  return exglUniformv(glUniform1iv, ARG(0, GLuint), 1, ARG(1, std::vector<int32_t>));
};

NATIVE_METHOD(uniform2iv) {
  return exglUniformv(glUniform2iv, ARG(0, GLuint), 2, ARG(1, std::vector<int32_t>));
};

NATIVE_METHOD(uniform3iv) {
  return exglUniformv(glUniform3iv, ARG(0, GLuint), 3, ARG(1, std::vector<int32_t>));
};

NATIVE_METHOD(uniform4iv) {
  return exglUniformv(glUniform4iv, ARG(0, GLuint), 4, ARG(1, std::vector<int32_t>));
};

NATIVE_METHOD(uniformMatrix2fv) {
  return exglUniformMatrixv(
      glUniformMatrix2fv, ARG(0, GLuint), ARG(1, GLboolean), 4, ARG(2, std::vector<float>));
}

NATIVE_METHOD(uniformMatrix3fv) {
  return exglUniformMatrixv(
      glUniformMatrix3fv, ARG(0, GLuint), ARG(1, GLboolean), 9, ARG(2, std::vector<float>));
}

NATIVE_METHOD(uniformMatrix4fv) {
  return exglUniformMatrixv(
      glUniformMatrix4fv, ARG(0, GLuint), ARG(1, GLboolean), 16, ARG(2, std::vector<float>));
}

NATIVE_METHOD(vertexAttrib1fv) {
  return exglVertexAttribv(glVertexAttrib1fv, ARG(0, GLuint), ARG(1, std::vector<float>));
}

NATIVE_METHOD(vertexAttrib2fv) {
  return exglVertexAttribv(glVertexAttrib2fv, ARG(0, GLuint), ARG(1, std::vector<float>));
}

NATIVE_METHOD(vertexAttrib3fv) {
  return exglVertexAttribv(glVertexAttrib3fv, ARG(0, GLuint), ARG(1, std::vector<float>));
}

NATIVE_METHOD(vertexAttrib4fv) {
  return exglVertexAttribv(glVertexAttrib4fv, ARG(0, GLuint), ARG(1, std::vector<float>));
}

SIMPLE_NATIVE_METHOD(vertexAttrib1f, glVertexAttrib1f); // index, x
SIMPLE_NATIVE_METHOD(vertexAttrib2f, glVertexAttrib2f); // index, x, y
SIMPLE_NATIVE_METHOD(vertexAttrib3f, glVertexAttrib3f); // index, x, y, z
SIMPLE_NATIVE_METHOD(vertexAttrib4f, glVertexAttrib4f); // index, x, y, z, w

SIMPLE_NATIVE_METHOD(
    vertexAttribPointer,
    glVertexAttribPointer); // index, itemSize, type, normalized, stride, const void *

// Uniforms and attributes (WebGL2)
// --------------------------------

SIMPLE_NATIVE_METHOD(uniform1ui, glUniform1ui); // location, x
SIMPLE_NATIVE_METHOD(uniform2ui, glUniform2ui); // location, x, y
SIMPLE_NATIVE_METHOD(uniform3ui, glUniform3ui); // location, x, y, z
SIMPLE_NATIVE_METHOD(uniform4ui, glUniform4ui); // location, x, y, z, w

NATIVE_METHOD(uniform1uiv) {
  return exglUniformv(glUniform1uiv, ARG(0, GLuint), 1, ARG(1, std::vector<uint32_t>));
};

NATIVE_METHOD(uniform2uiv) {
  return exglUniformv(glUniform2uiv, ARG(0, GLuint), 2, ARG(1, std::vector<uint32_t>));
};

NATIVE_METHOD(uniform3uiv) {
  return exglUniformv(glUniform3uiv, ARG(0, GLuint), 3, ARG(1, std::vector<uint32_t>));
};

NATIVE_METHOD(uniform4uiv) {
  return exglUniformv(glUniform4uiv, ARG(0, GLuint), 4, ARG(1, std::vector<uint32_t>));
};

NATIVE_METHOD(uniformMatrix3x2fv) {
  return exglUniformMatrixv(
      glUniformMatrix3x2fv, ARG(0, GLuint), ARG(1, GLboolean), 6, ARG(2, std::vector<float>));
}

NATIVE_METHOD(uniformMatrix4x2fv) {
  return exglUniformMatrixv(
      glUniformMatrix4x2fv, ARG(0, GLuint), ARG(1, GLboolean), 8, ARG(2, std::vector<float>));
}

NATIVE_METHOD(uniformMatrix2x3fv) {
  return exglUniformMatrixv(
      glUniformMatrix2x3fv, ARG(0, GLuint), ARG(1, GLboolean), 6, ARG(2, std::vector<float>));
}

NATIVE_METHOD(uniformMatrix4x3fv) {
  return exglUniformMatrixv(
      glUniformMatrix4x3fv, ARG(0, GLuint), ARG(1, GLboolean), 12, ARG(2, std::vector<float>));
}

NATIVE_METHOD(uniformMatrix2x4fv) {
  return exglUniformMatrixv(
      glUniformMatrix2x4fv, ARG(0, GLuint), ARG(1, GLboolean), 8, ARG(2, std::vector<float>));
}

NATIVE_METHOD(uniformMatrix3x4fv) {
  return exglUniformMatrixv(
      glUniformMatrix3x4fv, ARG(0, GLuint), ARG(1, GLboolean), 12, ARG(2, std::vector<float>));
}

SIMPLE_NATIVE_METHOD(vertexAttribI4i, glVertexAttribI4i); // index, x, y, z, w
SIMPLE_NATIVE_METHOD(vertexAttribI4ui, glVertexAttribI4ui); // index, x, y, z, w

NATIVE_METHOD(vertexAttribI4iv) {
  return exglVertexAttribv(glVertexAttribI4iv, ARG(0, GLuint), ARG(1, std::vector<int32_t>));
}

NATIVE_METHOD(vertexAttribI4uiv) {
  return exglVertexAttribv(glVertexAttribI4uiv, ARG(0, GLuint), ARG(1, std::vector<uint32_t>));
}

SIMPLE_NATIVE_METHOD(
    vertexAttribIPointer,
    glVertexAttribIPointer); // index, size, type, stride, offset

// Drawing buffers
// ---------------

SIMPLE_NATIVE_METHOD(clear, glClear); // mask

SIMPLE_NATIVE_METHOD(drawArrays, glDrawArrays); // mode, first, count)

SIMPLE_NATIVE_METHOD(drawElements, glDrawElements); // mode, count, type, offset

SIMPLE_NATIVE_METHOD(finish, glFinish);

SIMPLE_NATIVE_METHOD(flush, glFlush);

// Drawing buffers (WebGL2)
// ------------------------

SIMPLE_NATIVE_METHOD(vertexAttribDivisor, glVertexAttribDivisor); // index, divisor

SIMPLE_NATIVE_METHOD(
    drawArraysInstanced,
    glDrawArraysInstanced); // mode, first, count, instancecount

SIMPLE_NATIVE_METHOD(
    drawElementsInstanced,
    glDrawElementsInstanced); // mode, count, type, offset, instanceCount

SIMPLE_NATIVE_METHOD(
    drawRangeElements,
    glDrawRangeElements); // mode, start, end, count, type, offset

NATIVE_METHOD(drawBuffers) {
  auto data = jsArrayToVector<GLenum>(runtime, ARG(0, jsi::Array));
  addToNextBatch([data{std::move(data)}] { glDrawBuffers(data.size(), data.data()); });
  return nullptr;
}

NATIVE_METHOD(clearBufferfv) {
  auto buffer = ARG(0, GLenum);
  auto drawbuffer = ARG(1, GLint);
  auto values = ARG(2, TypedArrayKind::Float32Array).toVector(runtime);
  addToNextBatch(
      [=, values{std::move(values)}] { glClearBufferfv(buffer, drawbuffer, values.data()); });
  return nullptr;
}

NATIVE_METHOD(clearBufferiv) {
  auto buffer = ARG(0, GLenum);
  auto drawbuffer = ARG(1, GLint);
  auto values = ARG(2, TypedArrayKind::Int32Array).toVector(runtime);
  addToNextBatch(
      [=, values{std::move(values)}] { glClearBufferiv(buffer, drawbuffer, values.data()); });
  return nullptr;
}

NATIVE_METHOD(clearBufferuiv) {
  auto buffer = ARG(0, GLenum);
  auto drawbuffer = ARG(1, GLint);
  auto values = ARG(2, TypedArrayKind::Uint32Array).toVector(runtime);
  addToNextBatch(
      [=, values{std::move(values)}] { glClearBufferuiv(buffer, drawbuffer, values.data()); });
  return nullptr;
}

SIMPLE_NATIVE_METHOD(clearBufferfi, glClearBufferfi); // buffer, drawbuffer, depth, stencil

// Query objects (WebGL2)
// ----------------------

NATIVE_METHOD(createQuery) {
  return exglGenObject(runtime, glGenQueries);
}

NATIVE_METHOD(deleteQuery) {
  return exglDeleteObject(ARG(0, UEXGLContextId), glDeleteQueries);
}

NATIVE_METHOD(isQuery) {
  return exglIsObject(ARG(0, UEXGLObjectId), glIsQuery);
}

NATIVE_METHOD(beginQuery) {
  auto target = ARG(0, GLenum);
  auto query = ARG(1, UEXGLObjectId);
  addToNextBatch([=] { glBeginQuery(target, lookupObject(query)); });
  return nullptr;
}

SIMPLE_NATIVE_METHOD(endQuery, glEndQuery); // target

NATIVE_METHOD(getQuery) {
  auto target = ARG(0, GLenum);
  auto pname = ARG(1, GLenum);
  GLint params;
  addBlockingToNextBatch([&] { glGetQueryiv(target, pname, &params); });
  return params == 0 ? jsi::Value::null() : static_cast<double>(params);
}

NATIVE_METHOD(getQueryParameter) {
  auto query = ARG(0, UEXGLObjectId);
  auto pname = ARG(1, GLenum);
  GLuint params;
  addBlockingToNextBatch([&] { glGetQueryObjectuiv(lookupObject(query), pname, &params); });
  return params == 0 ? jsi::Value::null() : static_cast<double>(params);
}

// Samplers (WebGL2)
// -----------------

NATIVE_METHOD(createSampler) {
  return exglGenObject(runtime, glGenSamplers);
}

NATIVE_METHOD(deleteSampler) {
  return exglDeleteObject(ARG(0, UEXGLContextId), glDeleteSamplers);
}

NATIVE_METHOD(bindSampler) {
  auto unit = ARG(0, GLuint);
  auto sampler = ARG(1, UEXGLObjectId);
  addToNextBatch([=] { glBindSampler(unit, lookupObject(sampler)); });
  return nullptr;
}

NATIVE_METHOD(isSampler) {
  return exglIsObject(ARG(0, UEXGLObjectId), glIsSampler);
}

NATIVE_METHOD(samplerParameteri) {
  auto sampler = ARG(0, UEXGLObjectId);
  auto pname = ARG(1, GLenum);
  auto param = ARG(2, GLfloat);
  addToNextBatch([=] { glSamplerParameteri(lookupObject(sampler), pname, param); });
  return nullptr;
}

NATIVE_METHOD(samplerParameterf) {
  auto sampler = ARG(0, UEXGLObjectId);
  auto pname = ARG(1, GLenum);
  auto param = ARG(2, GLfloat);
  addToNextBatch([=] { glSamplerParameterf(lookupObject(sampler), pname, param); });
  return nullptr;
}

NATIVE_METHOD(getSamplerParameter) {
  auto sampler = ARG(0, UEXGLObjectId);
  auto pname = ARG(1, GLenum);
  bool isFloatParam = pname == GL_TEXTURE_MAX_LOD || pname == GL_TEXTURE_MIN_LOD;
  union {
    GLfloat f;
    GLint i;
  } param;

  addBlockingToNextBatch([&] {
    if (isFloatParam) {
      glGetSamplerParameterfv(lookupObject(sampler), pname, &param.f);
    } else {
      glGetSamplerParameteriv(lookupObject(sampler), pname, &param.i);
    }
  });
  return isFloatParam ? static_cast<double>(param.f) : static_cast<double>(param.i);
}

// Sync objects (WebGL2)
// ---------------------

UNIMPL_NATIVE_METHOD(fenceSync)

UNIMPL_NATIVE_METHOD(isSync)

UNIMPL_NATIVE_METHOD(deleteSync)

UNIMPL_NATIVE_METHOD(clientWaitSync)

UNIMPL_NATIVE_METHOD(waitSync)

UNIMPL_NATIVE_METHOD(getSyncParameter)

// Transform feedback (WebGL2)
// ---------------------------

NATIVE_METHOD(createTransformFeedback) {
  return exglGenObject(runtime, glGenTransformFeedbacks);
}

NATIVE_METHOD(deleteTransformFeedback) {
  return exglDeleteObject(ARG(0, UEXGLContextId), glDeleteTransformFeedbacks);
}

NATIVE_METHOD(isTransformFeedback) {
  return exglIsObject(ARG(0, UEXGLObjectId), glIsTransformFeedback);
}

NATIVE_METHOD(bindTransformFeedback) {
  auto target = ARG(0, GLenum);
  auto transformFeedback = ARG(1, UEXGLObjectId);
  addToNextBatch([=] { glBindTransformFeedback(target, lookupObject(transformFeedback)); });
  return nullptr;
}

SIMPLE_NATIVE_METHOD(beginTransformFeedback, glBeginTransformFeedback); // primitiveMode

SIMPLE_NATIVE_METHOD(endTransformFeedback, glEndTransformFeedback);

NATIVE_METHOD(transformFeedbackVaryings) {
  auto program = ARG(0, UEXGLObjectId);
  std::vector<std::string> varyings = jsArrayToVector<std::string>(runtime, ARG(1, jsi::Array));
  auto bufferMode = ARG(2, GLenum);

  addToNextBatch([=, varyings{std::move(varyings)}] {
    std::vector<const char *> varyingsRaw(varyings.size());
    std::transform(
        varyings.begin(), varyings.end(), varyingsRaw.begin(), [](const std::string &str) {
          return str.c_str();
        });

    glTransformFeedbackVaryings(
        lookupObject(program), varyingsRaw.size(), varyingsRaw.data(), bufferMode);
  });
  return nullptr;
}

NATIVE_METHOD(getTransformFeedbackVarying) {
  return exglGetActiveInfo(
      runtime,
      ARG(0, UEXGLObjectId),
      ARG(1, GLuint),
      GL_TRANSFORM_FEEDBACK_VARYING_MAX_LENGTH,
      glGetTransformFeedbackVarying);
}

SIMPLE_NATIVE_METHOD(pauseTransformFeedback, glPauseTransformFeedback);

SIMPLE_NATIVE_METHOD(resumeTransformFeedback, glResumeTransformFeedback);

// Uniform buffer objects (WebGL2)
// -------------------------------

NATIVE_METHOD(bindBufferBase) {
  auto target = ARG(0, GLenum);
  auto index = ARG(1, GLuint);
  auto buffer = ARG(2, UEXGLObjectId);
  addToNextBatch([=] { glBindBufferBase(target, index, lookupObject(buffer)); });
  return nullptr;
}

NATIVE_METHOD(bindBufferRange) {
  auto target = ARG(0, GLenum);
  auto index = ARG(1, GLuint);
  auto buffer = ARG(2, UEXGLObjectId);
  auto offset = ARG(3, GLint);
  auto size = ARG(4, GLsizei);
  addToNextBatch([=] { glBindBufferRange(target, index, lookupObject(buffer), offset, size); });
  return nullptr;
}

NATIVE_METHOD(getUniformIndices) {
  auto program = ARG(0, UEXGLObjectId);
  std::vector<std::string> uniformNames = jsArrayToVector<std::string>(runtime, ARG(1, jsi::Array));

  std::vector<const char *> uniformNamesRaw(uniformNames.size());
  std::transform(
      uniformNames.begin(),
      uniformNames.end(),
      uniformNamesRaw.begin(),
      [](const std::string &str) { return str.c_str(); });

  std::vector<GLuint> indices(uniformNames.size());
  addBlockingToNextBatch([&] {
    glGetUniformIndices(
        lookupObject(program), uniformNames.size(), uniformNamesRaw.data(), &indices[0]);
  });
  return TypedArray<TypedArrayKind::Uint32Array>(runtime, indices);
}

NATIVE_METHOD(getActiveUniforms) {
  auto program = ARG(0, UEXGLObjectId);
  auto uniformIndices = jsArrayToVector<GLuint>(runtime, ARG(1, jsi::Array));
  auto pname = ARG(2, GLenum);
  std::vector<GLint> params(uniformIndices.size());

  addBlockingToNextBatch([&] {
    glGetActiveUniformsiv(
        lookupObject(program),
        static_cast<GLsizei>(uniformIndices.size()),
        uniformIndices.data(),
        pname,
        &params[0]);
  });
  return TypedArray<TypedArrayKind::Int32Array>(runtime, params);
}

NATIVE_METHOD(getUniformBlockIndex) {
  auto program = ARG(0, UEXGLObjectId);
  auto uniformBlockName = ARG(1, std::string);

  GLuint blockIndex;
  addBlockingToNextBatch([&] {
    blockIndex = glGetUniformBlockIndex(lookupObject(program), uniformBlockName.c_str());
  });
  return static_cast<double>(blockIndex);
}

UNIMPL_NATIVE_METHOD(getActiveUniformBlockParameter)

NATIVE_METHOD(getActiveUniformBlockName) {
  auto fProgram = ARG(0, UEXGLObjectId);
  auto uniformBlockIndex = ARG(1, GLuint);

  std::string blockName;
  addBlockingToNextBatch([&] {
    GLuint program = lookupObject(fProgram);
    GLint bufSize;
    glGetActiveUniformBlockiv(program, uniformBlockIndex, GL_UNIFORM_BLOCK_NAME_LENGTH, &bufSize);
    blockName.resize(bufSize > 0 ? bufSize - 1 : 0);
    glGetActiveUniformBlockName(program, uniformBlockIndex, bufSize, NULL, &blockName[0]);
  });
  return jsi::String::createFromUtf8(runtime, blockName);
}

NATIVE_METHOD(uniformBlockBinding) {
  auto program = ARG(0, UEXGLObjectId);
  auto uniformBlockIndex = ARG(1, GLuint);
  auto uniformBlockBinding = ARG(2, GLuint);
  addToNextBatch([=] {
    glUniformBlockBinding(lookupObject(program), uniformBlockIndex, uniformBlockBinding);
  });
  return nullptr;
}

// Vertex Array Object (WebGL2)
// ----------------------------

NATIVE_METHOD(createVertexArray) {
  return exglGenObject(runtime, glGenVertexArrays);
}

NATIVE_METHOD(deleteVertexArray) {
  return exglDeleteObject(ARG(0, UEXGLContextId), glDeleteVertexArrays);
}

NATIVE_METHOD(isVertexArray) {
  return exglIsObject(ARG(0, UEXGLObjectId), glIsVertexArray);
}

NATIVE_METHOD(bindVertexArray) {
  auto vertexArray = ARG(0, UEXGLObjectId);
  addToNextBatch([=] { glBindVertexArray(lookupObject(vertexArray)); });
  return nullptr;
}

// Extensions
// ----------

NATIVE_METHOD(getSupportedExtensions) {
  return jsi::Array(runtime, 0);
}

NATIVE_METHOD(getExtension) {
  return nullptr;
}

// Exponent extensions
// -------------------

NATIVE_METHOD(endFrameEXP) {
  addToNextBatch([=] { setNeedsRedraw(true); });
  endNextBatch();
  flushOnGLThread();
  return nullptr;
}

NATIVE_METHOD(flushEXP) {
  // nothing, it's just a helper so that we can measure how much time some operations take
  addBlockingToNextBatch([&] {});
  return nullptr;
}
