/*
 * Copyright 2016 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

/* These definitions are in a separate file so that they
 * may be included from C- as well as C++-based projects. */

/* Define a convenience macro to test when address sanitizer is being used
 * across the different compilers (e.g. clang, gcc) */
#if defined(__clang__)
# if __has_feature(address_sanitizer)
#  define FOLLY_SANITIZE_ADDRESS 1
# endif
#elif defined (__GNUC__) && \
      (((__GNUC__ == 4) && (__GNUC_MINOR__ >= 8)) || (__GNUC__ >= 5)) && \
      __SANITIZE_ADDRESS__
# define FOLLY_SANITIZE_ADDRESS 1
#endif

/* Define attribute wrapper for function attribute used to disable
 * address sanitizer instrumentation. Unfortunately, this attribute
 * has issues when inlining is used, so disable that as well. */
#ifdef FOLLY_SANITIZE_ADDRESS
# if defined(__clang__)
#  if __has_attribute(__no_sanitize__)
#   define FOLLY_DISABLE_ADDRESS_SANITIZER \
      __attribute__((__no_sanitize__("address"), __noinline__))
#  elif __has_attribute(__no_address_safety_analysis__)
#   define FOLLY_DISABLE_ADDRESS_SANITIZER \
      __attribute__((__no_address_safety_analysis__, __noinline__))
#  elif __has_attribute(__no_sanitize_address__)
#   define FOLLY_DISABLE_ADDRESS_SANITIZER \
      __attribute__((__no_sanitize_address__, __noinline__))
#  endif
# elif defined(__GNUC__)
#  define FOLLY_DISABLE_ADDRESS_SANITIZER \
     __attribute__((__no_address_safety_analysis__, __noinline__))
# endif
#endif
#ifndef FOLLY_DISABLE_ADDRESS_SANITIZER
# define FOLLY_DISABLE_ADDRESS_SANITIZER
#endif

/* Define a convenience macro to test when thread sanitizer is being used
 * across the different compilers (e.g. clang, gcc) */
#if defined(__clang__)
# if __has_feature(thread_sanitizer)
#  define FOLLY_SANITIZE_THREAD 1
# endif
#elif defined(__GNUC__) && __SANITIZE_THREAD__
# define FOLLY_SANITIZE_THREAD 1
#endif

/**
 * ASAN/MSAN/TSAN define pre-processor symbols:
 * ADDRESS_SANITIZER/MEMORY_SANITIZER/THREAD_SANITIZER.
 *
 * UBSAN doesn't define anything and makes it hard to
 * conditionally compile.
 *
 * The build system should define UNDEFINED_SANITIZER=1 when UBSAN is
 * used as folly whitelists some functions.
 */
#if UNDEFINED_SANITIZER
# define UBSAN_DISABLE(x) __attribute__((no_sanitize(x)))
#else
# define UBSAN_DISABLE(x)
#endif // UNDEFINED_SANITIZER
