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

#include <folly/lang/CString.h>

#include <algorithm>

namespace folly {

std::size_t
strlcpy(char* const dest, char const* const src, std::size_t const size) {
  std::size_t const len = std::strlen(src);
  if (size != 0) {
    std::size_t const n = std::min(len, size - 1); // always null terminate!
    std::memcpy(dest, src, n);
    dest[n] = '\0';
  }
  return len;
}

} // namespace folly
