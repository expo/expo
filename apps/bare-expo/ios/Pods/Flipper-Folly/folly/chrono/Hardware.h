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

#include <folly/Portability.h>

#include <chrono>
#include <cstdint>

#if defined(_MSC_VER)
extern "C" std::uint64_t __rdtsc();
#pragma intrinsic(__rdtsc)
#endif

namespace folly {

inline std::uint64_t hardware_timestamp() {
#if defined(_MSC_VER)
  return __rdtsc();
#elif defined(__GNUC__) && (defined(__i386__) || FOLLY_X64)
  return __builtin_ia32_rdtsc();
#else
  // use steady_clock::now() as an approximation for the timestamp counter on
  // non-x86 systems
  return std::chrono::steady_clock::now().time_since_epoch().count();
#endif
}

} // namespace folly
