#pragma once

#include <shared_mutex>
#include "ABI46_0_0EXGLContext.h"

namespace ABI46_0_0expo {
namespace gl_cpp {

using ContextWithLock = std::pair<ABI46_0_0EXGLContext *, std::shared_lock<std::shared_mutex>>;

ABI46_0_0EXGLContextId ContextCreate();
ContextWithLock ContextGet(ABI46_0_0EXGLContextId id);
void ContextDestroy(ABI46_0_0EXGLContextId id);

} // namespace gl_cpp
} // namespace ABI46_0_0expo
