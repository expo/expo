/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef __ANDROID__
#include "ABI48_0_0Thread.h"

#include <fbjni/JThread.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0hermes {
namespace inspector {
namespace detail {

struct Thread::Impl {
  ABI48_0_0facebook::jni::global_ref<ABI48_0_0facebook::jni::JThread> thread_;
};

Thread::Thread(std::string, std::function<void()> runnable)
    : impl_(std::make_unique<Impl>(Impl{ABI48_0_0facebook::jni::make_global(
          ABI48_0_0facebook::jni::JThread::create(std::move(runnable)))})) {
  impl_->thread_->start();
}

Thread::~Thread() {}

void Thread::join() {
  impl_->thread_->join();
}

} // namespace detail
} // namespace inspector
} // namespace ABI48_0_0hermes
} // namespace ABI48_0_0facebook

#endif
