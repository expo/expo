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

#pragma once

#include <folly/Executor.h>
#include <atomic>

namespace folly {
class ExecutorWithPriority {
 public:
  template <typename Callback>
  static Executor::KeepAlive<> createDynamic(
      Executor::KeepAlive<Executor> executor,
      Callback&& callback);

  static Executor::KeepAlive<> create(
      Executor::KeepAlive<Executor> executor,
      int8_t priority);
};
} // namespace folly

#include <folly/executors/ExecutorWithPriority-inl.h>
