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

#include <exception>
#include <string>
#include <type_traits>

#include <folly/Demangle.h>
#include <folly/FBString.h>
#include <folly/Portability.h>

namespace folly {

/**
 * Debug string for an exception: include type and what(), if
 * defined.
 */
inline fbstring exceptionStr(const std::exception& e) {
#if FOLLY_HAS_RTTI
  fbstring rv(demangle(typeid(e)));
  rv += ": ";
#else
  fbstring rv("Exception (no RTTI available): ");
#endif
  rv += e.what();
  return rv;
}

inline fbstring exceptionStr(std::exception_ptr ep) {
  if (!kHasExceptions) {
    return "Exception (catch unavailable)";
  }
  return catch_exception(
      [&]() -> fbstring {
        return catch_exception<std::exception const&>(
            [&]() -> fbstring { std::rethrow_exception(ep); },
            [](auto&& e) { return exceptionStr(e); });
      },
      []() -> fbstring { return "<unknown exception>"; });
}

template <typename E>
auto exceptionStr(const E& e) -> typename std::
    enable_if<!std::is_base_of<std::exception, E>::value, fbstring>::type {
#if FOLLY_HAS_RTTI
  return demangle(typeid(e));
#else
  (void)e;
  return "Exception (no RTTI available)";
#endif
}

} // namespace folly
