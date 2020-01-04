#pragma once

#ifdef __ANDROID__
#include <GLES3/gl3.h>
#include <GLES3/gl3ext.h>
#endif
#ifdef __APPLE__
#include <OpenGLES/EAGL.h>
#include <OpenGLES/ES3/gl.h>
#include <OpenGLES/ES3/glext.h>
#endif

#include <jsi/jsi.h>

template <typename Func>
inline jsi::Value EXGLContext::exglGetActiveInfo(
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

  addBlockingToNextBatch([&] {
    GLuint program = lookupObject(fProgram);
    glGetProgramiv(program, lengthParam, &maxNameLength);
    name.resize(maxNameLength);

    glFunc(program, index, maxNameLength, &length, &size, &type, &name[0]);
    name.resize(length);
  });

  if (name.size() == 0) { // name.length() may be larger
    return nullptr;
  }

  jsi::Object jsResult(runtime);
  jsResult.setProperty(runtime, "name", jsi::String::createFromUtf8(runtime, name));
  jsResult.setProperty(runtime, "size", size);
  jsResult.setProperty(runtime, "type", static_cast<double>(type));
  return jsResult;
}

template <typename Func, typename... T>
inline jsi::Value EXGLContext::exglCall(Func func, T &&... args) {
  addToNextBatch([=, args = std::make_tuple(std::forward<T>(args)...)] {
    return std::apply(func, std::move(args));
  });
}

template <typename Func, typename T>
inline jsi::Value
EXGLContext::exglUniformv(Func func, GLuint uniform, size_t dim, std::vector<T> &&data) {
  addToNextBatch([=, data{std::move(data)}] { func(uniform, data.size() / dim, data.data()); });
  return nullptr;
}

template <typename Func, typename T>
inline jsi::Value EXGLContext::exglUniformMatrixv(
    Func func,
    GLuint uniform,
    GLboolean transpose,
    size_t dim,
    std::vector<T> &&data) {
  addToNextBatch(
      [=, data{std::move(data)}] { func(uniform, data.size() / dim, transpose, data.data()); });
  return nullptr;
}

template <typename Func, typename T>
inline jsi::Value EXGLContext::exglVertexAttribv(Func func, GLuint index, std::vector<T> &&data) {
  addToNextBatch([=, data{std::move(data)}] { func(index, data.data()); });
  return nullptr;
}
