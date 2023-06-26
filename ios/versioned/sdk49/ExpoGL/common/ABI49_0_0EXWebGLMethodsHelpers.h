#pragma once
// it should be included only in ABI49_0_0EXWebGLMethods.cpp

#include "ABI49_0_0EXGLNativeContext.h"
#include "ABI49_0_0EXWebGLRenderer.h"

#ifdef __ANDROID__
#include <GLES3/gl3.h>
#include <GLES3/gl3ext.h>
#endif
#ifdef __APPLE__
#include <OpenGLES/EAGL.h>
#include <OpenGLES/ES3/gl.h>
#include <OpenGLES/ES3/glext.h>
#endif

namespace ABI49_0_0expo {
namespace gl_cpp {

template <typename Func>
inline jsi::Value exglGetActiveInfo(
    ABI49_0_0EXGLContext *ctx,
    jsi::Runtime &runtime,
    ABI49_0_0EXGLObjectId fProgram,
    GLuint index,
    GLenum lengthParam,
    Func glFunc) {
  if (fProgram == 0) {
    return nullptr;
  }

  GLsizei length;
  GLint size;
  GLenum type;
  std::string name;
  GLint maxNameLength;

  ctx->addBlockingToNextBatch([&] {
    GLuint program = ctx->lookupObject(fProgram);
    glGetProgramiv(program, lengthParam, &maxNameLength);
    name.resize(maxNameLength);

    glFunc(program, index, maxNameLength, &length, &size, &type, &name[0]);
    name.resize(length);
  });

  if (name.size() == 0) { // name.length() may be larger
    return nullptr;
  }

  jsi::Object jsResult =
      createWebGLObject(runtime, ABI49_0_0EXWebGLClass::WebGLActiveInfo, {}).asObject(runtime);
  jsResult.setProperty(runtime, "name", jsi::String::createFromUtf8(runtime, name));
  jsResult.setProperty(runtime, "size", size);
  jsResult.setProperty(runtime, "type", static_cast<double>(type));
  return jsResult;
}

template <typename Func, typename... T>
inline jsi::Value exglCall(ABI49_0_0EXGLContext *ctx, Func func, T &&... args) {
  ctx->addToNextBatch([=, args = std::make_tuple(std::forward<T>(args)...)] {
    return std::apply(func, std::move(args));
  });
}

template <typename Func, typename T>
inline jsi::Value
exglUniformv(ABI49_0_0EXGLContext *ctx, Func func, GLuint uniform, size_t dim, std::vector<T> &&data) {
  ctx->addToNextBatch([=, data{std::move(data)}] {
    func(uniform, static_cast<int>(data.size() / dim), data.data());
  });
  return nullptr;
}

template <typename Func, typename T>
inline jsi::Value exglUniformMatrixv(
    ABI49_0_0EXGLContext *ctx,
    Func func,
    GLuint uniform,
    GLboolean transpose,
    size_t dim,
    std::vector<T> &&data) {
  ctx->addToNextBatch([=, data{std::move(data)}] {
    func(uniform, static_cast<int>(data.size() / dim), transpose, data.data());
  });
  return nullptr;
}

template <typename Func, typename T>
inline jsi::Value
exglVertexAttribv(ABI49_0_0EXGLContext *ctx, Func func, GLuint index, std::vector<T> &&data) {
  ctx->addToNextBatch([=, data{std::move(data)}] { func(index, data.data()); });
  return nullptr;
}

inline jsi::Value
exglIsObject(ABI49_0_0EXGLContext *ctx, ABI49_0_0EXGLObjectId id, std::function<GLboolean(GLuint)> func) {
  GLboolean glResult;
  ctx->addBlockingToNextBatch([&] { glResult = func(ctx->lookupObject(id)); });
  return glResult == GL_TRUE;
}

inline jsi::Value exglGenObject(
    ABI49_0_0EXGLContext *ctx,
    jsi::Runtime &runtime,
    std::function<void(GLsizei, ABI49_0_0EXGLObjectId *)> func,
    ABI49_0_0EXWebGLClass webglClass) {
  auto id = ctx->addFutureToNextBatch(runtime, [=] {
    GLuint buffer;
    func(1, &buffer);
    return buffer;
  });
  return createWebGLObject(runtime, webglClass, {std::move(id)});
}

inline jsi::Value exglCreateObject(
    ABI49_0_0EXGLContext *ctx,
    jsi::Runtime &runtime,
    std::function<GLuint()> func,
    ABI49_0_0EXWebGLClass webglClass) {
  auto id = ctx->addFutureToNextBatch(runtime, [=] { return func(); });
  return createWebGLObject(runtime, webglClass, {std::move(id)});
}

inline jsi::Value
exglDeleteObject(ABI49_0_0EXGLContext *ctx, ABI49_0_0EXGLObjectId id, std::function<void(ABI49_0_0EXGLObjectId)> func) {
  ctx->addToNextBatch([=] { func(ctx->lookupObject(id)); });
  return nullptr;
}

inline jsi::Value exglDeleteObject(
    ABI49_0_0EXGLContext *ctx,
    ABI49_0_0EXGLObjectId id,
    std::function<void(GLsizei, const ABI49_0_0EXGLObjectId *)> func) {
  ctx->addToNextBatch([=] {
    GLuint buffer = ctx->lookupObject(id);
    func(1, &buffer);
  });
  return nullptr;
}

inline jsi::Value exglUnimplemented(std::string name) {
  throw std::runtime_error("ABI49_0_0EXGL: " + name + "() isn't implemented yet!");
}

} // namespace gl_cpp
} // namespace ABI49_0_0expo
