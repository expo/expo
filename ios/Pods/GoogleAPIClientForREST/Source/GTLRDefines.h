/* Copyright (c) 2011 Google Inc.
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

//
// GTLRDefines.h
//

// Ensure Apple's conditionals we depend on are defined.
#import <TargetConditionals.h>
#import <AvailabilityMacros.h>

// These can be redefined via a prefix if you are prefixing symbols to prefix
// the names used in strings. Something like:
//   #define _HELPER(x) "MyPrefix" #x
//   #define GTLR_CLASSNAME_STR(x) @_HELPER(x)
//   #define GTLR_CLASSNAME_CSTR(x) _HELPER(x)
#ifndef GTLR_CLASSNAME_STR
  #define _GTLR_CLASSNAME_HELPER(x) #x
  #define GTLR_CLASSNAME_STR(x) @_GTLR_CLASSNAME_HELPER(x)
  #define GTLR_CLASSNAME_CSTR(x) _GTLR_CLASSNAME_HELPER(x)
#endif

// Provide a common definition for externing constants/functions
#if defined(__cplusplus)
  #define GTLR_EXTERN extern "C"
#else
  #define GTLR_EXTERN extern
#endif

//
// GTLR_ASSERT defaults to bridging to NSAssert. This macro exists just in case
// it needs to be remapped.
// GTLR_DEBUG_ASSERT is similar, but compiles in only for debug builds
//

#ifndef GTLR_ASSERT
  // NSCAssert to avoid capturing self if used in a block.
  #define GTLR_ASSERT(condition, ...) NSCAssert(condition, __VA_ARGS__)
#endif // GTLR_ASSERT

#ifndef GTLR_DEBUG_ASSERT
  #if DEBUG && !defined(NS_BLOCK_ASSERTIONS)
    #define GTLR_DEBUG_ASSERT(condition, ...) GTLR_ASSERT(condition, __VA_ARGS__)
  #elif DEBUG
    // In DEBUG builds with assertions blocked, log to avoid unused variable warnings.
    #define GTLR_DEBUG_ASSERT(condition, ...) if (!(condition)) { NSLog(__VA_ARGS__); }
  #else
    #define GTLR_DEBUG_ASSERT(condition, ...) do { } while (0)
  #endif
#endif

#ifndef GTLR_DEBUG_LOG
  #if DEBUG
    #define GTLR_DEBUG_LOG(...) NSLog(__VA_ARGS__)
  #else
    #define GTLR_DEBUG_LOG(...) do { } while (0)
  #endif
#endif

#ifndef GTLR_DEBUG_ASSERT_CURRENT_QUEUE
  #define GTLR_ASSERT_CURRENT_QUEUE_DEBUG(targetQueue)                  \
      GTLR_DEBUG_ASSERT(0 == strcmp(GTLR_QUEUE_NAME(targetQueue),       \
                        GTLR_QUEUE_NAME(DISPATCH_CURRENT_QUEUE_LABEL)), \
          @"Current queue is %s (expected %s)",                         \
          GTLR_QUEUE_NAME(DISPATCH_CURRENT_QUEUE_LABEL),                \
          GTLR_QUEUE_NAME(targetQueue))

  #define GTLR_QUEUE_NAME(queue) \
      (strlen(dispatch_queue_get_label(queue)) > 0 ? dispatch_queue_get_label(queue) : "unnamed")
#endif  // GTLR_ASSERT_CURRENT_QUEUE_DEBUG

// Sanity check the min versions.

#if (defined(TARGET_OS_TV) && TARGET_OS_TV) || (defined(TARGET_OS_WATCH) && TARGET_OS_WATCH)
  // No min checks for these two.
#elif TARGET_OS_IPHONE
  #if !defined(__IPHONE_9_0) || (__IPHONE_OS_VERSION_MAX_ALLOWED < __IPHONE_9_0)
    #error "This project expects to be compiled with the iOS 9.0 SDK (or later)."
  #endif
  #if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_7_0
    #error "The minimum supported iOS version is 7.0."
  #endif
#elif TARGET_OS_MAC
  #if !defined(MAC_OS_X_VERSION_10_10) || (MAC_OS_X_VERSION_MAX_ALLOWED < MAC_OS_X_VERSION_10_10)
    #error "This project expects to be compiled with the OS X 10.10 SDK (or later)."
  #endif
  #if MAC_OS_X_VERSION_MIN_REQUIRED < MAC_OS_X_VERSION_10_9
    #error "The minimum supported OS X version is 10.9."
  #endif
#else
  #error "Unknown target platform."
#endif

// Version marker used to validate the generated sources against the library
// version. The will be changed any time the library makes a change that means
// past sources need to be regenerated.
#define GTLR_RUNTIME_VERSION 3000
