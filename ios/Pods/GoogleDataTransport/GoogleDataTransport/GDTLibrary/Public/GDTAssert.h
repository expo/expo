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

#import <Foundation/Foundation.h>

#import <GoogleDataTransport/GDTConsoleLogger.h>

/** A block type that could be run instead of normal assertion logging. No return type, no params.
 */
typedef void (^GDTAssertionBlock)(void);

/** Returns the result of executing a soft-linked method present in unit tests that allows a block
 * to be run instead of normal assertion logging. This helps ameliorate issues with catching
 * exceptions that occur on a dispatch_queue.
 *
 * @return A block that can be run instead of normal assert printing.
 */
FOUNDATION_EXPORT GDTAssertionBlock _Nullable GDTAssertionBlockToRunInstead(void);

#if defined(NS_BLOCK_ASSERTIONS)

#define GDTAssert(condition, ...) \
  do {                            \
  } while (0);

#define GDTFatalAssert(condition, ...) \
  do {                                 \
  } while (0);

#else  // defined(NS_BLOCK_ASSERTIONS)

/** Asserts using a console log, unless a block was specified to be run instead.
 *
 * @param condition The condition you'd expect to be YES.
 */
#define GDTAssert(condition, ...)                                                          \
  do {                                                                                     \
    if (__builtin_expect(!(condition), 0)) {                                               \
      GDTAssertionBlock assertionBlock = GDTAssertionBlockToRunInstead();                  \
      if (assertionBlock) {                                                                \
        assertionBlock();                                                                  \
      } else {                                                                             \
        __PRAGMA_PUSH_NO_EXTRA_ARG_WARNINGS                                                \
        NSString *__assert_file__ = [NSString stringWithUTF8String:__FILE__];              \
        __assert_file__ = __assert_file__ ? __assert_file__ : @"<Unknown File>";           \
        GDTLogError(GDTMCEGeneralError, @"Assertion failed (%@:%d): %s,", __assert_file__, \
                    __LINE__, ##__VA_ARGS__);                                              \
        __PRAGMA_POP_NO_EXTRA_ARG_WARNINGS                                                 \
      }                                                                                    \
    }                                                                                      \
  } while (0);

/** Asserts by logging to the console and throwing an exception if NS_BLOCK_ASSERTIONS is not
 * defined.
 *
 * @param condition The condition you'd expect to be YES.
 */
#define GDTFatalAssert(condition, ...)                                                  \
  do {                                                                                  \
    __PRAGMA_PUSH_NO_EXTRA_ARG_WARNINGS                                                 \
    if (__builtin_expect(!(condition), 0)) {                                            \
      NSString *__assert_file__ = [NSString stringWithUTF8String:__FILE__];             \
      __assert_file__ = __assert_file__ ? __assert_file__ : @"<Unknown File>";          \
      GDTLogError(GDTMCEFatalAssertion,                                                 \
                  @"Fatal assertion encountered, please open an issue at "              \
                   "https://github.com/firebase/firebase-ios-sdk/issues "               \
                   "(%@:%d): %s,",                                                      \
                  __assert_file__, __LINE__, ##__VA_ARGS__);                            \
      [[NSAssertionHandler currentHandler] handleFailureInMethod:_cmd                   \
                                                          object:self                   \
                                                            file:__assert_file__        \
                                                      lineNumber:__LINE__               \
                                                     description:@"%@", ##__VA_ARGS__]; \
    }                                                                                   \
    __PRAGMA_POP_NO_EXTRA_ARG_WARNINGS                                                  \
  } while (0);

#endif  // defined(NS_BLOCK_ASSERTIONS)
