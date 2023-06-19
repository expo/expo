/*
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkAssert_DEFINED
#define SkAssert_DEFINED

#include "include/private/base/SkAPI.h"
#include "include/private/base/SkDebug.h" // IWYU pragma: keep

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

// SkASSERT, SkASSERTF and SkASSERT_RELEASE can be used as stand alone assertion expressions, e.g.
//    uint32_t foo(int x) {
//        SkASSERT(x > 4);
//        return x - 4;
//    }
// and are also written to be compatible with constexpr functions:
//    constexpr uint32_t foo(int x) {
//        return SkASSERT(x > 4),
//               x - 4;
//    }
#define SkASSERT_RELEASE(cond) \
        static_cast<void>( (cond) ? (void)0 : []{ SK_ABORT("assert(%s)", #cond); }() )

#if defined(SK_DEBUG)
    #define SkASSERT(cond) SkASSERT_RELEASE(cond)
    #define SkASSERTF(cond, fmt, ...) static_cast<void>( (cond) ? (void)0 : [&]{ \
                                          SkDebugf(fmt"\n", ##__VA_ARGS__);      \
                                          SK_ABORT("assert(%s)", #cond);         \
                                      }() )
    #define SkDEBUGFAIL(message)        SK_ABORT("%s", message)
    #define SkDEBUGFAILF(fmt, ...)      SK_ABORT(fmt, ##__VA_ARGS__)
    #define SkAssertResult(cond)        SkASSERT(cond)
#else
    #define SkASSERT(cond)            static_cast<void>(0)
    #define SkASSERTF(cond, fmt, ...) static_cast<void>(0)
    #define SkDEBUGFAIL(message)
    #define SkDEBUGFAILF(fmt, ...)

    // unlike SkASSERT, this macro executes its condition in the non-debug build.
    // The if is present so that this can be used with functions marked SK_WARN_UNUSED_RESULT.
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

#endif
