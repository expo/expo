/*
 * Copyright 2019 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#ifndef FIRInstanceIDLib_FIRInstanceIDDefines_h
#define FIRInstanceIDLib_FIRInstanceIDDefines_h

#define _FIRInstanceID_VERBOSE_LOGGING 1

// Verbose Logging
#if (_FIRInstanceID_VERBOSE_LOGGING)
#define FIRInstanceID_DEV_VERBOSE_LOG(...) NSLog(__VA_ARGS__)
#else
#define FIRInstanceID_DEV_VERBOSE_LOG(...) \
  do {                                     \
  } while (0)
#endif  // VERBOSE_LOGGING

// WEAKIFY & STRONGIFY
// Helper macro.
#define _FIRInstanceID_WEAKNAME(VAR) VAR##_weak_

#define FIRInstanceID_WEAKIFY(VAR) __weak __typeof__(VAR) _FIRInstanceID_WEAKNAME(VAR) = (VAR);

#define FIRInstanceID_STRONGIFY(VAR)                                                \
  _Pragma("clang diagnostic push") _Pragma("clang diagnostic ignored \"-Wshadow\"") \
      __strong __typeof__(VAR) VAR = _FIRInstanceID_WEAKNAME(VAR);                  \
  _Pragma("clang diagnostic pop")

// Type Conversions (used for NSInteger etc)
#ifndef _FIRInstanceID_L
#define _FIRInstanceID_L(v) (long)(v)
#endif

#endif

// Debug Assert
#ifndef _FIRInstanceIDDevAssert
// we directly invoke the NSAssert handler so we can pass on the varargs
// (NSAssert doesn't have a macro we can use that takes varargs)
#if !defined(NS_BLOCK_ASSERTIONS)
#define _FIRInstanceIDDevAssert(condition, ...)                                                   \
  do {                                                                                            \
    if (!(condition)) {                                                                           \
      [[NSAssertionHandler currentHandler]                                                        \
          handleFailureInFunction:(NSString *)[NSString stringWithUTF8String:__PRETTY_FUNCTION__] \
                             file:(NSString *)[NSString stringWithUTF8String:__FILE__]            \
                       lineNumber:__LINE__                                                        \
                      description:__VA_ARGS__];                                                   \
    }                                                                                             \
  } while (0)
#else  // !defined(NS_BLOCK_ASSERTIONS)
#define _FIRInstanceIDDevAssert(condition, ...) \
  do {                                          \
  } while (0)
#endif  // !defined(NS_BLOCK_ASSERTIONS)

#endif  // _FIRInstanceIDDevAssert
