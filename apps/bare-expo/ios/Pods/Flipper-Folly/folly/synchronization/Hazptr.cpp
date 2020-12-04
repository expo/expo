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

#include <folly/synchronization/Hazptr.h>

#include <folly/portability/GFlags.h>

#include <atomic>

DEFINE_bool(
    folly_hazptr_use_executor,
    true,
    "Use an executor for hazptr asynchronous reclamation");

namespace folly {

FOLLY_STATIC_CTOR_PRIORITY_MAX hazptr_domain<std::atomic> default_domain;

} // namespace folly
