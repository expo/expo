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

#include <chrono>

#include <folly/Optional.h>

namespace folly {
class Executor;
class IOExecutor;
namespace async_tracing {
void logSetGlobalCPUExecutor(Executor*) noexcept;
void logSetGlobalCPUExecutorToImmutable() noexcept;
void logGetGlobalCPUExecutor(Executor*) noexcept;
void logGetImmutableCPUExecutor(Executor*) noexcept;
void logSetGlobalIOExecutor(IOExecutor*) noexcept;
void logGetGlobalIOExecutor(IOExecutor*) noexcept;
void logGetImmutableIOExecutor(IOExecutor*) noexcept;
void logSemiFutureVia(Executor*, Executor*) noexcept;
void logFutureVia(Executor*, Executor*) noexcept;
void logBlockingOperation(std::chrono::milliseconds) noexcept;
} // namespace async_tracing
} // namespace folly
