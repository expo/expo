#pragma once

#include <shared_mutex>
#include "ABI47_0_0EXGLNativeContext.h"

namespace ABI47_0_0expo {
namespace gl_cpp {

using ContextWithLock = std::pair<ABI47_0_0EXGLContext *, std::shared_lock<std::shared_mutex>>;

ABI47_0_0EXGLContextId ContextCreate();
ContextWithLock ContextGet(ABI47_0_0EXGLContextId id);
void ContextDestroy(ABI47_0_0EXGLContextId id);

} // namespace gl_cpp
} // namespace ABI47_0_0expo
