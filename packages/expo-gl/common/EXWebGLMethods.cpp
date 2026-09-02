#include "EXWebGLMethods.h"
#include "EXWebGLMethodsMacros.h"

namespace expo {
namespace gl_cpp {
namespace method {

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
      for (const auto &pair: ctx->objects) {
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
      for (const auto &pair: ctx->objects) {
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
    case GL_UNPACK_ALIGNMENT: {
      auto param = ARG(1, GLint);
      ctx->addToNextBatch([=] {
        glPixelStorei(GL_UNPACK_ALIGNMENT, param);
      });
      break;
    }
    default:
      jsConsoleLog(runtime, {jsi::String::createFromUtf8(runtime,
                                                         "EXGL: gl.pixelStorei() doesn't support this parameter yet!")});
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

} // namespace method
} // namespace gl_cpp
} // namespace expo
