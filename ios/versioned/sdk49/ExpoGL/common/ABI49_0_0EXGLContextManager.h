#pragma once

#include <shared_mutex>
#include "ABI49_0_0EXGLNativeContext.h"

namespace ABI49_0_0expo {
namespace gl_cpp {

using ContextWithLock = std::pair<ABI49_0_0EXGLContext *, std::shared_lock<std::shared_mutex>>;

ABI49_0_0EXGLContextId ContextCreate();
ContextWithLock ContextGet(ABI49_0_0EXGLContextId id);
void ContextDestroy(ABI49_0_0EXGLContextId id);

} // namespace gl_cpp
} // namespace ABI49_0_0expo
