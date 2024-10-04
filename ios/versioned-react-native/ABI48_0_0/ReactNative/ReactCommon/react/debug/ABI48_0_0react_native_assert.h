/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// No header guards since it is legitimately possible to include this file more
// than once with and without ABI48_0_0REACT_NATIVE_DEBUG.

// ABI48_0_0React_native_assert allows us to opt-in to specific asserts on Android and
// test before moving on. When all issues have been found, maybe we can use
// `UNDEBUG` flag to disable NDEBUG in debug builds on Android.

#include "ABI48_0_0flags.h"

#undef ABI48_0_0React_native_assert

#ifndef ABI48_0_0REACT_NATIVE_DEBUG

#define ABI48_0_0React_native_assert(e) ((void)0)

#else // ABI48_0_0REACT_NATIVE_DEBUG

#ifdef __ANDROID__

#include <android/log.h>

#ifdef __cplusplus
extern "C" {
#endif // __cplusplus
void ABI48_0_0React_native_assert_fail(
    const char *func,
    const char *file,
    int line,
    const char *expr);
#ifdef __cplusplus
}
#endif // __cpusplus

#define ABI48_0_0React_native_assert(e) \
  ((e) ? (void)0 : ABI48_0_0React_native_assert_fail(__func__, __FILE__, __LINE__, #e))

#else // __ANDROID__

#include <glog/logging.h>
#include <cassert>

// For all platforms, but iOS+Xcode especially: flush logs because some might be
// lost on iOS if an assert is hit right after this. If you are trying to debug
// something actively and have added lots of LOG statements to track down an
// issue, there is race between flushing the final logs and stopping execution
// when the assert hits. Thus, if we know an assert will fail, we force flushing
// to happen right before the assert.
#define ABI48_0_0React_native_assert(cond)                           \
  if (!(cond)) {                                            \
    LOG(ERROR) << "ABI48_0_0React_native_assert failure: " << #cond; \
    google::FlushLogFiles(google::GLOG_INFO);               \
    assert(cond);                                           \
  }

#endif // platforms besides __ANDROID__

#endif // ABI48_0_0REACT_NATIVE_DEBUG
