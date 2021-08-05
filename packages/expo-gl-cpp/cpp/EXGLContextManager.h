#pragma once

#include "EXGLContext.h"

namespace expo {
namespace gl_cpp {

using EXGLContextWithLock = std::pair<EXGLContext *, std::unique_lock<std::mutex>>;

UEXGLContextId EXGLContextCreate(jsi::Runtime &runtime);
EXGLContextWithLock EXGLContextGet(UEXGLContextId id);
void EXGLContextDestroy(UEXGLContextId id);

} // namespace gl_cpp
} // namespace expo
