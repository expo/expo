#pragma once

#include <shared_mutex>
#include "EXGLContext.h"

namespace expo {
namespace gl_cpp {

using EXGLContextWithLock = std::pair<EXGLContext *, std::shared_lock<std::shared_mutex>>;

UEXGLContextId EXGLContextCreate();
EXGLContextWithLock EXGLContextGet(UEXGLContextId id);
void EXGLContextDestroy(UEXGLContextId id);

} // namespace gl_cpp
} // namespace expo
