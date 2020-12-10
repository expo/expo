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

#include <folly/synchronization/SanitizeThread.h>

// abseil uses size_t for size params while other FB code and libraries use
// long, so it is helpful to keep these declarations out of widely-included
// header files.

extern "C" FOLLY_ATTR_WEAK void
AnnotateRWLockCreate(const char* f, int l, const volatile void* addr);

extern "C" FOLLY_ATTR_WEAK void
AnnotateRWLockCreateStatic(const char* f, int l, const volatile void* addr);

extern "C" FOLLY_ATTR_WEAK void
AnnotateRWLockDestroy(const char* f, int l, const volatile void* addr);

extern "C" FOLLY_ATTR_WEAK void
AnnotateRWLockAcquired(const char* f, int l, const volatile void* addr, long w);

extern "C" FOLLY_ATTR_WEAK void
AnnotateRWLockReleased(const char* f, int l, const volatile void* addr, long w);

extern "C" FOLLY_ATTR_WEAK void AnnotateBenignRaceSized(
    const char* f,
    int l,
    const volatile void* addr,
    long size,
    const char* desc);

extern "C" FOLLY_ATTR_WEAK void AnnotateIgnoreReadsBegin(const char* f, int l);

extern "C" FOLLY_ATTR_WEAK void AnnotateIgnoreReadsEnd(const char* f, int l);

extern "C" FOLLY_ATTR_WEAK void AnnotateIgnoreWritesBegin(const char* f, int l);

extern "C" FOLLY_ATTR_WEAK void AnnotateIgnoreWritesEnd(const char* f, int l);

extern "C" FOLLY_ATTR_WEAK void AnnotateIgnoreSyncBegin(const char* f, int l);

extern "C" FOLLY_ATTR_WEAK void AnnotateIgnoreSyncEnd(const char* f, int l);

#ifdef _MSC_VER
#define FOLLY_SANITIZE_THREAD_CALL_HOOK(name, ...) [](...) {}(__VA_ARGS__)
#else
#define FOLLY_SANITIZE_THREAD_CALL_HOOK(name, ...) name(__VA_ARGS__)
#endif

namespace folly {
namespace detail {

void annotate_rwlock_create_impl(
    void const volatile* const addr,
    char const* const f,
    int const l) {
  if (kIsSanitizeThread) {
    FOLLY_SANITIZE_THREAD_CALL_HOOK(AnnotateRWLockCreate, f, l, addr);
  }
}

void annotate_rwlock_create_static_impl(
    void const volatile* const addr,
    char const* const f,
    int const l) {
  if (kIsSanitizeThread) {
    FOLLY_SANITIZE_THREAD_CALL_HOOK(AnnotateRWLockCreateStatic, f, l, addr);
  }
}

void annotate_rwlock_destroy_impl(
    void const volatile* const addr,
    char const* const f,
    int const l) {
  if (kIsSanitizeThread) {
    FOLLY_SANITIZE_THREAD_CALL_HOOK(AnnotateRWLockDestroy, f, l, addr);
  }
}

void annotate_rwlock_acquired_impl(
    void const volatile* const addr,
    annotate_rwlock_level const w,
    char const* const f,
    int const l) {
  if (kIsSanitizeThread) {
    FOLLY_SANITIZE_THREAD_CALL_HOOK(
        AnnotateRWLockAcquired, f, l, addr, static_cast<long>(w));
  }
}

void annotate_rwlock_try_acquired_impl(
    void const volatile* const addr,
    annotate_rwlock_level const w,
    bool const result,
    char const* const f,
    int const l) {
  if (result) {
    annotate_rwlock_acquired(addr, w, f, l);
  }
}

void annotate_rwlock_released_impl(
    void const volatile* const addr,
    annotate_rwlock_level const w,
    char const* const f,
    int const l) {
  if (kIsSanitizeThread) {
    FOLLY_SANITIZE_THREAD_CALL_HOOK(
        AnnotateRWLockReleased, f, l, addr, static_cast<long>(w));
  }
}

void annotate_benign_race_sized_impl(
    const volatile void* addr,
    long size,
    const char* desc,
    const char* f,
    int l) {
  if (kIsSanitizeThread) {
    FOLLY_SANITIZE_THREAD_CALL_HOOK(
        AnnotateBenignRaceSized, f, l, addr, size, desc);
  }
}

void annotate_ignore_reads_begin_impl(const char* f, int l) {
  if (kIsSanitizeThread) {
    FOLLY_SANITIZE_THREAD_CALL_HOOK(AnnotateIgnoreReadsBegin, f, l);
  }
}

void annotate_ignore_reads_end_impl(const char* f, int l) {
  if (kIsSanitizeThread) {
    FOLLY_SANITIZE_THREAD_CALL_HOOK(AnnotateIgnoreReadsEnd, f, l);
  }
}

void annotate_ignore_writes_begin_impl(const char* f, int l) {
  if (kIsSanitizeThread) {
    FOLLY_SANITIZE_THREAD_CALL_HOOK(AnnotateIgnoreWritesBegin, f, l);
  }
}

void annotate_ignore_writes_end_impl(const char* f, int l) {
  if (kIsSanitizeThread) {
    FOLLY_SANITIZE_THREAD_CALL_HOOK(AnnotateIgnoreWritesEnd, f, l);
  }
}

void annotate_ignore_sync_begin_impl(const char* f, int l) {
  if (kIsSanitizeThread) {
    FOLLY_SANITIZE_THREAD_CALL_HOOK(AnnotateIgnoreSyncBegin, f, l);
  }
}

void annotate_ignore_sync_end_impl(const char* f, int l) {
  if (kIsSanitizeThread) {
    FOLLY_SANITIZE_THREAD_CALL_HOOK(AnnotateIgnoreSyncEnd, f, l);
  }
}
} // namespace detail
} // namespace folly
