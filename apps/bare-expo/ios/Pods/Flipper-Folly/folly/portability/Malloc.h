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

#include <stdlib.h>

#include <folly/CPortability.h>
#include <folly/portability/Config.h>

#if (defined(USE_JEMALLOC) || defined(FOLLY_USE_JEMALLOC)) && !FOLLY_SANITIZE
#if defined(FOLLY_ASSUME_NO_JEMALLOC)
#error \
    "Both USE_JEMALLOC/FOLLY_USE_JEMALLOC and FOLLY_ASSUME_NO_JEMALLOC defined"
#endif
// JEMalloc provides it's own implementation of
// malloc_usable_size, and that's what we should be using.
#if defined(__FreeBSD__)
#include <malloc_np.h> // @manual
#else
#include <jemalloc/jemalloc.h> // @manual
#endif
#else
#if !defined(__FreeBSD__)
#if __has_include(<malloc.h>)
#include <malloc.h>
#endif
#endif

#if defined(__APPLE__) && !defined(FOLLY_HAVE_MALLOC_USABLE_SIZE)
// MacOS doesn't have malloc_usable_size()
extern "C" size_t malloc_usable_size(void* ptr);
#elif defined(_WIN32)
extern "C" size_t malloc_usable_size(void* ptr);
#endif
#endif
