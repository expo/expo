/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Based on mutex.h from https://clang.llvm.org/docs/ThreadSafetyAnalysis.html

#ifndef THREAD_SAFETY_ANALYSIS_MUTEX_H
#define THREAD_SAFETY_ANALYSIS_MUTEX_H

// Enable thread safety attributes only with clang.
// The attributes can be safely erased when compiling with other compilers.
#if defined(__clang__) && (!defined(SWIG)) && defined(_LIBCPP_VERSION) && \
    defined(_LIBCPP_ENABLE_THREAD_SAFETY_ANNOTATIONS)
#define TSA_THREAD_ANNOTATION_ATTRIBUTE__(x) __attribute__((x))
#else
#define TSA_THREAD_ANNOTATION_ATTRIBUTE__(x) // no-op
#endif

#define TSA_CAPABILITY(x) TSA_THREAD_ANNOTATION_ATTRIBUTE__(capability(x))

#define TSA_SCOPED_CAPABILITY TSA_THREAD_ANNOTATION_ATTRIBUTE__(scoped_lockable)

#define TSA_GUARDED_BY(x) TSA_THREAD_ANNOTATION_ATTRIBUTE__(guarded_by(x))

#define TSA_PT_GUARDED_BY(x) TSA_THREAD_ANNOTATION_ATTRIBUTE__(pt_guarded_by(x))

#define TSA_ACQUIRED_BEFORE(...) \
  TSA_THREAD_ANNOTATION_ATTRIBUTE__(acquired_before(__VA_ARGS__))

#define TSA_ACQUIRED_AFTER(...) \
  TSA_THREAD_ANNOTATION_ATTRIBUTE__(acquired_after(__VA_ARGS__))

#define TSA_REQUIRES(...) \
  TSA_THREAD_ANNOTATION_ATTRIBUTE__(requires_capability(__VA_ARGS__))

#define TSA_REQUIRES_SHARED(...) \
  TSA_THREAD_ANNOTATION_ATTRIBUTE__(requires_shared_capability(__VA_ARGS__))

#define TSA_ACQUIRE(...) \
  TSA_THREAD_ANNOTATION_ATTRIBUTE__(acquire_capability(__VA_ARGS__))

#define TSA_ACQUIRE_SHARED(...) \
  TSA_THREAD_ANNOTATION_ATTRIBUTE__(acquire_shared_capability(__VA_ARGS__))

#define TSA_RELEASE(...) \
  TSA_THREAD_ANNOTATION_ATTRIBUTE__(release_capability(__VA_ARGS__))

#define TSA_RELEASE_SHARED(...) \
  TSA_THREAD_ANNOTATION_ATTRIBUTE__(release_shared_capability(__VA_ARGS__))

#define TSA_RELEASE_GENERIC(...) \
  TSA_THREAD_ANNOTATION_ATTRIBUTE__(release_generic_capability(__VA_ARGS__))

#define TSA_TRY_ACQUIRE(...) \
  TSA_THREAD_ANNOTATION_ATTRIBUTE__(try_acquire_capability(__VA_ARGS__))

#define TSA_TRY_ACQUIRE_SHARED(...) \
  TSA_THREAD_ANNOTATION_ATTRIBUTE__(try_acquire_shared_capability(__VA_ARGS__))

#define TSA_EXCLUDES(...) \
  TSA_THREAD_ANNOTATION_ATTRIBUTE__(locks_excluded(__VA_ARGS__))

#define TSA_ASSERT_CAPABILITY(x) \
  TSA_THREAD_ANNOTATION_ATTRIBUTE__(assert_capability(x))

#define TSA_ASSERT_SHARED_CAPABILITY(x) \
  TSA_THREAD_ANNOTATION_ATTRIBUTE__(assert_shared_capability(x))

#define TSA_RETURN_CAPABILITY(x) \
  TSA_THREAD_ANNOTATION_ATTRIBUTE__(lock_returned(x))

#define TSA_NO_THREAD_SAFETY_ANALYSIS \
  TSA_THREAD_ANNOTATION_ATTRIBUTE__(no_thread_safety_analysis)

#endif // THREAD_SAFETY_ANALYSIS_MUTEX_H
