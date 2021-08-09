#pragma once
// it should be included only in EXWebGLMethods.cpp

#include "EXGLContext.h"
#include "EXWebGLRenderer.h"

#ifdef __ANDROID__
#include <GLES3/gl3.h>
#include <GLES3/gl3ext.h>
#endif
#ifdef __APPLE__
#include <OpenGLES/EAGL.h>
#include <OpenGLES/ES3/gl.h>
#include <OpenGLES/ES3/glext.h>
#endif

namespace expo {
namespace gl_cpp {

template <typename Func>
inline jsi::Value exglGetActiveInfo(
    EXGLContext *ctx,
    jsi::Runtime &runtime,
    UEXGLObjectId fProgram,
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
      createWebGLObject(runtime, EXWebGLClass::WebGLActiveInfo, {}).asObject(runtime);
  jsResult.setProperty(runtime, "name", jsi::String::createFromUtf8(runtime, name));
  jsResult.setProperty(runtime, "size", size);
  jsResult.setProperty(runtime, "type", static_cast<double>(type));
  return jsResult;
}

template <typename Func, typename... T>
inline jsi::Value exglCall(EXGLContext *ctx, Func func, T &&... args) {
  ctx->addToNextBatch([=, args = std::make_tuple(std::forward<T>(args)...)] {
    return std::apply(func, std::move(args));
  });
}

template <typename Func, typename T>
inline jsi::Value
exglUniformv(EXGLContext *ctx, Func func, GLuint uniform, size_t dim, std::vector<T> &&data) {
  ctx->addToNextBatch([=, data{std::move(data)}] {
    func(uniform, static_cast<int>(data.size() / dim), data.data());
  });
  return nullptr;
}

template <typename Func, typename T>
inline jsi::Value exglUniformMatrixv(
    EXGLContext *ctx,
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
exglVertexAttribv(EXGLContext *ctx, Func func, GLuint index, std::vector<T> &&data) {
  ctx->addToNextBatch([=, data{std::move(data)}] { func(index, data.data()); });
  return nullptr;
}

inline jsi::Value
exglIsObject(EXGLContext *ctx, UEXGLObjectId id, std::function<GLboolean(GLuint)> func) {
  GLboolean glResult;
  ctx->addBlockingToNextBatch([&] { glResult = func(ctx->lookupObject(id)); });
  return glResult == GL_TRUE;
}

inline jsi::Value exglGenObject(
    EXGLContext *ctx,
    jsi::Runtime &runtime,
    std::function<void(GLsizei, UEXGLObjectId *)> func,
    EXWebGLClass webglClass) {
  auto id = ctx->addFutureToNextBatch(runtime, [=] {
    GLuint buffer;
    func(1, &buffer);
    return buffer;
  });
  return createWebGLObject(runtime, webglClass, {std::move(id)});
}

inline jsi::Value exglCreateObject(
    EXGLContext *ctx,
    jsi::Runtime &runtime,
    std::function<GLuint()> func,
    EXWebGLClass webglClass) {
  auto id = ctx->addFutureToNextBatch(runtime, [=] { return func(); });
  return createWebGLObject(runtime, webglClass, {std::move(id)});
}

inline jsi::Value
exglDeleteObject(EXGLContext *ctx, UEXGLObjectId id, std::function<void(UEXGLObjectId)> func) {
  ctx->addToNextBatch([=] { func(ctx->lookupObject(id)); });
  return nullptr;
}

inline jsi::Value exglDeleteObject(
    EXGLContext *ctx,
    UEXGLObjectId id,
    std::function<void(GLsizei, const UEXGLObjectId *)> func) {
  ctx->addToNextBatch([=] {
    GLuint buffer = ctx->lookupObject(id);
    func(1, &buffer);
  });
  return nullptr;
}

inline jsi::Value exglUnimplemented(std::string name) {
  throw std::runtime_error("EXGL: " + name + "() isn't implemented yet!");
}

} // namespace gl_cpp
} // namespace expo
