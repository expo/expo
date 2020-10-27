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

#include <folly/executors/SerialExecutor.h>

#include <glog/logging.h>

#include <folly/ExceptionString.h>

namespace folly {

SerialExecutor::SerialExecutor(KeepAlive<Executor> parent)
    : parent_(std::move(parent)) {}

SerialExecutor::~SerialExecutor() {
  DCHECK(!keepAliveCounter_);
}

Executor::KeepAlive<SerialExecutor> SerialExecutor::create(
    KeepAlive<Executor> parent) {
  return makeKeepAlive<SerialExecutor>(new SerialExecutor(std::move(parent)));
}

SerialExecutor::UniquePtr SerialExecutor::createUnique(
    std::shared_ptr<Executor> parent) {
  auto executor = new SerialExecutor(getKeepAliveToken(parent.get()));
  return {executor, Deleter{std::move(parent)}};
}

bool SerialExecutor::keepAliveAcquire() {
  auto keepAliveCounter =
      keepAliveCounter_.fetch_add(1, std::memory_order_relaxed);
  DCHECK(keepAliveCounter > 0);
  return true;
}

void SerialExecutor::keepAliveRelease() {
  auto keepAliveCounter =
      keepAliveCounter_.fetch_sub(1, std::memory_order_acq_rel);
  DCHECK(keepAliveCounter > 0);
  if (keepAliveCounter == 1) {
    delete this;
  }
}

void SerialExecutor::add(Func func) {
  queue_.enqueue(Task{std::move(func), RequestContext::saveContext()});
  parent_->add([keepAlive = getKeepAliveToken(this)] { keepAlive->run(); });
}

void SerialExecutor::addWithPriority(Func func, int8_t priority) {
  queue_.enqueue(Task{std::move(func), RequestContext::saveContext()});
  parent_->addWithPriority(
      [keepAlive = getKeepAliveToken(this)] { keepAlive->run(); }, priority);
}

void SerialExecutor::run() {
  // We want scheduled_ to guard side-effects of completed tasks, so we can't
  // use std::memory_order_relaxed here.
  if (scheduled_.fetch_add(1, std::memory_order_acquire) > 0) {
    return;
  }

  do {
    Task task;
    queue_.dequeue(task);

    try {
      folly::RequestContextScopeGuard ctxGuard(std::move(task.ctx));
      auto func = std::move(task.func);
      func();
    } catch (std::exception const& ex) {
      LOG(ERROR) << "SerialExecutor: func threw unhandled exception "
                 << folly::exceptionStr(ex);
    } catch (...) {
      LOG(ERROR) << "SerialExecutor: func threw unhandled non-exception "
                    "object";
    }

    // We want scheduled_ to guard side-effects of completed tasks, so we can't
    // use std::memory_order_relaxed here.
  } while (scheduled_.fetch_sub(1, std::memory_order_release) > 1);
}

} // namespace folly
