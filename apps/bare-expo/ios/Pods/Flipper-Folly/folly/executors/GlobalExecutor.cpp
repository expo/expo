/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <memory>
#include <thread>

#include <folly/Function.h>
#include <folly/SharedMutex.h>
#include <folly/Singleton.h>
#include <folly/detail/AsyncTrace.h>
#include <folly/executors/CPUThreadPoolExecutor.h>
#include <folly/executors/GlobalExecutor.h>
#include <folly/executors/IOExecutor.h>
#include <folly/executors/IOThreadPoolExecutor.h>
#include <folly/system/HardwareConcurrency.h>

using namespace folly;

namespace {

class GlobalTag {};

// aka InlineExecutor
class DefaultCPUExecutor : public Executor {
 public:
  FOLLY_NOINLINE void add(Func f) override {
    f();
  }
};

Singleton<std::shared_ptr<DefaultCPUExecutor>> gDefaultGlobalCPUExecutor([] {
  return new std::shared_ptr<DefaultCPUExecutor>(new DefaultCPUExecutor{});
});

Singleton<std::shared_ptr<CPUThreadPoolExecutor>, GlobalTag>
    gImmutableGlobalCPUExecutor([] {
      return new std::shared_ptr<CPUThreadPoolExecutor>(
          new CPUThreadPoolExecutor(
              folly::hardware_concurrency(),
              std::make_shared<NamedThreadFactory>("GlobalCPUThreadPool")));
    });

Singleton<std::shared_ptr<IOThreadPoolExecutor>, GlobalTag>
    gImmutableGlobalIOExecutor([] {
      return new std::shared_ptr<IOThreadPoolExecutor>(new IOThreadPoolExecutor(
          folly::hardware_concurrency(),
          std::make_shared<NamedThreadFactory>("GlobalIOThreadPool")));
    });

template <class ExecutorBase>
std::shared_ptr<ExecutorBase> getImmutable();

template <>
std::shared_ptr<Executor> getImmutable() {
  if (auto executorPtrPtr = gImmutableGlobalCPUExecutor.try_get()) {
    return *executorPtrPtr;
  }
  return nullptr;
}

template <>
std::shared_ptr<IOExecutor> getImmutable() {
  if (auto executorPtrPtr = gImmutableGlobalIOExecutor.try_get()) {
    return *executorPtrPtr;
  }
  return nullptr;
}

template <class ExecutorBase>
class GlobalExecutor {
 public:
  explicit GlobalExecutor(
      Function<std::shared_ptr<ExecutorBase>()> constructDefault)
      : getDefault_(std::move(constructDefault)) {}

  std::shared_ptr<ExecutorBase> get() {
    SharedMutex::ReadHolder guard(mutex_);
    if (auto executor = executor_.lock()) {
      return executor; // Fast path.
    }

    return getDefault_();
  }

  void set(std::weak_ptr<ExecutorBase> executor) {
    SharedMutex::WriteHolder guard(mutex_);
    executor_.swap(executor);
  }

  // Replace the constructDefault function to use the immutable singleton
  // rather than the default singleton
  void setFromImmutable() {
    SharedMutex::WriteHolder guard(mutex_);

    getDefault_ = [] { return getImmutable<ExecutorBase>(); };
    executor_ = std::weak_ptr<ExecutorBase>{};
  }

 private:
  SharedMutex mutex_;
  std::weak_ptr<ExecutorBase> executor_;
  Function<std::shared_ptr<ExecutorBase>()> getDefault_;
};

LeakySingleton<GlobalExecutor<Executor>> gGlobalCPUExecutor([] {
  return new GlobalExecutor<Executor>(
      // Default global CPU executor is an InlineExecutor.
      [] {
        if (auto executorPtrPtr = gDefaultGlobalCPUExecutor.try_get()) {
          return *executorPtrPtr;
        }
        return std::shared_ptr<DefaultCPUExecutor>{};
      });
});

LeakySingleton<GlobalExecutor<IOExecutor>> gGlobalIOExecutor([] {
  return new GlobalExecutor<IOExecutor>(
      // Default global IO executor is an IOThreadPoolExecutor.
      [] { return getImmutable<IOExecutor>(); });
});

} // namespace

namespace folly {

Executor::KeepAlive<> getGlobalCPUExecutor() {
  auto executorPtr = getImmutable<Executor>();
  if (!executorPtr) {
    throw std::runtime_error("Requested global CPU executor during shutdown.");
  }
  async_tracing::logGetImmutableCPUExecutor(executorPtr.get());
  return folly::getKeepAliveToken(executorPtr.get());
}

Executor::KeepAlive<> getGlobalIOExecutor() {
  auto executorPtr = getImmutable<IOExecutor>();
  if (!executorPtr) {
    throw std::runtime_error("Requested global IO executor during shutdown.");
  }
  async_tracing::logGetImmutableIOExecutor(executorPtr.get());
  return folly::getKeepAliveToken(executorPtr.get());
}

std::shared_ptr<Executor> getCPUExecutor() {
  auto& singleton = gGlobalCPUExecutor.get();
  auto executor = singleton.get();
  async_tracing::logGetGlobalCPUExecutor(executor.get());
  return executor;
}

void setCPUExecutorToGlobalCPUExecutor() {
  async_tracing::logSetGlobalCPUExecutorToImmutable();
  gGlobalCPUExecutor.get().setFromImmutable();
}

void setCPUExecutor(std::weak_ptr<Executor> executor) {
  async_tracing::logSetGlobalCPUExecutor(executor.lock().get());
  gGlobalCPUExecutor.get().set(std::move(executor));
}

std::shared_ptr<IOExecutor> getIOExecutor() {
  auto& singleton = gGlobalIOExecutor.get();
  auto executor = singleton.get();
  async_tracing::logGetGlobalIOExecutor(executor.get());
  return executor;
}

void setIOExecutor(std::weak_ptr<IOExecutor> executor) {
  async_tracing::logSetGlobalIOExecutor(executor.lock().get());
  gGlobalIOExecutor.get().set(std::move(executor));
}

EventBase* getEventBase() {
  auto executor = getIOExecutor();
  if (FOLLY_LIKELY(!!executor)) {
    return executor->getEventBase();
  }

  return nullptr;
}

} // namespace folly
