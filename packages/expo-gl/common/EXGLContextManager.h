#pragma once

#include "pch.h"

#include <shared_mutex>

#include "EXGLNativeApi.h"

namespace expo {
namespace gl_cpp {

class EXGLContext;

using ContextWithLock = std::pair<EXGLContext *, std::shared_lock<std::shared_mutex>>;

EXGLContextId ContextCreate();

ContextWithLock ContextGet(EXGLContextId id);

void ContextDestroy(EXGLContextId id);

} // namespace gl_cpp
} // namespace expo
