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

#include <mutex>
#include <unordered_set>

#include <folly/memory/SanitizeLeak.h>

namespace folly {
namespace detail {
namespace {
struct LeakedPtrs {
  std::mutex mutex;
  std::unordered_set<void const*> set;

  static LeakedPtrs& instance() {
    static auto* ptrs = new LeakedPtrs();
    return *ptrs;
  }
};
} // namespace

void annotate_object_leaked_impl(void const* ptr) {
  if (ptr == nullptr) {
    return;
  }
  auto& ptrs = LeakedPtrs::instance();
  std::lock_guard<std::mutex> lg(ptrs.mutex);
  ptrs.set.insert(ptr);
}

void annotate_object_collected_impl(void const* ptr) {
  if (ptr == nullptr) {
    return;
  }
  auto& ptrs = LeakedPtrs::instance();
  std::lock_guard<std::mutex> lg(ptrs.mutex);
  ptrs.set.erase(ptr);
}

} // namespace detail
} // namespace folly
