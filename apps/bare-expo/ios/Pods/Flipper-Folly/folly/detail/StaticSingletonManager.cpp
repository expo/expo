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

#include <folly/detail/StaticSingletonManager.h>

#include <mutex>
#include <typeindex>
#include <unordered_map>

namespace folly {
namespace detail {

namespace {

class StaticSingletonManagerWithRttiImpl {
 public:
  using Make = void*();
  using Cache = std::atomic<void*>;

  void* create(std::type_info const& key, Make& make, Cache& cache) {
    auto const ptr = entry(key).get(make);
    cache.store(ptr, std::memory_order_release);
    return ptr;
  }

 private:
  struct Entry {
    void* ptr{};
    std::mutex mutex;

    void* get(Make& make) {
      std::lock_guard<std::mutex> lock(mutex);
      return ptr ? ptr : (ptr = make());
    }
  };

  Entry& entry(std::type_info const& key) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto& e = map_[key];
    return e ? *e : *(e = new Entry());
  }

  std::unordered_map<std::type_index, Entry*> map_;
  std::mutex mutex_;
};

} // namespace

void* StaticSingletonManagerWithRtti::create_(Arg& arg) {
  // This Leaky Meyers Singleton must always live in the .cpp file.
  static auto& instance = *new StaticSingletonManagerWithRttiImpl();
  return instance.create(*arg.key, arg.make, arg.cache);
}

} // namespace detail
} // namespace folly
