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

#if FOLLY_SSE_PREREQ(2, 0)

#include <emmintrin.h>

#endif

namespace folly {
namespace detail {

#if FOLLY_SSE_PREREQ(2, 0)

__m128i _mm_loadu_si128_nosan(__m128i const* const p);
FOLLY_ERASE __m128i _mm_loadu_si128_unchecked(__m128i const* const p) {
  return kIsSanitize ? _mm_loadu_si128_nosan(p) : _mm_loadu_si128(p);
}

__m128i _mm_load_si128_nosan(__m128i const* const p);
FOLLY_ERASE __m128i _mm_load_si128_unchecked(__m128i const* const p) {
  return kIsSanitize ? _mm_load_si128_nosan(p) : _mm_load_si128(p);
}

#endif

} // namespace detail
} // namespace folly
