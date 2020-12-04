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

/* These definitions are in a separate file so that they
 * may be included from C- as well as C++-based projects. */

#include <folly/portability/Config.h>

/**
 * Portable version check.
 */
#ifndef __GNUC_PREREQ
#if defined __GNUC__ && defined __GNUC_MINOR__
/* nolint */
#define __GNUC_PREREQ(maj, min) \
  ((__GNUC__ << 16) + __GNUC_MINOR__ >= ((maj) << 16) + (min))
#else
/* nolint */
#define __GNUC_PREREQ(maj, min) 0
#endif
#endif

// portable version check for clang
#ifndef __CLANG_PREREQ
#if defined __clang__ && defined __clang_major__ && defined __clang_minor__
/* nolint */
#define __CLANG_PREREQ(maj, min) \
  ((__clang_major__ << 16) + __clang_minor__ >= ((maj) << 16) + (min))
#else
/* nolint */
#define __CLANG_PREREQ(maj, min) 0
#endif
#endif

#if defined(__has_builtin)
#define FOLLY_HAS_BUILTIN(...) __has_builtin(__VA_ARGS__)
#else
#define FOLLY_HAS_BUILTIN(...) 0
#endif

#if defined(__has_feature)
#define FOLLY_HAS_FEATURE(...) __has_feature(__VA_ARGS__)
#else
#define FOLLY_HAS_FEATURE(...) 0
#endif

/* FOLLY_SANITIZE_ADDRESS is defined to 1 if the current compilation unit
 * is being compiled with ASAN enabled.
 *
 * Beware when using this macro in a header file: this macro may change values
 * across compilation units if some libraries are built with ASAN enabled
 * and some built with ASAN disabled.  For instance, this may occur, if folly
 * itself was compiled without ASAN but a downstream project that uses folly is
 * compiling with ASAN enabled.
 *
 * Use FOLLY_LIBRARY_SANITIZE_ADDRESS (defined in folly-config.h) to check if
 * folly itself was compiled with ASAN enabled.
 */
#ifndef FOLLY_SANITIZE_ADDRESS
#if FOLLY_HAS_FEATURE(address_sanitizer) || __SANITIZE_ADDRESS__
#define FOLLY_SANITIZE_ADDRESS 1
#endif
#endif

/* Define attribute wrapper for function attribute used to disable
 * address sanitizer instrumentation. Unfortunately, this attribute
 * has issues when inlining is used, so disable that as well. */
#ifdef FOLLY_SANITIZE_ADDRESS
#if defined(__clang__)
#if __has_attribute(__no_sanitize__)
#define FOLLY_DISABLE_ADDRESS_SANITIZER \
  __attribute__((__no_sanitize__("address"), __noinline__))
#elif __has_attribute(__no_address_safety_analysis__)
#define FOLLY_DISABLE_ADDRESS_SANITIZER \
  __attribute__((__no_address_safety_analysis__, __noinline__))
#elif __has_attribute(__no_sanitize_address__)
#define FOLLY_DISABLE_ADDRESS_SANITIZER \
  __attribute__((__no_sanitize_address__, __noinline__))
#endif
#elif defined(__GNUC__)
#define FOLLY_DISABLE_ADDRESS_SANITIZER \
  __attribute__((__no_address_safety_analysis__, __noinline__))
#endif
#endif
#ifndef FOLLY_DISABLE_ADDRESS_SANITIZER
#define FOLLY_DISABLE_ADDRESS_SANITIZER
#endif

/* Define a convenience macro to test when thread sanitizer is being used
 * across the different compilers (e.g. clang, gcc) */
#ifndef FOLLY_SANITIZE_THREAD
#if FOLLY_HAS_FEATURE(thread_sanitizer) || __SANITIZE_THREAD__
#define FOLLY_SANITIZE_THREAD 1
#endif
#endif

#if FOLLY_SANITIZE_THREAD
#define FOLLY_DISABLE_THREAD_SANITIZER \
  __attribute__((no_sanitize_thread, noinline))
#else
#define FOLLY_DISABLE_THREAD_SANITIZER
#endif

/**
 * Define a convenience macro to test when memory sanitizer is being used
 * across the different compilers (e.g. clang, gcc)
 */
#ifndef FOLLY_SANITIZE_MEMORY
#if FOLLY_HAS_FEATURE(memory_sanitizer) || __SANITIZE_MEMORY__
#define FOLLY_SANITIZE_MEMORY 1
#endif
#endif

#if FOLLY_SANITIZE_MEMORY
#define FOLLY_DISABLE_MEMORY_SANITIZER \
  __attribute__((no_sanitize_memory, noinline))
#else
#define FOLLY_DISABLE_MEMORY_SANITIZER
#endif

/**
 * Define a convenience macro to test when ASAN, UBSAN, TSAN or MSAN sanitizer
 * are being used
 */
#ifndef FOLLY_SANITIZE
#if defined(FOLLY_SANITIZE_ADDRESS) || defined(FOLLY_SANITIZE_THREAD) || \
    defined(FOLLY_SANITIZE_MEMORY)
#define FOLLY_SANITIZE 1
#endif
#endif

#if FOLLY_SANITIZE
#define FOLLY_DISABLE_UNDEFINED_BEHAVIOR_SANITIZER(...) \
  __attribute__((no_sanitize(__VA_ARGS__)))
#else
#define FOLLY_DISABLE_UNDEFINED_BEHAVIOR_SANITIZER(...)
#endif // FOLLY_SANITIZE

#define FOLLY_DISABLE_SANITIZERS                                 \
  FOLLY_DISABLE_ADDRESS_SANITIZER FOLLY_DISABLE_THREAD_SANITIZER \
      FOLLY_DISABLE_UNDEFINED_BEHAVIOR_SANITIZER("undefined")

/**
 * Macro for marking functions as having public visibility.
 */
#if defined(__GNUC__)
#define FOLLY_EXPORT __attribute__((__visibility__("default")))
#else
#define FOLLY_EXPORT
#endif

// noinline
#ifdef _MSC_VER
#define FOLLY_NOINLINE __declspec(noinline)
#elif defined(__GNUC__)
#define FOLLY_NOINLINE __attribute__((__noinline__))
#else
#define FOLLY_NOINLINE
#endif

// always inline
#ifdef _MSC_VER
#define FOLLY_ALWAYS_INLINE __forceinline
#elif defined(__GNUC__)
#define FOLLY_ALWAYS_INLINE inline __attribute__((__always_inline__))
#else
#define FOLLY_ALWAYS_INLINE inline
#endif

// attribute hidden
#if defined(_MSC_VER)
#define FOLLY_ATTR_VISIBILITY_HIDDEN
#elif defined(__GNUC__)
#define FOLLY_ATTR_VISIBILITY_HIDDEN __attribute__((__visibility__("hidden")))
#else
#define FOLLY_ATTR_VISIBILITY_HIDDEN
#endif

// An attribute for marking symbols as weak, if supported
#if FOLLY_HAVE_WEAK_SYMBOLS
#define FOLLY_ATTR_WEAK __attribute__((__weak__))
#else
#define FOLLY_ATTR_WEAK
#endif

// Microsoft ABI version (can be overridden manually if necessary)
#ifndef FOLLY_MICROSOFT_ABI_VER
#ifdef _MSC_VER
#define FOLLY_MICROSOFT_ABI_VER _MSC_VER
#endif
#endif

//  FOLLY_ERASE
//
//  A conceptual attribute/syntax combo for erasing a function from the build
//  artifacts and forcing all call-sites to inline the callee, at least as far
//  as each compiler supports.
//
//  Semantically includes the inline specifier.
#define FOLLY_ERASE FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN

//  FOLLY_ERASE_HACK_GCC
//
//  Equivalent to FOLLY_ERASE, but without hiding under gcc. Useful when applied
//  to a function which may sometimes be hidden separately, for example by being
//  declared in an anonymous namespace, since in such cases with -Wattributes
//  enabled, gcc would emit: 'visibility' attribute ignored.
//
//  Semantically includes the inline specifier.
#if defined(__GNUC__) && !defined(__clang__)
#define FOLLY_ERASE_HACK_GCC FOLLY_ALWAYS_INLINE
#else
#define FOLLY_ERASE_HACK_GCC FOLLY_ERASE
#endif

//  FOLLY_ERASE_TRYCATCH
//
//  Equivalent to FOLLY_ERASE, but for code which might contain explicit
//  exception handling. Has the effect of FOLLY_ERASE, except under MSVC which
//  warns about __forceinline when functions contain exception handling.
//
//  Semantically includes the inline specifier.
#ifdef _MSC_VER
#define FOLLY_ERASE_TRYCATCH inline
#else
#define FOLLY_ERASE_TRYCATCH FOLLY_ERASE
#endif
