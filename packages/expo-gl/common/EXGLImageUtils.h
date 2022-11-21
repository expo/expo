#pragma once

#ifdef __ANDROID__
#include <GLES3/gl3.h>
#include <GLES3/gl3ext.h>
#endif
#ifdef __APPLE__
#include <OpenGLES/ES3/gl.h>
#endif

#include <jsi/jsi.h>
#include <vector>

namespace expo {
namespace gl_cpp {

GLuint bytesPerPixel(GLenum type, GLenum format);

void flipPixels(GLubyte *pixels, size_t bytesPerRow, size_t rows);

std::shared_ptr<uint8_t> loadImage(
    facebook::jsi::Runtime &runtime,
    const facebook::jsi::Object &jsPixels,
    int *fileWidth,
    int *fileHeight,
    int *fileComp);
} // namespace gl_cpp
} // namespace expo
