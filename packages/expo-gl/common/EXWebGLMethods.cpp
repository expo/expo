#include "EXWebGLMethods.h"
#include "EXGLContextManager.h"
#include "EXGLImageUtils.h"
#include "EXJsiArgsTransform.h"
#include "EXWebGLMethodsHelpers.h"
#include "EXWebGLRenderer.h"

#include <algorithm>

#define ARG(index, type)                                   \
  (argc > index ? unpackArg<type>(runtime, jsArgv + index) \
                : throw std::runtime_error("EXGL: Too few arguments"))

#define CTX()                                \
  auto result = getContext(runtime, jsThis); \
  auto ctx = result.first;                   \
  if (ctx == nullptr) {                      \
    return jsi::Value::undefined();          \
  }

#define NATIVE_METHOD(name, ...)    \
  jsi::Value glNativeMethod_##name( \
      jsi::Runtime &runtime, const jsi::Value &jsThis, const jsi::Value *jsArgv, size_t argc)

#define SIMPLE_NATIVE_METHOD(name, func)                                    \
  NATIVE_METHOD(name) {                                                     \
    CTX();                                                                  \
    ctx->addToNextBatch(generateNativeMethod(runtime, func, jsArgv, argc)); \
    return nullptr;                                                         \
  }

#define UNIMPL_NATIVE_METHOD(name)   \
  NATIVE_METHOD(name) {              \
    return exglUnimplemented(#name); \
  }

namespace expo {
namespace gl_cpp {
namespace method {

ContextWithLock getContext(jsi::Runtime &runtime, const jsi::Value &jsThis) {
  double exglCtxId = jsThis.asObject(runtime).getProperty(runtime, "contextId").asNumber();
  return ContextGet(static_cast<EXGLContextId>(exglCtxId));
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
  jsResult.setProperty(runtime, "stencil", true);
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
  CTX();
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
      ctx->addBlockingToNextBatch([&] { glGetFloatv(pname, glResults.data()); });
      return TypedArray<TypedArrayKind::Float32Array>(runtime, glResults);
    }
      // FLoat32Array[4]
    case GL_BLEND_COLOR:
    case GL_COLOR_CLEAR_VALUE: {
      std::vector<TypedArrayBase::ContentType<TypedArrayKind::Float32Array>> glResults(4);
      ctx->addBlockingToNextBatch([&] { glGetFloatv(pname, glResults.data()); });
      return TypedArray<TypedArrayKind::Float32Array>(runtime, glResults);
    }
      // Int32Array[2]
    case GL_MAX_VIEWPORT_DIMS: {
      std::vector<TypedArrayBase::ContentType<TypedArrayKind::Int32Array>> glResults(2);
      ctx->addBlockingToNextBatch([&] { glGetIntegerv(pname, glResults.data()); });
      return TypedArray<TypedArrayKind::Int32Array>(runtime, glResults);
    }
      // Int32Array[4]
    case GL_SCISSOR_BOX:
    case GL_VIEWPORT: {
      std::vector<TypedArrayBase::ContentType<TypedArrayKind::Int32Array>> glResults(4);
      ctx->addBlockingToNextBatch([&] { glGetIntegerv(pname, glResults.data()); });
      return TypedArray<TypedArrayKind::Int32Array>(runtime, glResults);
    }
      // boolean[4]
    case GL_COLOR_WRITEMASK: {
      GLint glResults[4];
      ctx->addBlockingToNextBatch([&] { glGetIntegerv(pname, glResults); });
      return jsi::Array::createWithElements(
          runtime,
          {jsi::Value(glResults[0]),
           jsi::Value(glResults[1]),
           jsi::Value(glResults[2]),
           jsi::Value(glResults[3])});
    }

      // boolean
    case GL_UNPACK_FLIP_Y_WEBGL:
      return ctx->unpackFLipY;
    case GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL:
    case GL_UNPACK_COLORSPACE_CONVERSION_WEBGL:
      return false;
    case GL_RASTERIZER_DISCARD:
    case GL_SAMPLE_ALPHA_TO_COVERAGE:
    case GL_SAMPLE_COVERAGE:
    case GL_TRANSFORM_FEEDBACK_ACTIVE:
    case GL_TRANSFORM_FEEDBACK_PAUSED: {
      GLint glResult;
      ctx->addBlockingToNextBatch([&] { glGetIntegerv(pname, &glResult); });
      return jsi::Value(glResult);
    }

      // string
    case GL_RENDERER:
    case GL_SHADING_LANGUAGE_VERSION:
    case GL_VENDOR:
    case GL_VERSION: {
      const GLubyte *glStr;
      ctx->addBlockingToNextBatch([&] { glStr = glGetString(pname); });
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
      ctx->addBlockingToNextBatch([&] { glGetFloatv(pname, &glFloat); });
      return static_cast<double>(glFloat);
    }

      // EXGLObjectId
    case GL_ARRAY_BUFFER_BINDING:
    case GL_ELEMENT_ARRAY_BUFFER_BINDING: {
      GLint glInt;
      ctx->addBlockingToNextBatch([&] { glGetIntegerv(pname, &glInt); });
      for (const auto &pair : ctx->objects) {
        if (static_cast<int>(pair.second) == glInt) {
          return createWebGLObject(
              runtime, EXWebGLClass::WebGLBuffer, {static_cast<double>(pair.first)});
        }
      }
      return nullptr;
    }

    case GL_CURRENT_PROGRAM: {
      GLint glInt;
      ctx->addBlockingToNextBatch([&] { glGetIntegerv(pname, &glInt); });
      for (const auto &pair : ctx->objects) {
        if (static_cast<int>(pair.second) == glInt) {
          return createWebGLObject(
              runtime, EXWebGLClass::WebGLProgram, {static_cast<double>(pair.first)});
        }
      }
      return nullptr;
    }

      // Unimplemented...
    case GL_COPY_READ_BUFFER_BINDING:
    case GL_COPY_WRITE_BUFFER_BINDING:
    case GL_DRAW_FRAMEBUFFER_BINDING:
    case GL_READ_FRAMEBUFFER_BINDING:
    case GL_RENDERBUFFER_BINDING:
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
      ctx->addBlockingToNextBatch([&] { glGetIntegerv(pname, &glInt); });
      return jsi::Value(glInt);
    }
  }
}

NATIVE_METHOD(getError) {
  CTX();
  GLenum glResult;
  ctx->addBlockingToNextBatch([&] { glResult = glGetError(); });
  return static_cast<double>(glResult);
}

SIMPLE_NATIVE_METHOD(hint, glHint); // target, mode

NATIVE_METHOD(isEnabled) {
  CTX();
  auto cap = ARG(0, GLenum);
  GLboolean glResult;
  ctx->addBlockingToNextBatch([&] { glResult = glIsEnabled(cap); });
  return glResult == GL_TRUE;
}

SIMPLE_NATIVE_METHOD(lineWidth, glLineWidth); // width

NATIVE_METHOD(pixelStorei) {
  CTX();
  auto pname = ARG(0, GLenum);
  switch (pname) {
    case GL_UNPACK_FLIP_Y_WEBGL: {
      ctx->unpackFLipY = ARG(1, GLboolean);
      break;
    }
    default:
      jsConsoleLog(runtime, { jsi::String::createFromUtf8(runtime, "EXGL: gl.pixelStorei() doesn't support this parameter yet!") });
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
  CTX();
  auto target = ARG(0, GLenum);
  auto buffer = ARG(1, EXWebGLClass);
  ctx->addToNextBatch([=] { glBindBuffer(target, ctx->lookupObject(buffer)); });
  return nullptr;
}

NATIVE_METHOD(bufferData) {
  CTX();
  auto target = ARG(0, GLenum);
  auto &sizeOrData = ARG(1, const jsi::Value &);
  auto usage = ARG(2, GLenum);

  if (sizeOrData.isNumber()) {
    GLsizeiptr length = sizeOrData.getNumber();
    ctx->addToNextBatch([=] { glBufferData(target, length, nullptr, usage); });
  } else if (sizeOrData.isNull() || sizeOrData.isUndefined()) {
    ctx->addToNextBatch([=] { glBufferData(target, 0, nullptr, usage); });
  } else if (sizeOrData.isObject()) {
    auto data = rawTypedArray(runtime, sizeOrData.getObject(runtime));
    ctx->addToNextBatch(
        [=, data{std::move(data)}] { glBufferData(target, data.size(), data.data(), usage); });
  }
  return nullptr;
}

NATIVE_METHOD(bufferSubData) {
  CTX();
  auto target = ARG(0, GLenum);
  auto offset = ARG(1, GLintptr);
  if (ARG(2, const jsi::Value &).isNull()) {
    ctx->addToNextBatch([=] { glBufferSubData(target, offset, 0, nullptr); });
  } else {
    auto data = rawTypedArray(runtime, ARG(2, jsi::Object));
    ctx->addToNextBatch(
        [=, data{std::move(data)}] { glBufferSubData(target, offset, data.size(), data.data()); });
  }
  return nullptr;
}

NATIVE_METHOD(createBuffer) {
  CTX();
  return exglGenObject(ctx, runtime, glGenBuffers, EXWebGLClass::WebGLBuffer);
}

NATIVE_METHOD(deleteBuffer) {
  CTX();
  return exglDeleteObject(ctx, ARG(0, EXWebGLClass), glDeleteBuffers);
}

NATIVE_METHOD(getBufferParameter) {
  CTX();
  auto target = ARG(0, GLenum);
  auto pname = ARG(1, GLenum);
  GLint glResult;
  ctx->addBlockingToNextBatch([&] { glGetBufferParameteriv(target, pname, &glResult); });
  return jsi::Value(glResult);
}

NATIVE_METHOD(isBuffer) {
  CTX();
  return exglIsObject(ctx, ARG(0, EXWebGLClass), glIsBuffer);
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
  CTX();
  auto target = ARG(0, GLenum);
  auto framebuffer = ARG(1, EXWebGLClass);
  ctx->addToNextBatch([=] {
    glBindFramebuffer(
        target, framebuffer == 0 ? ctx->defaultFramebuffer : ctx->lookupObject(framebuffer));
  });
  return nullptr;
}

NATIVE_METHOD(checkFramebufferStatus) {
  CTX();
  auto target = ARG(0, GLenum);
  GLenum glResult;
  ctx->addBlockingToNextBatch([&] { glResult = glCheckFramebufferStatus(target); });
  return static_cast<double>(glResult);
}

NATIVE_METHOD(createFramebuffer) {
  CTX();
  return exglGenObject(ctx, runtime, glGenFramebuffers, EXWebGLClass::WebGLFramebuffer);
}

NATIVE_METHOD(deleteFramebuffer) {
  CTX();
  return exglDeleteObject(ctx, ARG(0, EXWebGLClass), glDeleteFramebuffers);
}

NATIVE_METHOD(framebufferRenderbuffer) {
  CTX();
  auto target = ARG(0, GLenum);
  auto attachment = ARG(1, GLenum);
  auto renderbuffertarget = ARG(2, GLenum);
  auto fRenderbuffer = ARG(3, EXWebGLClass);
  ctx->addToNextBatch([=] {
    GLuint renderbuffer = ctx->lookupObject(fRenderbuffer);
    glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer);
  });
  return nullptr;
}

NATIVE_METHOD(framebufferTexture2D, 5) {
  CTX();
  auto target = ARG(0, GLenum);
  auto attachment = ARG(1, GLenum);
  auto textarget = ARG(2, GLenum);
  auto fTexture = ARG(3, EXWebGLClass);
  auto level = ARG(4, GLint);
  ctx->addToNextBatch([=] {
    glFramebufferTexture2D(target, attachment, textarget, ctx->lookupObject(fTexture), level);
  });
  return nullptr;
}

UNIMPL_NATIVE_METHOD(getFramebufferAttachmentParameter)

NATIVE_METHOD(isFramebuffer) {
  CTX();
  return exglIsObject(ctx, ARG(0, EXWebGLClass), glIsFramebuffer);
}

NATIVE_METHOD(readPixels) {
  CTX();
  auto x = ARG(0, GLint);
  auto y = ARG(1, GLint);
  auto width = ARG(2, GLuint); // GLsizei allows negative values
  auto height = ARG(3, GLuint);
  auto format = ARG(4, GLenum);
  auto type = ARG(5, GLenum);
  size_t byteLength = width * height * bytesPerPixel(type, format);
  std::vector<uint8_t> pixels(byteLength);
  ctx->addBlockingToNextBatch(
      [&] { glReadPixels(x, y, width, height, format, type, pixels.data()); });

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
  CTX();
  auto target = ARG(0, GLenum);
  auto attachment = ARG(1, GLenum);
  auto texture = ARG(2, EXWebGLClass);
  auto level = ARG(3, GLint);
  auto layer = ARG(4, GLint);
  ctx->addToNextBatch([=] {
    glFramebufferTextureLayer(target, attachment, ctx->lookupObject(texture), level, layer);
  });
  return nullptr;
}

NATIVE_METHOD(invalidateFramebuffer) {
  CTX();
  auto target = ARG(0, GLenum);
  auto jsAttachments = ARG(1, jsi::Array);

  std::vector<GLenum> attachments(jsAttachments.size(runtime));
  for (size_t i = 0; i < attachments.size(); i++) {
    attachments[i] = jsAttachments.getValueAtIndex(runtime, i).asNumber();
  }
  ctx->addToNextBatch([=, attachaments{std::move(attachments)}] {
    glInvalidateFramebuffer(target, static_cast<GLsizei>(attachments.size()), attachments.data());
  });
  return nullptr; // breaking change TypedArray -> Array (bug in previous implementation)
}

NATIVE_METHOD(invalidateSubFramebuffer) {
  CTX();
  auto target = ARG(0, GLenum);
  auto jsAttachments = ARG(1, jsi::Array);
  auto x = ARG(2, GLint);
  auto y = ARG(3, GLint);
  auto width = ARG(4, GLint);
  auto height = ARG(5, GLint);
  std::vector<GLenum> attachments(jsAttachments.size(runtime));
  for (size_t i = 0; i < attachments.size(); i++) {
    attachments[i] = jsAttachments.getValueAtIndex(runtime, i).asNumber();
  }
  ctx->addToNextBatch([=, attachments{std::move(attachments)}] {
    glInvalidateSubFramebuffer(
        target, static_cast<GLsizei>(attachments.size()), attachments.data(), x, y, width, height);
  });
  return nullptr;
}

SIMPLE_NATIVE_METHOD(readBuffer, glReadBuffer); // mode

// Renderbuffers
// -------------

NATIVE_METHOD(bindRenderbuffer) {
  CTX();
  auto target = ARG(0, GLenum);
  auto fRenderbuffer = ARG(1, EXWebGLClass);
  ctx->addToNextBatch([=] { glBindRenderbuffer(target, ctx->lookupObject(fRenderbuffer)); });
  return nullptr;
}

NATIVE_METHOD(createRenderbuffer) {
  CTX();
  return exglGenObject(ctx, runtime, glGenRenderbuffers, EXWebGLClass::WebGLRenderbuffer);
}

NATIVE_METHOD(deleteRenderbuffer) {
  CTX();
  return exglDeleteObject(ctx, ARG(0, EXWebGLClass), glDeleteRenderbuffers);
}

UNIMPL_NATIVE_METHOD(getRenderbufferParameter)

NATIVE_METHOD(isRenderbuffer) {
  CTX();
  return exglIsObject(ctx, ARG(0, EXWebGLClass), glIsRenderbuffer);
}

NATIVE_METHOD(renderbufferStorage) {
  CTX();
  auto target = ARG(0, GLenum);
  auto internalformat = ARG(1, GLint);
  auto width = ARG(2, GLsizei);
  auto height = ARG(3, GLsizei);

  // WebGL allows `GL_DEPTH_STENCIL` flag to be passed here,
  // however OpenGL ES seems to require sized format, so we fall back to `GL_DEPTH24_STENCIL8`.
  internalformat = internalformat == GL_DEPTH_STENCIL ? GL_DEPTH24_STENCIL8 : internalformat;

  ctx->addToNextBatch([=] { glRenderbufferStorage(target, internalformat, width, height); });
  return nullptr;
}

// Renderbuffers (WebGL2)
// ----------------------

NATIVE_METHOD(getInternalformatParameter) {
  CTX();
  auto target = ARG(0, GLenum);
  auto internalformat = ARG(1, GLenum);
  auto pname = ARG(2, GLenum);

  std::vector<TypedArrayBase::ContentType<TypedArrayKind::Int32Array>> glResults;
  ctx->addBlockingToNextBatch([&] {
    GLint count;
    glGetInternalformativ(target, internalformat, GL_NUM_SAMPLE_COUNTS, 1, &count);
    glResults.resize(count);
    glGetInternalformativ(target, internalformat, pname, count, glResults.data());
  });

  return TypedArray<TypedArrayKind::Int32Array>(runtime, glResults);
}

UNIMPL_NATIVE_METHOD(renderbufferStorageMultisample)

// Textures
// --------

NATIVE_METHOD(bindTexture) {
  CTX();
  auto target = ARG(0, GLenum);
  auto texture = ARG(1, EXWebGLClass);
  ctx->addToNextBatch([=] { glBindTexture(target, ctx->lookupObject(texture)); });
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
  CTX();
  return exglGenObject(ctx, runtime, glGenTextures, EXWebGLClass::WebGLTexture);
}

NATIVE_METHOD(deleteTexture) {
  CTX();
  return exglDeleteObject(ctx, ARG(0, EXWebGLClass), glDeleteTextures);
}

SIMPLE_NATIVE_METHOD(generateMipmap, glGenerateMipmap) // target

UNIMPL_NATIVE_METHOD(getTexParameter)

NATIVE_METHOD(isTexture) {
  CTX();
  return exglIsObject(ctx, ARG(0, EXWebGLClass), glIsTexture);
}

NATIVE_METHOD(texImage2D, 6) {
  CTX();
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
      ctx->addToNextBatch([=] {
        glTexImage2D(target, level, internalformat, width, height, border, format, type, nullptr);
      });
      return nullptr;
    }
    auto data = ARG(8, jsi::Object);

    if (data.isArrayBuffer(runtime) || isTypedArray(runtime, data)) {
      std::vector<uint8_t> vec = rawTypedArray(runtime, std::move(data));
      if (ctx->unpackFLipY) {
        flipPixels(vec.data(), width * bytesPerPixel(type, format), height);
      }
      ctx->addToNextBatch([=, vec{std::move(vec)}] {
        glTexImage2D(
            target, level, internalformat, width, height, border, format, type, vec.data());
      });
    } else {
      auto image = loadImage(runtime, data, &width, &height, nullptr);
      if (ctx->unpackFLipY) {
        flipPixels(image.get(), width * bytesPerPixel(type, format), height);
      }
      ctx->addToNextBatch([=] {
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
    if (ctx->unpackFLipY) {
      flipPixels(image.get(), width * bytesPerPixel(type, format), height);
    }
    ctx->addToNextBatch([=] {
      glTexImage2D(target, level, internalformat, width, height, border, format, type, image.get());
    });
  } else {
    throw std::runtime_error("EXGL: Invalid number of arguments to gl.texImage2D()!");
  }
  return nullptr;
}

NATIVE_METHOD(texSubImage2D, 6) {
  CTX();
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
      ctx->addToNextBatch([=] {
        auto empty = std::make_unique<uint8_t>(width * height * bytesPerPixel(type, format));
        std::memset(empty.get(), 0, width * height * bytesPerPixel(type, format));
        glTexImage2D(target, level, xoffset, yoffset, width, height, format, type, empty.get());
      });
      return nullptr;
    }

    auto data = ARG(8, jsi::Object);

    if (data.isArrayBuffer(runtime) || isTypedArray(runtime, data)) {
      std::vector<uint8_t> vec = rawTypedArray(runtime, std::move(data));
      if (ctx->unpackFLipY) {
        flipPixels(vec.data(), width * bytesPerPixel(type, format), height);
      }
      ctx->addToNextBatch([=, vec{std::move(vec)}] {
        glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, vec.data());
      });
    } else {
      auto image = loadImage(runtime, data, &width, &height, nullptr);
      if (ctx->unpackFLipY) {
        flipPixels(image.get(), width * bytesPerPixel(type, format), height);
      }
      ctx->addToNextBatch([=] {
        glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, image.get());
      });
    }
  } else if (argc == 7) {
    auto format = ARG(4, GLenum);
    auto type = ARG(5, GLenum);
    auto data = ARG(6, jsi::Object);
    GLsizei width = 0, height = 0;
    auto image = loadImage(runtime, data, &width, &height, nullptr);
    if (ctx->unpackFLipY) {
      flipPixels(image.get(), width * bytesPerPixel(type, format), height);
    }
    ctx->addToNextBatch([=] {
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
  CTX();
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
    ctx->addToNextBatch([=] {
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
    std::vector<uint8_t> vec = rawTypedArray(runtime, std::move(data));
    if (ctx->unpackFLipY) {
      flip(vec.data());
    }
    ctx->addToNextBatch([=, vec{std::move(vec)}] {
      glTexImage3D(
          target, level, internalformat, width, height, depth, border, format, type, vec.data());
    });
  } else {
    auto image = loadImage(runtime, data, &width, &height, nullptr);
    if (ctx->unpackFLipY) {
      flip(image.get());
    }
    ctx->addToNextBatch([=] {
      glTexImage3D(
          target, level, internalformat, width, height, depth, border, format, type, image.get());
    });
  }
  return nullptr;
}

NATIVE_METHOD(texSubImage3D) {
  CTX();
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
    ctx->addToNextBatch([=] {
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
    std::vector<uint8_t> vec = rawTypedArray(runtime, std::move(data));
    if (ctx->unpackFLipY) {
      flip(vec.data());
    }
    ctx->addToNextBatch([=, vec{std::move(vec)}] {
      glTexSubImage3D(
          target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, vec.data());
    });
  } else {
    auto image = loadImage(runtime, data, &width, &height, nullptr);
    if (ctx->unpackFLipY) {
      flip(image.get());
    }
    ctx->addToNextBatch([=] {
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
  CTX();
  auto program = ARG(0, EXWebGLClass);
  auto shader = ARG(1, EXWebGLClass);
  ctx->addToNextBatch(
      [=] { glAttachShader(ctx->lookupObject(program), ctx->lookupObject(shader)); });
  return nullptr;
}

NATIVE_METHOD(bindAttribLocation) {
  CTX();
  auto program = ARG(0, EXWebGLClass);
  auto index = ARG(1, GLuint);
  auto name = ARG(2, std::string);
  ctx->addToNextBatch([=, name{std::move(name)}] {
    glBindAttribLocation(ctx->lookupObject(program), index, name.c_str());
  });
  return nullptr;
}

NATIVE_METHOD(compileShader) {
  CTX();
  auto shader = ARG(0, EXWebGLClass);
  ctx->addToNextBatch([=] { glCompileShader(ctx->lookupObject(shader)); });
  return nullptr;
}

NATIVE_METHOD(createProgram) {
  CTX();
  return exglCreateObject(ctx, runtime, glCreateProgram, EXWebGLClass::WebGLProgram);
}

NATIVE_METHOD(createShader) {
  CTX();
  auto type = ARG(0, GLenum);
  if (type == GL_VERTEX_SHADER || type == GL_FRAGMENT_SHADER) {
    return exglCreateObject(
        ctx, runtime, std::bind(glCreateShader, type), EXWebGLClass::WebGLShader);
  } else {
    throw std::runtime_error("unknown shader type passed to function");
  }
}

NATIVE_METHOD(deleteProgram) {
  CTX();
  return exglDeleteObject(ctx, ARG(0, EXWebGLClass), glDeleteProgram);
}

NATIVE_METHOD(deleteShader) {
  CTX();
  return exglDeleteObject(ctx, ARG(0, EXWebGLClass), glDeleteShader);
}

NATIVE_METHOD(detachShader) {
  CTX();
  auto program = ARG(0, EXWebGLClass);
  auto shader = ARG(1, EXWebGLClass);
  ctx->addToNextBatch(
      [=] { glDetachShader(ctx->lookupObject(program), ctx->lookupObject(shader)); });
  return nullptr;
}

NATIVE_METHOD(getAttachedShaders) {
  CTX();
  auto fProgram = ARG(0, EXWebGLClass);

  GLint count;
  std::vector<GLuint> glResults;
  ctx->addBlockingToNextBatch([&] {
    GLuint program = ctx->lookupObject(fProgram);
    glGetProgramiv(program, GL_ATTACHED_SHADERS, &count);
    glResults.resize(count);
    glGetAttachedShaders(program, count, nullptr, glResults.data());
  });

  jsi::Array jsResults(runtime, count);
  for (auto i = 0; i < count; ++i) {
    EXGLObjectId exglObjId = 0;
    for (const auto &pair : ctx->objects) {
      if (pair.second == glResults[i]) {
        exglObjId = pair.first;
      }
    }
    if (exglObjId == 0) {
      throw std::runtime_error(
          "EXGL: Internal error: couldn't find EXGLObjectId "
          "associated with shader in getAttachedShaders()!");
    }
    jsResults.setValueAtIndex(
        runtime,
        i,
        createWebGLObject(runtime, EXWebGLClass::WebGLShader, {static_cast<double>(exglObjId)}));
  }
  return jsResults;
}

NATIVE_METHOD(getProgramParameter) {
  CTX();
  auto fProgram = ARG(0, EXWebGLClass);
  auto pname = ARG(1, GLenum);
  GLint glResult;
  ctx->addBlockingToNextBatch(
      [&] { glGetProgramiv(ctx->lookupObject(fProgram), pname, &glResult); });
  if (pname == GL_DELETE_STATUS || pname == GL_LINK_STATUS || pname == GL_VALIDATE_STATUS) {
    return glResult == GL_TRUE;
  } else {
    return glResult;
  }
}

NATIVE_METHOD(getShaderParameter) {
  CTX();
  auto fShader = ARG(0, EXWebGLClass);
  auto pname = ARG(1, GLenum);
  GLint glResult;
  ctx->addBlockingToNextBatch([&] { glGetShaderiv(ctx->lookupObject(fShader), pname, &glResult); });
  if (pname == GL_DELETE_STATUS || pname == GL_COMPILE_STATUS) {
    return glResult == GL_TRUE;
  } else {
    return glResult;
  }
}

NATIVE_METHOD(getShaderPrecisionFormat) {
  CTX();
  auto shaderType = ARG(0, GLenum);
  auto precisionType = ARG(1, GLenum);

  GLint range[2], precision;
  ctx->addBlockingToNextBatch(
      [&] { glGetShaderPrecisionFormat(shaderType, precisionType, range, &precision); });

  jsi::Object jsResult =
      createWebGLObject(runtime, EXWebGLClass::WebGLShaderPrecisionFormat, {}).asObject(runtime);
  jsResult.setProperty(runtime, "rangeMin", jsi::Value(range[0]));
  jsResult.setProperty(runtime, "rangeMax", jsi::Value(range[1]));
  jsResult.setProperty(runtime, "precision", jsi::Value(precision));
  return jsResult;
}

NATIVE_METHOD(getProgramInfoLog) {
  CTX();
  auto fObj = ARG(0, EXWebGLClass);
  std::string str;
  ctx->addBlockingToNextBatch([&] {
    GLuint obj = ctx->lookupObject(fObj);
    GLint length;
    glGetProgramiv(obj, GL_INFO_LOG_LENGTH, &length);
    str.resize(length > 0 ? length - 1 : 0);
    glGetProgramInfoLog(obj, length, nullptr, &str[0]);
  });
  return jsi::String::createFromUtf8(runtime, str);
}

NATIVE_METHOD(getShaderInfoLog) {
  CTX();
  auto fObj = ARG(0, EXWebGLClass);
  std::string str;
  ctx->addBlockingToNextBatch([&] {
    GLuint obj = ctx->lookupObject(fObj);
    GLint length;
    glGetShaderiv(obj, GL_INFO_LOG_LENGTH, &length);
    str.resize(length > 0 ? length - 1 : 0);
    glGetShaderInfoLog(obj, length, nullptr, &str[0]);
  });
  return jsi::String::createFromUtf8(runtime, str);
}

NATIVE_METHOD(getShaderSource) {
  CTX();
  auto fObj = ARG(0, EXWebGLClass);
  std::string str;
  ctx->addBlockingToNextBatch([&] {
    GLuint obj = ctx->lookupObject(fObj);
    GLint length;
    glGetShaderiv(obj, GL_SHADER_SOURCE_LENGTH, &length);
    str.resize(length > 0 ? length - 1 : 0);
    glGetShaderSource(obj, length, nullptr, &str[0]);
  });
  return jsi::String::createFromUtf8(runtime, str);
}

NATIVE_METHOD(isShader) {
  CTX();
  return exglIsObject(ctx, ARG(0, EXWebGLClass), glIsShader);
}

NATIVE_METHOD(isProgram) {
  CTX();
  return exglIsObject(ctx, ARG(0, EXWebGLClass), glIsProgram);
}

NATIVE_METHOD(linkProgram) {
  CTX();
  auto fProgram = ARG(0, EXWebGLClass);
  ctx->addToNextBatch([=] { glLinkProgram(ctx->lookupObject(fProgram)); });
  return nullptr;
}

NATIVE_METHOD(shaderSource) {
  CTX();
  auto fShader = ARG(0, EXWebGLClass);
  auto str = ARG(1, std::string);
  ctx->addToNextBatch([=, str{std::move(str)}] {
    const char *cstr = str.c_str();
    glShaderSource(ctx->lookupObject(fShader), 1, &cstr, nullptr);
  });
  return nullptr;
}

NATIVE_METHOD(useProgram) {
  CTX();
  auto program = ARG(0, EXWebGLClass);
  ctx->addToNextBatch([=] { glUseProgram(ctx->lookupObject(program)); });
  return nullptr;
}

NATIVE_METHOD(validateProgram) {
  CTX();
  auto program = ARG(0, EXWebGLClass);
  ctx->addToNextBatch([=] { glValidateProgram(ctx->lookupObject(program)); });
  return nullptr;
}

// Programs and shaders (WebGL2)

NATIVE_METHOD(getFragDataLocation) {
  CTX();
  auto program = ARG(0, EXWebGLClass);
  auto name = ARG(1, std::string);
  GLint location;
  ctx->addBlockingToNextBatch(
      [&] { location = glGetFragDataLocation(ctx->lookupObject(program), name.c_str()); });
  return location == -1 ? jsi::Value::null() : jsi::Value(location);
}

// Uniforms and attributes
// -----------------------

SIMPLE_NATIVE_METHOD(disableVertexAttribArray, glDisableVertexAttribArray); // index

SIMPLE_NATIVE_METHOD(enableVertexAttribArray, glEnableVertexAttribArray); // index

NATIVE_METHOD(getActiveAttrib) {
  CTX();
  return exglGetActiveInfo(
      ctx,
      runtime,
      ARG(0, EXWebGLClass),
      ARG(1, GLuint),
      GL_ACTIVE_ATTRIBUTE_MAX_LENGTH,
      glGetActiveAttrib);
}

NATIVE_METHOD(getActiveUniform) {
  CTX();
  return exglGetActiveInfo(
      ctx,
      runtime,
      ARG(0, EXWebGLClass),
      ARG(1, GLuint),
      GL_ACTIVE_UNIFORM_MAX_LENGTH,
      glGetActiveUniform);
}

NATIVE_METHOD(getAttribLocation) {
  CTX();
  auto program = ARG(0, EXWebGLClass);
  auto name = ARG(1, std::string);
  GLint location;
  ctx->addBlockingToNextBatch(
      [&] { location = glGetAttribLocation(ctx->lookupObject(program), name.c_str()); });
  return jsi::Value(location);
}

UNIMPL_NATIVE_METHOD(getUniform)

NATIVE_METHOD(getUniformLocation) {
  CTX();
  auto program = ARG(0, EXWebGLClass);
  auto name = ARG(1, std::string);
  GLint location;
  ctx->addBlockingToNextBatch(
      [&] { location = glGetUniformLocation(ctx->lookupObject(program), name.c_str()); });
  return location == -1
      ? jsi::Value::null()
      : createWebGLObject(runtime, EXWebGLClass::WebGLUniformLocation, {location});
}

UNIMPL_NATIVE_METHOD(getVertexAttrib)

UNIMPL_NATIVE_METHOD(getVertexAttribOffset)

NATIVE_METHOD(uniform1f) {
  CTX();
  auto uniform = ARG(0, EXWebGLClass);
  auto x = ARG(1, GLfloat);
  ctx->addToNextBatch([uniform, x]() { glUniform1f(uniform, x); });
  return nullptr;
}

NATIVE_METHOD(uniform2f) {
  CTX();
  auto uniform = ARG(0, EXWebGLClass);
  auto x = ARG(1, GLfloat);
  auto y = ARG(2, GLfloat);
  ctx->addToNextBatch([uniform, x, y]() { glUniform2f(uniform, x, y); });
  return nullptr;
}

NATIVE_METHOD(uniform3f) {
  CTX();
  auto uniform = ARG(0, EXWebGLClass);
  auto x = ARG(1, GLfloat);
  auto y = ARG(2, GLfloat);
  auto z = ARG(3, GLfloat);
  ctx->addToNextBatch([uniform, x, y, z]() { glUniform3f(uniform, x, y, z); });
  return nullptr;
}

NATIVE_METHOD(uniform4f) {
  CTX();
  auto uniform = ARG(0, EXWebGLClass);
  auto x = ARG(1, GLfloat);
  auto y = ARG(2, GLfloat);
  auto z = ARG(3, GLfloat);
  auto w = ARG(4, GLfloat);
  ctx->addToNextBatch([uniform, x, y, z, w]() { glUniform4f(uniform, x, y, z, w); });
  return nullptr;
}

NATIVE_METHOD(uniform1i) {
  CTX();
  auto uniform = ARG(0, EXWebGLClass);
  auto x = ARG(1, GLint);
  ctx->addToNextBatch([uniform, x]() { glUniform1i(uniform, x); });
  return nullptr;
}

NATIVE_METHOD(uniform2i) {
  CTX();
  auto uniform = ARG(0, EXWebGLClass);
  auto x = ARG(1, GLint);
  auto y = ARG(2, GLint);
  ctx->addToNextBatch([uniform, x, y]() { glUniform2i(uniform, x, y); });
  return nullptr;
}

NATIVE_METHOD(uniform3i) {
  CTX();
  auto uniform = ARG(0, EXWebGLClass);
  auto x = ARG(1, GLint);
  auto y = ARG(2, GLint);
  auto z = ARG(3, GLint);
  ctx->addToNextBatch([uniform, x, y, z]() { glUniform3i(uniform, x, y, z); });
  return nullptr;
}

NATIVE_METHOD(uniform4i) {
  CTX();
  auto uniform = ARG(0, EXWebGLClass);
  auto x = ARG(1, GLint);
  auto y = ARG(2, GLint);
  auto z = ARG(3, GLint);
  auto w = ARG(4, GLint);
  ctx->addToNextBatch([uniform, x, y, z, w]() { glUniform4i(uniform, x, y, z, w); });
  return nullptr;
}

NATIVE_METHOD(uniform1fv) {
  CTX();
  return exglUniformv(ctx, glUniform1fv, ARG(0, EXWebGLClass), 1, ARG(1, std::vector<float>));
};

NATIVE_METHOD(uniform2fv) {
  CTX();
  return exglUniformv(ctx, glUniform2fv, ARG(0, EXWebGLClass), 2, ARG(1, std::vector<float>));
};

NATIVE_METHOD(uniform3fv) {
  CTX();
  return exglUniformv(ctx, glUniform3fv, ARG(0, EXWebGLClass), 3, ARG(1, std::vector<float>));
};

NATIVE_METHOD(uniform4fv) {
  CTX();
  return exglUniformv(ctx, glUniform4fv, ARG(0, EXWebGLClass), 4, ARG(1, std::vector<float>));
};

NATIVE_METHOD(uniform1iv) {
  CTX();
  return exglUniformv(ctx, glUniform1iv, ARG(0, EXWebGLClass), 1, ARG(1, std::vector<int32_t>));
};

NATIVE_METHOD(uniform2iv) {
  CTX();
  return exglUniformv(ctx, glUniform2iv, ARG(0, EXWebGLClass), 2, ARG(1, std::vector<int32_t>));
};

NATIVE_METHOD(uniform3iv) {
  CTX();
  return exglUniformv(ctx, glUniform3iv, ARG(0, EXWebGLClass), 3, ARG(1, std::vector<int32_t>));
};

NATIVE_METHOD(uniform4iv) {
  CTX();
  return exglUniformv(ctx, glUniform4iv, ARG(0, EXWebGLClass), 4, ARG(1, std::vector<int32_t>));
};

NATIVE_METHOD(uniformMatrix2fv) {
  CTX();
  return exglUniformMatrixv(
      ctx,
      glUniformMatrix2fv,
      ARG(0, EXWebGLClass),
      ARG(1, GLboolean),
      4,
      ARG(2, std::vector<float>));
}

NATIVE_METHOD(uniformMatrix3fv) {
  CTX();
  return exglUniformMatrixv(
      ctx,
      glUniformMatrix3fv,
      ARG(0, EXWebGLClass),
      ARG(1, GLboolean),
      9,
      ARG(2, std::vector<float>));
}

NATIVE_METHOD(uniformMatrix4fv) {
  CTX();
  return exglUniformMatrixv(
      ctx,
      glUniformMatrix4fv,
      ARG(0, EXWebGLClass),
      ARG(1, GLboolean),
      16,
      ARG(2, std::vector<float>));
}

NATIVE_METHOD(vertexAttrib1fv) {
  CTX();
  return exglVertexAttribv(
      ctx, glVertexAttrib1fv, ARG(0, EXWebGLClass), ARG(1, std::vector<float>));
}

NATIVE_METHOD(vertexAttrib2fv) {
  CTX();
  return exglVertexAttribv(
      ctx, glVertexAttrib2fv, ARG(0, EXWebGLClass), ARG(1, std::vector<float>));
}

NATIVE_METHOD(vertexAttrib3fv) {
  CTX();
  return exglVertexAttribv(
      ctx, glVertexAttrib3fv, ARG(0, EXWebGLClass), ARG(1, std::vector<float>));
}

NATIVE_METHOD(vertexAttrib4fv) {
  CTX();
  return exglVertexAttribv(
      ctx, glVertexAttrib4fv, ARG(0, EXWebGLClass), ARG(1, std::vector<float>));
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

NATIVE_METHOD(uniform1ui) {
  CTX();
  auto uniform = ARG(0, EXWebGLClass);
  auto x = ARG(1, GLuint);
  ctx->addToNextBatch([uniform, x]() { glUniform1ui(uniform, x); });
  return nullptr;
}

NATIVE_METHOD(uniform2ui) {
  CTX();
  auto uniform = ARG(0, EXWebGLClass);
  auto x = ARG(1, GLuint);
  auto y = ARG(2, GLuint);
  ctx->addToNextBatch([uniform, x, y]() { glUniform2ui(uniform, x, y); });
  return nullptr;
}

NATIVE_METHOD(uniform3ui) {
  CTX();
  auto uniform = ARG(0, EXWebGLClass);
  auto x = ARG(1, GLuint);
  auto y = ARG(2, GLuint);
  auto z = ARG(3, GLuint);
  ctx->addToNextBatch([uniform, x, y, z]() { glUniform3ui(uniform, x, y, z); });
  return nullptr;
}

NATIVE_METHOD(uniform4ui) {
  CTX();
  auto uniform = ARG(0, EXWebGLClass);
  auto x = ARG(1, GLuint);
  auto y = ARG(2, GLuint);
  auto z = ARG(3, GLuint);
  auto w = ARG(4, GLuint);
  ctx->addToNextBatch([uniform, x, y, z, w]() { glUniform4ui(uniform, x, y, z, w); });
  return nullptr;
}

NATIVE_METHOD(uniform1uiv) {
  CTX();
  return exglUniformv(ctx, glUniform1uiv, ARG(0, EXWebGLClass), 1, ARG(1, std::vector<uint32_t>));
};

NATIVE_METHOD(uniform2uiv) {
  CTX();
  return exglUniformv(ctx, glUniform2uiv, ARG(0, EXWebGLClass), 2, ARG(1, std::vector<uint32_t>));
};

NATIVE_METHOD(uniform3uiv) {
  CTX();
  return exglUniformv(ctx, glUniform3uiv, ARG(0, EXWebGLClass), 3, ARG(1, std::vector<uint32_t>));
};

NATIVE_METHOD(uniform4uiv) {
  CTX();
  return exglUniformv(ctx, glUniform4uiv, ARG(0, EXWebGLClass), 4, ARG(1, std::vector<uint32_t>));
};

NATIVE_METHOD(uniformMatrix3x2fv) {
  CTX();
  return exglUniformMatrixv(
      ctx,
      glUniformMatrix3x2fv,
      ARG(0, EXWebGLClass),
      ARG(1, GLboolean),
      6,
      ARG(2, std::vector<float>));
}

NATIVE_METHOD(uniformMatrix4x2fv) {
  CTX();
  return exglUniformMatrixv(
      ctx,
      glUniformMatrix4x2fv,
      ARG(0, EXWebGLClass),
      ARG(1, GLboolean),
      8,
      ARG(2, std::vector<float>));
}

NATIVE_METHOD(uniformMatrix2x3fv) {
  CTX();
  return exglUniformMatrixv(
      ctx,
      glUniformMatrix2x3fv,
      ARG(0, EXWebGLClass),
      ARG(1, GLboolean),
      6,
      ARG(2, std::vector<float>));
}

NATIVE_METHOD(uniformMatrix4x3fv) {
  CTX();
  return exglUniformMatrixv(
      ctx,
      glUniformMatrix4x3fv,
      ARG(0, EXWebGLClass),
      ARG(1, GLboolean),
      12,
      ARG(2, std::vector<float>));
}

NATIVE_METHOD(uniformMatrix2x4fv) {
  CTX();
  return exglUniformMatrixv(
      ctx,
      glUniformMatrix2x4fv,
      ARG(0, EXWebGLClass),
      ARG(1, GLboolean),
      8,
      ARG(2, std::vector<float>));
}

NATIVE_METHOD(uniformMatrix3x4fv) {
  CTX();
  return exglUniformMatrixv(
      ctx,
      glUniformMatrix3x4fv,
      ARG(0, EXWebGLClass),
      ARG(1, GLboolean),
      12,
      ARG(2, std::vector<float>));
}

SIMPLE_NATIVE_METHOD(vertexAttribI4i, glVertexAttribI4i); // index, x, y, z, w
SIMPLE_NATIVE_METHOD(vertexAttribI4ui, glVertexAttribI4ui); // index, x, y, z, w

NATIVE_METHOD(vertexAttribI4iv) {
  CTX();
  return exglVertexAttribv(ctx, glVertexAttribI4iv, ARG(0, GLuint), ARG(1, std::vector<int32_t>));
}

NATIVE_METHOD(vertexAttribI4uiv) {
  CTX();
  return exglVertexAttribv(ctx, glVertexAttribI4uiv, ARG(0, GLuint), ARG(1, std::vector<uint32_t>));
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
  CTX();
  auto data = jsArrayToVector<GLenum>(runtime, ARG(0, jsi::Array));
  ctx->addToNextBatch(
      [data{std::move(data)}] { glDrawBuffers(static_cast<GLsizei>(data.size()), data.data()); });
  return nullptr;
}

NATIVE_METHOD(clearBufferfv) {
  CTX();
  auto buffer = ARG(0, GLenum);
  auto drawbuffer = ARG(1, GLint);
  auto values = ARG(2, TypedArrayKind::Float32Array).toVector(runtime);
  ctx->addToNextBatch(
      [=, values{std::move(values)}] { glClearBufferfv(buffer, drawbuffer, values.data()); });
  return nullptr;
}

NATIVE_METHOD(clearBufferiv) {
  CTX();
  auto buffer = ARG(0, GLenum);
  auto drawbuffer = ARG(1, GLint);
  auto values = ARG(2, TypedArrayKind::Int32Array).toVector(runtime);
  ctx->addToNextBatch(
      [=, values{std::move(values)}] { glClearBufferiv(buffer, drawbuffer, values.data()); });
  return nullptr;
}

NATIVE_METHOD(clearBufferuiv) {
  CTX();
  auto buffer = ARG(0, GLenum);
  auto drawbuffer = ARG(1, GLint);
  auto values = ARG(2, TypedArrayKind::Uint32Array).toVector(runtime);
  ctx->addToNextBatch(
      [=, values{std::move(values)}] { glClearBufferuiv(buffer, drawbuffer, values.data()); });
  return nullptr;
}

SIMPLE_NATIVE_METHOD(clearBufferfi, glClearBufferfi); // buffer, drawbuffer, depth, stencil

// Query objects (WebGL2)
// ----------------------

NATIVE_METHOD(createQuery) {
  CTX();
  return exglGenObject(ctx, runtime, glGenQueries, EXWebGLClass::WebGLQuery);
}

NATIVE_METHOD(deleteQuery) {
  CTX();
  return exglDeleteObject(ctx, ARG(0, EXWebGLClass), glDeleteQueries);
}

NATIVE_METHOD(isQuery) {
  CTX();
  return exglIsObject(ctx, ARG(0, EXWebGLClass), glIsQuery);
}

NATIVE_METHOD(beginQuery) {
  CTX();
  auto target = ARG(0, GLenum);
  auto query = ARG(1, EXWebGLClass);
  ctx->addToNextBatch([=] { glBeginQuery(target, ctx->lookupObject(query)); });
  return nullptr;
}

SIMPLE_NATIVE_METHOD(endQuery, glEndQuery); // target

NATIVE_METHOD(getQuery) {
  CTX();
  auto target = ARG(0, GLenum);
  auto pname = ARG(1, GLenum);
  GLint params;
  ctx->addBlockingToNextBatch([&] { glGetQueryiv(target, pname, &params); });
  return params == 0
      ? jsi::Value::null()
      : createWebGLObject(runtime, EXWebGLClass::WebGLQuery, {static_cast<double>(params)});
}

NATIVE_METHOD(getQueryParameter) {
  CTX();
  auto query = ARG(0, EXWebGLClass);
  auto pname = ARG(1, GLenum);
  GLuint params;
  ctx->addBlockingToNextBatch(
      [&] { glGetQueryObjectuiv(ctx->lookupObject(query), pname, &params); });
  return params == 0 ? jsi::Value::null() : static_cast<double>(params);
}

// Samplers (WebGL2)
// -----------------

NATIVE_METHOD(createSampler) {
  CTX();
  return exglGenObject(ctx, runtime, glGenSamplers, EXWebGLClass::WebGLSampler);
}

NATIVE_METHOD(deleteSampler) {
  CTX();
  return exglDeleteObject(ctx, ARG(0, EXWebGLClass), glDeleteSamplers);
}

NATIVE_METHOD(bindSampler) {
  CTX();
  auto unit = ARG(0, GLuint);
  auto sampler = ARG(1, EXWebGLClass);
  ctx->addToNextBatch([=] { glBindSampler(unit, ctx->lookupObject(sampler)); });
  return nullptr;
}

NATIVE_METHOD(isSampler) {
  CTX();
  return exglIsObject(ctx, ARG(0, EXWebGLClass), glIsSampler);
}

NATIVE_METHOD(samplerParameteri) {
  CTX();
  auto sampler = ARG(0, EXWebGLClass);
  auto pname = ARG(1, GLenum);
  auto param = ARG(2, GLfloat);
  ctx->addToNextBatch([=] { glSamplerParameteri(ctx->lookupObject(sampler), pname, param); });
  return nullptr;
}

NATIVE_METHOD(samplerParameterf) {
  CTX();
  auto sampler = ARG(0, EXWebGLClass);
  auto pname = ARG(1, GLenum);
  auto param = ARG(2, GLfloat);
  ctx->addToNextBatch([=] { glSamplerParameterf(ctx->lookupObject(sampler), pname, param); });
  return nullptr;
}

NATIVE_METHOD(getSamplerParameter) {
  CTX();
  auto sampler = ARG(0, EXWebGLClass);
  auto pname = ARG(1, GLenum);
  bool isFloatParam = pname == GL_TEXTURE_MAX_LOD || pname == GL_TEXTURE_MIN_LOD;
  union {
    GLfloat f;
    GLint i;
  } param;

  ctx->addBlockingToNextBatch([&] {
    if (isFloatParam) {
      glGetSamplerParameterfv(ctx->lookupObject(sampler), pname, &param.f);
    } else {
      glGetSamplerParameteriv(ctx->lookupObject(sampler), pname, &param.i);
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
  CTX();
  return exglGenObject(ctx, runtime, glGenTransformFeedbacks, EXWebGLClass::WebGLTransformFeedback);
}

NATIVE_METHOD(deleteTransformFeedback) {
  CTX();
  return exglDeleteObject(ctx, ARG(0, EXWebGLClass), glDeleteTransformFeedbacks);
}

NATIVE_METHOD(isTransformFeedback) {
  CTX();
  return exglIsObject(ctx, ARG(0, EXWebGLClass), glIsTransformFeedback);
}

NATIVE_METHOD(bindTransformFeedback) {
  CTX();
  auto target = ARG(0, GLenum);
  auto transformFeedback = ARG(1, EXWebGLClass);
  ctx->addToNextBatch(
      [=] { glBindTransformFeedback(target, ctx->lookupObject(transformFeedback)); });
  return nullptr;
}

SIMPLE_NATIVE_METHOD(beginTransformFeedback, glBeginTransformFeedback); // primitiveMode

SIMPLE_NATIVE_METHOD(endTransformFeedback, glEndTransformFeedback);

NATIVE_METHOD(transformFeedbackVaryings) {
  CTX();
  auto program = ARG(0, EXWebGLClass);
  std::vector<std::string> varyings = jsArrayToVector<std::string>(runtime, ARG(1, jsi::Array));
  auto bufferMode = ARG(2, GLenum);

  ctx->addToNextBatch([=, varyings{std::move(varyings)}] {
    std::vector<const char *> varyingsRaw(varyings.size());
    std::transform(
        varyings.begin(), varyings.end(), varyingsRaw.begin(), [](const std::string &str) {
          return str.c_str();
        });

    glTransformFeedbackVaryings(
        ctx->lookupObject(program),
        static_cast<GLsizei>(varyingsRaw.size()),
        varyingsRaw.data(),
        bufferMode);
  });
  return nullptr;
}

NATIVE_METHOD(getTransformFeedbackVarying) {
  CTX();
  return exglGetActiveInfo(
      ctx,
      runtime,
      ARG(0, EXWebGLClass),
      ARG(1, GLuint),
      GL_TRANSFORM_FEEDBACK_VARYING_MAX_LENGTH,
      glGetTransformFeedbackVarying);
}

SIMPLE_NATIVE_METHOD(pauseTransformFeedback, glPauseTransformFeedback);

SIMPLE_NATIVE_METHOD(resumeTransformFeedback, glResumeTransformFeedback);

// Uniform buffer objects (WebGL2)
// -------------------------------

NATIVE_METHOD(bindBufferBase) {
  CTX();
  auto target = ARG(0, GLenum);
  auto index = ARG(1, GLuint);
  auto buffer = ARG(2, EXWebGLClass);
  ctx->addToNextBatch([=] { glBindBufferBase(target, index, ctx->lookupObject(buffer)); });
  return nullptr;
}

NATIVE_METHOD(bindBufferRange) {
  CTX();
  auto target = ARG(0, GLenum);
  auto index = ARG(1, GLuint);
  auto buffer = ARG(2, EXWebGLClass);
  auto offset = ARG(3, GLint);
  auto size = ARG(4, GLsizei);
  ctx->addToNextBatch(
      [=] { glBindBufferRange(target, index, ctx->lookupObject(buffer), offset, size); });
  return nullptr;
}

NATIVE_METHOD(getUniformIndices) {
  CTX();
  auto program = ARG(0, EXWebGLClass);
  std::vector<std::string> uniformNames = jsArrayToVector<std::string>(runtime, ARG(1, jsi::Array));

  std::vector<const char *> uniformNamesRaw(uniformNames.size());
  std::transform(
      uniformNames.begin(),
      uniformNames.end(),
      uniformNamesRaw.begin(),
      [](const std::string &str) { return str.c_str(); });

  std::vector<GLuint> indices(uniformNames.size());
  ctx->addBlockingToNextBatch([&] {
    glGetUniformIndices(
        ctx->lookupObject(program),
        static_cast<GLsizei>(uniformNames.size()),
        uniformNamesRaw.data(),
        &indices[0]);
  });
  jsi::Array jsResult(runtime, indices.size());
  for (unsigned int i = 0; i < indices.size(); i++) {
    jsResult.setValueAtIndex(runtime, i, static_cast<double>(indices[i]));
  }
  return jsResult;
}

NATIVE_METHOD(getActiveUniforms) {
  CTX();
  auto program = ARG(0, EXWebGLClass);
  auto uniformIndices = jsArrayToVector<GLuint>(runtime, ARG(1, jsi::Array));
  auto pname = ARG(2, GLenum);
  std::vector<GLint> params(uniformIndices.size());

  ctx->addBlockingToNextBatch([&] {
    glGetActiveUniformsiv(
        ctx->lookupObject(program),
        static_cast<GLsizei>(uniformIndices.size()),
        uniformIndices.data(),
        pname,
        &params[0]);
  });
  jsi::Array jsResult(runtime, params.size());
  for (unsigned int i = 0; i < params.size(); i++) {
    jsResult.setValueAtIndex(
        runtime,
        i,
        pname == GL_UNIFORM_IS_ROW_MAJOR ? params[i] != 0 : static_cast<double>(params[i]));
  }
  return jsResult;
}

NATIVE_METHOD(getUniformBlockIndex) {
  CTX();
  auto program = ARG(0, EXWebGLClass);
  auto uniformBlockName = ARG(1, std::string);

  GLuint blockIndex;
  ctx->addBlockingToNextBatch([&] {
    blockIndex = glGetUniformBlockIndex(ctx->lookupObject(program), uniformBlockName.c_str());
  });
  return static_cast<double>(blockIndex);
}

UNIMPL_NATIVE_METHOD(getActiveUniformBlockParameter)

NATIVE_METHOD(getActiveUniformBlockName) {
  CTX();
  auto fProgram = ARG(0, EXWebGLClass);
  auto uniformBlockIndex = ARG(1, GLuint);

  std::string blockName;
  ctx->addBlockingToNextBatch([&] {
    GLuint program = ctx->lookupObject(fProgram);
    GLint bufSize;
    glGetActiveUniformBlockiv(program, uniformBlockIndex, GL_UNIFORM_BLOCK_NAME_LENGTH, &bufSize);
    blockName.resize(bufSize > 0 ? bufSize - 1 : 0);
    glGetActiveUniformBlockName(program, uniformBlockIndex, bufSize, NULL, &blockName[0]);
  });
  return jsi::String::createFromUtf8(runtime, blockName);
}

NATIVE_METHOD(uniformBlockBinding) {
  CTX();
  auto program = ARG(0, EXWebGLClass);
  auto uniformBlockIndex = ARG(1, GLuint);
  auto uniformBlockBinding = ARG(2, GLuint);
  ctx->addToNextBatch([=] {
    glUniformBlockBinding(ctx->lookupObject(program), uniformBlockIndex, uniformBlockBinding);
  });
  return nullptr;
}

// Vertex Array Object (WebGL2)
// ----------------------------

NATIVE_METHOD(createVertexArray) {
  CTX();
  return exglGenObject(ctx, runtime, glGenVertexArrays, EXWebGLClass::WebGLVertexArrayObject);
}

NATIVE_METHOD(deleteVertexArray) {
  CTX();
  return exglDeleteObject(ctx, ARG(0, EXWebGLClass), glDeleteVertexArrays);
}

NATIVE_METHOD(isVertexArray) {
  CTX();
  return exglIsObject(ctx, ARG(0, EXWebGLClass), glIsVertexArray);
}

NATIVE_METHOD(bindVertexArray) {
  CTX();
  auto vertexArray = ARG(0, EXWebGLClass);
  ctx->addToNextBatch([=] { glBindVertexArray(ctx->lookupObject(vertexArray)); });
  return nullptr;
}

// Extensions
// ----------

// It may return some extensions that are not specified by WebGL specification nor drafts.
NATIVE_METHOD(getSupportedExtensions) {
  CTX();
  // Set with supported extensions is cached to make checks in `getExtension` faster.
  ctx->maybeReadAndCacheSupportedExtensions();

  jsi::Array extensions(runtime, ctx->supportedExtensions.size());
  int i = 0;
  for (auto const &extensionName : ctx->supportedExtensions) {
    extensions.setValueAtIndex(runtime, i++, jsi::String::createFromUtf8(runtime, extensionName));
  }
  return extensions;
}

#define GL_TEXTURE_MAX_ANISOTROPY_EXT 0x84FE
#define GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT 0x84FF

NATIVE_METHOD(getExtension) {
  CTX();
  auto name = ARG(0, std::string);

  // There is no `getExtension` equivalent in OpenGL ES so return `null`
  // if requested extension is not returned by `getSupportedExtensions`.
  ctx->maybeReadAndCacheSupportedExtensions();
  if (ctx->supportedExtensions.find(name) == ctx->supportedExtensions.end()) {
    return nullptr;
  }

  if (name == "EXT_texture_filter_anisotropic") {
    jsi::Object result(runtime);
    result.setProperty(
        runtime, "TEXTURE_MAX_ANISOTROPY_EXT", jsi::Value(GL_TEXTURE_MAX_ANISOTROPY_EXT));
    result.setProperty(
        runtime, "MAX_TEXTURE_MAX_ANISOTROPY_EXT", jsi::Value(GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT));
    return result;
  }
  return jsi::Object(runtime);
}

// Exponent extensions
// -------------------

NATIVE_METHOD(endFrameEXP) {
  CTX();
  ctx->addToNextBatch([=] { ctx->needsRedraw = true; });
  ctx->endNextBatch();
  ctx->flushOnGLThread();
  return nullptr;
}

NATIVE_METHOD(flushEXP) {
  CTX();
  // nothing, it's just a helper so that we can measure how much time some operations take
  ctx->addBlockingToNextBatch([&] {});
  return nullptr;
}

} // namespace method
} // namespace gl_cpp
} // namespace expo
