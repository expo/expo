#pragma once

#include "pch.h"

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
