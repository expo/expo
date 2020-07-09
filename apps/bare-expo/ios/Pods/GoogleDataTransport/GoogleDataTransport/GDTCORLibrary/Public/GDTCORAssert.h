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

#import <GoogleDataTransport/GDTCORConsoleLogger.h>

NS_ASSUME_NONNULL_BEGIN

/** A block type that could be run instead of normal assertion logging. No return type, no params.
 */
typedef void (^GDTCORAssertionBlock)(void);

/** Returns the result of executing a soft-linked method present in unit tests that allows a block
 * to be run instead of normal assertion logging. This helps ameliorate issues with catching
 * exceptions that occur on a dispatch_queue.
 *
 * @return A block that can be run instead of normal assert printing.
 */
FOUNDATION_EXPORT GDTCORAssertionBlock _Nullable GDTCORAssertionBlockToRunInstead(void);

#if defined(NS_BLOCK_ASSERTIONS)

#define GDTCORAssert(condition, ...) \
  do {                               \
  } while (0);

#define GDTCORFatalAssert(condition, ...) \
  do {                                    \
  } while (0);

#else  // defined(NS_BLOCK_ASSERTIONS)

/** Asserts using a console log, unless a block was specified to be run instead.
 *
 * @param condition The condition you'd expect to be YES.
 */
#define GDTCORAssert(condition, format, ...)                                     \
  do {                                                                           \
    __PRAGMA_PUSH_NO_EXTRA_ARG_WARNINGS                                          \
    if (__builtin_expect(!(condition), 0)) {                                     \
      GDTCORAssertionBlock assertionBlock = GDTCORAssertionBlockToRunInstead();  \
      if (assertionBlock) {                                                      \
        assertionBlock();                                                        \
      } else {                                                                   \
        NSString *__assert_file__ = [NSString stringWithUTF8String:__FILE__];    \
        __assert_file__ = __assert_file__ ? __assert_file__ : @"<Unknown File>"; \
        GDTCORLogAssert(NO, __assert_file__, __LINE__, format, ##__VA_ARGS__);   \
        __PRAGMA_POP_NO_EXTRA_ARG_WARNINGS                                       \
      }                                                                          \
    }                                                                            \
  } while (0);

/** Asserts by logging to the console and throwing an exception if NS_BLOCK_ASSERTIONS is not
 * defined.
 *
 * @param condition The condition you'd expect to be YES.
 */
#define GDTCORFatalAssert(condition, format, ...)                                          \
  do {                                                                                     \
    __PRAGMA_PUSH_NO_EXTRA_ARG_WARNINGS                                                    \
    if (__builtin_expect(!(condition), 0)) {                                               \
      GDTCORAssertionBlock assertionBlock = GDTCORAssertionBlockToRunInstead();            \
      if (assertionBlock) {                                                                \
        assertionBlock();                                                                  \
      } else {                                                                             \
        NSString *__assert_file__ = [NSString stringWithUTF8String:__FILE__];              \
        __assert_file__ = __assert_file__ ? __assert_file__ : @"<Unknown File>";           \
        GDTCORLogAssert(YES, __assert_file__, __LINE__, format, ##__VA_ARGS__);            \
        [[NSAssertionHandler currentHandler] handleFailureInMethod:_cmd                    \
                                                            object:self                    \
                                                              file:__assert_file__         \
                                                        lineNumber:__LINE__                \
                                                       description:format, ##__VA_ARGS__]; \
        __PRAGMA_POP_NO_EXTRA_ARG_WARNINGS                                                 \
      }                                                                                    \
    }                                                                                      \
  } while (0);

#endif  // defined(NS_BLOCK_ASSERTIONS)

NS_ASSUME_NONNULL_END
