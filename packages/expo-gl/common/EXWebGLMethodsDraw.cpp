#include "EXWebGLMethods.h"
#include "EXWebGLMethodsMacros.h"

namespace expo {
namespace gl_cpp {
namespace method {

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
  for (auto const &extensionName: ctx->supportedExtensions) {
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
