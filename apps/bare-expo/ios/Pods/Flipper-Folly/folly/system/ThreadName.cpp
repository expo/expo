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

#include <folly/system/ThreadName.h>

#include <type_traits>

#include <folly/Portability.h>
#include <folly/Traits.h>
#include <folly/portability/PThread.h>
#include <folly/portability/Windows.h>

// Android only, prctl is only used when pthread_setname_np
// and pthread_getname_np are not avilable.
#if defined(__linux__)
#define FOLLY_DETAIL_HAS_PRCTL_PR_SET_NAME 1
#else
#define FOLLY_DETAIL_HAS_PRCTL_PR_SET_NAME 0
#endif

#if FOLLY_DETAIL_HAS_PRCTL_PR_SET_NAME
#include <sys/prctl.h>
#endif

// This looks a bit weird, but it's necessary to avoid
// having an undefined compiler function called.
#if defined(__GLIBC__) && !defined(__APPLE__) && !defined(__ANDROID__)
#if __GLIBC_PREREQ(2, 12)
// has pthread_setname_np(pthread_t, const char*) (2 params)
#define FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME 1
#else
#define FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME 0
#endif
// pthread_setname_np was introduced in Android NDK version 9
#elif defined(__ANDROID__) && __ANDROID_API__ >= 9
#define FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME 1
#else
#define FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME 0
#endif

#if defined(__APPLE__)
#if defined(__MAC_OS_X_VERSION_MIN_REQUIRED) && \
    __MAC_OS_X_VERSION_MIN_REQUIRED >= 1060
// macOS 10.6+ has pthread_setname_np(const char*) (1 param)
#define FOLLY_HAS_PTHREAD_SETNAME_NP_NAME 1
#elif defined(__IPHONE_OS_VERSION_MIN_REQUIRED) && \
    __IPHONE_OS_VERSION_MIN_REQUIRED >= 30200
// iOS 3.2+ has pthread_setname_np(const char*) (1 param)
#define FOLLY_HAS_PTHREAD_SETNAME_NP_NAME 1
#else
#define FOLLY_HAS_PTHREAD_SETNAME_NP_NAME 0
#endif
#else
#define FOLLY_HAS_PTHREAD_SETNAME_NP_NAME 0
#endif // defined(__APPLE__)

namespace folly {

namespace {

#if FOLLY_HAVE_PTHREAD && !defined(_WIN32)
pthread_t stdTidToPthreadId(std::thread::id tid) {
  static_assert(
      std::is_same<pthread_t, std::thread::native_handle_type>::value,
      "This assumes that the native handle type is pthread_t");
  static_assert(
      sizeof(std::thread::native_handle_type) == sizeof(std::thread::id),
      "This assumes std::thread::id is a thin wrapper around "
      "std::thread::native_handle_type, but that doesn't appear to be true.");
  // In most implementations, std::thread::id is a thin wrapper around
  // std::thread::native_handle_type, which means we can do unsafe things to
  // extract it.
  pthread_t id;
  std::memcpy(&id, &tid, sizeof(id));
  return id;
}
#endif

} // namespace

bool canSetCurrentThreadName() {
#if FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME ||                                \
    FOLLY_HAS_PTHREAD_SETNAME_NP_NAME || FOLLY_DETAIL_HAS_PRCTL_PR_SET_NAME || \
    defined(_WIN32)
  return true;
#else
  return false;
#endif
}

bool canSetOtherThreadName() {
#if FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME || defined(_WIN32)
  return true;
#else
  return false;
#endif
}

static constexpr size_t kMaxThreadNameLength = 16;

Optional<std::string> getThreadName(std::thread::id id) {
#if (                                           \
    FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME || \
    FOLLY_HAS_PTHREAD_SETNAME_NP_NAME) &&       \
    !defined(__ANDROID__)
  // Android NDK does not yet support pthread_getname_np.
  std::array<char, kMaxThreadNameLength> buf;
  if (id != std::thread::id() &&
      pthread_getname_np(stdTidToPthreadId(id), buf.data(), buf.size()) == 0) {
    return std::string(buf.data());
  }
#elif FOLLY_DETAIL_HAS_PRCTL_PR_SET_NAME
  std::array<char, kMaxThreadNameLength> buf;
  if (id == std::this_thread::get_id() &&
      prctl(PR_GET_NAME, buf.data(), 0L, 0L, 0L) == 0) {
    return std::string(buf.data());
  }
#endif
  (void)id;
  return none;
} // namespace folly

Optional<std::string> getCurrentThreadName() {
  return getThreadName(std::this_thread::get_id());
}

bool setThreadName(std::thread::id tid, StringPiece name) {
  auto trimmedName = name.subpiece(0, kMaxThreadNameLength - 1).str();
#ifdef _WIN32
  static_assert(
      sizeof(unsigned int) == sizeof(std::thread::id),
      "This assumes std::thread::id is a thin wrapper around "
      "the thread id as an unsigned int, but that doesn't appear to be true.");

// http://msdn.microsoft.com/en-us/library/xcb2z8hs.aspx
#pragma pack(push, 8)
  struct THREADNAME_INFO {
    DWORD dwType; // Must be 0x1000
    LPCSTR szName; // Pointer to name (in user address space)
    DWORD dwThreadID; // Thread ID (-1 for caller thread)
    DWORD dwFlags; // Reserved for future use; must be zero
  };
  union TNIUnion {
    THREADNAME_INFO tni;
    ULONG_PTR upArray[4];
  };
#pragma pack(pop)

  static constexpr DWORD kMSVCException = 0x406D1388;

  // std::thread::id is a thin wrapper around an integral thread id,
  // so just extract the ID.
  unsigned int id;
  std::memcpy(&id, &tid, sizeof(id));

  TNIUnion tniUnion = {0x1000, trimmedName.data(), id, 0};
  // This has to be in a separate stack frame from trimmedName, which requires
  // C++ object destruction semantics.
  return [&]() {
    __try {
      RaiseException(kMSVCException, 0, 4, tniUnion.upArray);
    } __except (
        GetExceptionCode() == kMSVCException ? EXCEPTION_CONTINUE_EXECUTION
                                             : EXCEPTION_EXECUTE_HANDLER) {
      // Swallow the exception when a debugger isn't attached.
    }
    return true;
  }();
#else
  name = name.subpiece(0, kMaxThreadNameLength - 1);
  char buf[kMaxThreadNameLength] = {};
  std::memcpy(buf, name.data(), name.size());
  auto id = stdTidToPthreadId(tid);
#if FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME
  return 0 == pthread_setname_np(id, buf);
#elif FOLLY_HAS_PTHREAD_SETNAME_NP_NAME
  // Since macOS 10.6 and iOS 3.2 it is possible for a thread
  // to set its own name using pthread, but
  // not that of some other thread.
  if (pthread_equal(pthread_self(), id)) {
    return 0 == pthread_setname_np(buf);
  }
#elif FOLLY_DETAIL_HAS_PRCTL_PR_SET_NAME
  // for Android prctl is used instead of pthread_setname_np
  // if Android NDK version is older than API level 9.
  if (pthread_equal(pthread_self(), id)) {
    return 0 == prctl(PR_SET_NAME, buf, 0L, 0L, 0L);
  }
#endif

  (void)id;
  return false;
#endif
}

bool setThreadName(pthread_t pid, StringPiece name) {
#ifdef _WIN32
  static_assert(
      sizeof(unsigned int) == sizeof(std::thread::id),
      "This assumes std::thread::id is a thin wrapper around "
      "the thread id as an unsigned int, but that doesn't appear to be true.");

  // std::thread::id is a thin wrapper around an integral thread id,
  // so just stick the ID in.
  unsigned int tid = pthread_getw32threadid_np(pid);
  std::thread::id id;
  std::memcpy(&id, &tid, sizeof(id));
  return setThreadName(id, name);
#else
  static_assert(
      std::is_same<pthread_t, std::thread::native_handle_type>::value,
      "This assumes that the native handle type is pthread_t");
  static_assert(
      sizeof(std::thread::native_handle_type) == sizeof(std::thread::id),
      "This assumes std::thread::id is a thin wrapper around "
      "std::thread::native_handle_type, but that doesn't appear to be true.");
  // In most implementations, std::thread::id is a thin wrapper around
  // std::thread::native_handle_type, which means we can do unsafe things to
  // extract it.
  std::thread::id id;
  std::memcpy(static_cast<void*>(&id), &pid, sizeof(id));
  return setThreadName(id, name);
#endif
}

bool setThreadName(StringPiece name) {
  return setThreadName(std::this_thread::get_id(), name);
}
} // namespace folly
