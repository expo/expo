/*
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkAssert_DEFINED
#define SkAssert_DEFINED

#include "include/private/base/SkAPI.h"
#include "include/private/base/SkAttributes.h"
#include "include/private/base/SkDebug.h" // IWYU pragma: keep

#include <cstddef>
#include <limits>

#if defined(__clang__) && defined(__has_attribute)
    #if __has_attribute(likely)
        #define SK_LIKELY [[likely]]
        #define SK_UNLIKELY [[unlikely]]
    #else
        #define SK_LIKELY
        #define SK_UNLIKELY
    #endif
#else
    #define SK_LIKELY
    #define SK_UNLIKELY
#endif

/** Called internally if we hit an unrecoverable error.
    The platform implementation must not return, but should either throw
    an exception or otherwise exit.
*/
[[noreturn]] SK_API extern void sk_abort_no_print(void);

#if defined(SK_BUILD_FOR_GOOGLE3)
    void SkDebugfForDumpStackTrace(const char* data, void* unused);
    namespace base {
        void DumpStackTrace(int skip_count, void w(const char*, void*), void* arg);
    }
#  define SK_DUMP_GOOGLE3_STACK() ::base::DumpStackTrace(0, SkDebugfForDumpStackTrace, nullptr)
#else
#  define SK_DUMP_GOOGLE3_STACK()
#endif

#if !defined(SK_ABORT)
#  if defined(SK_BUILD_FOR_WIN)
     // This style lets Visual Studio follow errors back to the source file.
#    define SK_DUMP_LINE_FORMAT "%s(%d)"
#  else
#    define SK_DUMP_LINE_FORMAT "%s:%d"
#  endif
#  define SK_ABORT(message, ...) \
    do { \
        SkDebugf(SK_DUMP_LINE_FORMAT ": fatal error: \"" message "\"\n", \
                 __FILE__, __LINE__, ##__VA_ARGS__); \
        SK_DUMP_GOOGLE3_STACK(); \
        sk_abort_no_print(); \
    } while (false)
#endif

// SkASSERT, SkASSERTF and SkASSERT_RELEASE can be used as standalone assertion expressions, e.g.
//    uint32_t foo(int x) {
//        SkASSERT(x > 4);
//        return x - 4;
//    }
// and are also written to be compatible with constexpr functions:
//    constexpr uint32_t foo(int x) {
//        return SkASSERT(x > 4),
//               x - 4;
//    }
#if defined(__clang__)
#define SkASSERT_RELEASE(cond) \
    static_cast<void>( __builtin_expect(static_cast<bool>(cond), 1) \
        ? static_cast<void>(0) \
        : []{ SK_ABORT("check(%s)", #cond); }() )

#define SkASSERTF_RELEASE(cond, fmt, ...)                                  \
    static_cast<void>( __builtin_expect(static_cast<bool>(cond), 1)        \
        ? static_cast<void>(0)                                             \
        : [&]{ SK_ABORT("assertf(%s): " fmt, #cond, ##__VA_ARGS__); }() )
#else
#define SkASSERT_RELEASE(cond) \
    static_cast<void>( (cond) ? static_cast<void>(0) : []{ SK_ABORT("check(%s)", #cond); }() )

#define SkASSERTF_RELEASE(cond, fmt, ...)                                   \
    static_cast<void>( (cond)                                               \
        ? static_cast<void>(0)                                              \
        : [&]{ SK_ABORT("assertf(%s): " fmt, #cond, ##__VA_ARGS__); }() )
#endif

#if defined(SK_DEBUG)
    #define SkASSERT(cond)            SkASSERT_RELEASE(cond)
    #define SkASSERTF(cond, fmt, ...) SkASSERTF_RELEASE(cond, fmt, ##__VA_ARGS__)
    #define SkDEBUGFAIL(message)      SK_ABORT("%s", message)
    #define SkDEBUGFAILF(fmt, ...)    SK_ABORT(fmt, ##__VA_ARGS__)
    #define SkAssertResult(cond)      SkASSERT(cond)
#else
    #define SkASSERT(cond)            static_cast<void>(0)
    #define SkASSERTF(cond, fmt, ...) static_cast<void>(0)
    #define SkDEBUGFAIL(message)
    #define SkDEBUGFAILF(fmt, ...)

    // unlike SkASSERT, this macro executes its condition in the non-debug build.
    // The if is present so that this can be used with functions marked [[nodiscard]].
    #define SkAssertResult(cond)         if (cond) {} do {} while(false)
#endif

#if !defined(SkUNREACHABLE)
#  if defined(_MSC_VER) && !defined(__clang__)
#    include <intrin.h>
#    define FAST_FAIL_INVALID_ARG                 5
// See https://developercommunity.visualstudio.com/content/problem/1128631/code-flow-doesnt-see-noreturn-with-extern-c.html
// for why this is wrapped. Hopefully removable after msvc++ 19.27 is no longer supported.
[[noreturn]] static inline void sk_fast_fail() { __fastfail(FAST_FAIL_INVALID_ARG); }
#    define SkUNREACHABLE sk_fast_fail()
#  else
#    define SkUNREACHABLE __builtin_trap()
#  endif
#endif

[[noreturn]] SK_API inline void sk_print_index_out_of_bounds(size_t i, size_t size) {
    SK_ABORT("Index (%zu) out of bounds for size %zu.\n", i, size);
}

template <typename T> SK_API inline T sk_collection_check_bounds(T i, T size) {
    if (0 <= i && i < size) SK_LIKELY {
        return i;
    }

    SK_UNLIKELY {
        #if defined(SK_DEBUG)
            sk_print_index_out_of_bounds(static_cast<size_t>(i), static_cast<size_t>(size));
        #else
            SkUNREACHABLE;
        #endif
    }
}

[[noreturn]] SK_API inline void sk_print_length_too_big(size_t i, size_t size) {
    SK_ABORT("Length (%zu) is too big for size %zu.\n", i, size);
}

template <typename T> SK_API inline T sk_collection_check_length(T i, T size) {
    if (0 <= i && i <= size) SK_LIKELY {
        return i;
    }

    SK_UNLIKELY {
        #if defined(SK_DEBUG)
            sk_print_length_too_big(static_cast<size_t>(i), static_cast<size_t>(size));
        #else
            SkUNREACHABLE;
        #endif
    }
}

SK_API inline void sk_collection_not_empty(bool empty) {
    if (empty) SK_UNLIKELY {
        #if defined(SK_DEBUG)
            SK_ABORT("Collection is empty.\n");
        #else
            SkUNREACHABLE;
        #endif
    }
}

[[noreturn]] SK_API inline void sk_print_size_too_big(size_t size, size_t maxSize) {
    SK_ABORT("Size (%zu) can't be represented in bytes. Max size is %zu.\n", size, maxSize);
}

template <typename T>
SK_ALWAYS_INLINE size_t check_size_bytes_too_big(size_t size) {
    const size_t kMaxSize = std::numeric_limits<size_t>::max() / sizeof(T);
    if (size > kMaxSize) {
        #if defined(SK_DEBUG)
            sk_print_size_too_big(size, kMaxSize);
        #else
            SkUNREACHABLE;
        #endif
    }
    return size;
}

#endif  // SkAssert_DEFINED
