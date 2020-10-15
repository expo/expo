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

namespace folly {

// `SoftRealTimeExecutor` is an executor that performs some priority-based
// scheduling with a deadline assigned to each task. __Soft__ real-time
// means that not every deadline is guaranteed to be met.
class SoftRealTimeExecutor : public virtual Executor {
  void add(Func) override = 0;

  // Add a task with an assigned abstract deadline.
  //
  // NOTE: The type of `deadline` was chosen to be an integral rather than
  // a typed time point or duration (e.g., `std::chrono::time_point`) to allow
  // for flexbility. While the deadline for a task may be a time point,
  // it could also be a duration or the size of the task, which emulates
  // rate-monotonic scheduling that prioritizes small tasks. It also enables
  // for exmaple, tiered scheduling (strictly prioritizing a category of tasks)
  // by assigning the high-bit of the deadline.
  virtual void add(Func, uint64_t deadline) = 0;
};

} // namespace folly
