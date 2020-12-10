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

namespace folly {

namespace detail {
void annotate_object_leaked_impl(void const* ptr);
void annotate_object_collected_impl(void const* ptr);
} // namespace detail

/**
 * When the current compilation unit is being compiled with ASAN enabled this
 * function will suppress an intentionally leaked pointer from the LSAN report.
 * Otherwise, this function is an inlinable no-op.
 *
 * NOTE: This function will suppress LSAN leak reporting when the current
 * compilation unit is being compiled with ASAN, independent of whether folly
 * itself was compiled with ASAN enabled.
 */
FOLLY_ALWAYS_INLINE static void annotate_object_leaked(void const* ptr) {
  if (kIsSanitizeAddress) {
    detail::annotate_object_leaked_impl(static_cast<void const*>(ptr));
  }
}

/**
 * Annotate that an object previously passed to annotate_object_leaked() has
 * been collected, so we should no longer suppress it from the LSAN report.
 * This function is an inlinable no-op when ASAN is not enabled for the current
 * compilation unit.
 */
FOLLY_ALWAYS_INLINE static void annotate_object_collected(void const* ptr) {
  if (kIsSanitizeAddress) {
    detail::annotate_object_collected_impl(static_cast<void const*>(ptr));
  }
}
} // namespace folly
