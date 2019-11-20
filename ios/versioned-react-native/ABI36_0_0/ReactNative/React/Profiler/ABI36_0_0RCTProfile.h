/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI36_0_0React/ABI36_0_0RCTAssert.h>
#import <ABI36_0_0React/ABI36_0_0RCTDefines.h>

/**
 * ABI36_0_0RCTProfile
 *
 * This file provides a set of functions and macros for performance profiling
 *
 * NOTE: This API is a work in progress, please consider carefully before
 * using it.
 */

ABI36_0_0RCT_EXTERN NSString *const ABI36_0_0RCTProfileDidStartProfiling;
ABI36_0_0RCT_EXTERN NSString *const ABI36_0_0RCTProfileDidEndProfiling;

ABI36_0_0RCT_EXTERN const uint64_t ABI36_0_0RCTProfileTagAlways;

#if ABI36_0_0RCT_PROFILE

@class ABI36_0_0RCTBridge;

#define ABI36_0_0RCTProfileBeginFlowEvent() \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wshadow\"") \
NSUInteger __rct_profile_flow_id = _ABI36_0_0RCTProfileBeginFlowEvent(); \
_Pragma("clang diagnostic pop")

#define ABI36_0_0RCTProfileEndFlowEvent() \
_ABI36_0_0RCTProfileEndFlowEvent(__rct_profile_flow_id)

ABI36_0_0RCT_EXTERN dispatch_queue_t ABI36_0_0RCTProfileGetQueue(void);

ABI36_0_0RCT_EXTERN NSUInteger _ABI36_0_0RCTProfileBeginFlowEvent(void);
ABI36_0_0RCT_EXTERN void _ABI36_0_0RCTProfileEndFlowEvent(NSUInteger);

/**
 * Returns YES if the profiling information is currently being collected
 */
ABI36_0_0RCT_EXTERN BOOL ABI36_0_0RCTProfileIsProfiling(void);

/**
 * Start collecting profiling information
 */
ABI36_0_0RCT_EXTERN void ABI36_0_0RCTProfileInit(ABI36_0_0RCTBridge *);

/**
 * Stop profiling and return a JSON string of the collected data - The data
 * returned is compliant with google's trace event format - the format used
 * as input to trace-viewer
 */
ABI36_0_0RCT_EXTERN void ABI36_0_0RCTProfileEnd(ABI36_0_0RCTBridge *, void (^)(NSString *));

/**
 * Collects the initial event information for the event and returns a reference ID
 */
ABI36_0_0RCT_EXTERN void _ABI36_0_0RCTProfileBeginEvent(NSThread *calleeThread,
                                      NSTimeInterval time,
                                      uint64_t tag,
                                      NSString *name,
                                      NSDictionary<NSString *, NSString *> *args);
#define ABI36_0_0RCT_PROFILE_BEGIN_EVENT(tag, name, args) \
  do { \
    if (ABI36_0_0RCTProfileIsProfiling()) { \
      NSThread *__calleeThread = [NSThread currentThread]; \
      NSTimeInterval __time = CACurrentMediaTime(); \
      _ABI36_0_0RCTProfileBeginEvent(__calleeThread, __time, tag, name, args); \
    } \
  } while(0)

/**
 * The ID returned by BeginEvent should then be passed into EndEvent, with the
 * rest of the event information. Just at this point the event will actually be
 * registered
 */
ABI36_0_0RCT_EXTERN void _ABI36_0_0RCTProfileEndEvent(NSThread *calleeThread,
                                    NSString *threadName,
                                    NSTimeInterval time,
                                    uint64_t tag,
                                    NSString *category);

#define ABI36_0_0RCT_PROFILE_END_EVENT(tag, category) \
  do { \
    if (ABI36_0_0RCTProfileIsProfiling()) { \
      NSThread *__calleeThread = [NSThread currentThread]; \
      NSString *__threadName = ABI36_0_0RCTCurrentThreadName(); \
      NSTimeInterval __time = CACurrentMediaTime(); \
      _ABI36_0_0RCTProfileEndEvent(__calleeThread, __threadName, __time, tag, category); \
    } \
  } while(0)

/**
 * Collects the initial event information for the event and returns a reference ID
 */
ABI36_0_0RCT_EXTERN NSUInteger ABI36_0_0RCTProfileBeginAsyncEvent(uint64_t tag,
                                                NSString *name,
                                                NSDictionary<NSString *, NSString *> *args);

/**
 * The ID returned by BeginEvent should then be passed into EndEvent, with the
 * rest of the event information. Just at this point the event will actually be
 * registered
 */
ABI36_0_0RCT_EXTERN void ABI36_0_0RCTProfileEndAsyncEvent(uint64_t tag,
                                        NSString *category,
                                        NSUInteger cookie,
                                        NSString *name,
                                        NSString *threadName);

/**
 * An event that doesn't have a duration (i.e. Notification, VSync, etc)
 */
ABI36_0_0RCT_EXTERN void ABI36_0_0RCTProfileImmediateEvent(uint64_t tag,
                                         NSString *name,
                                         NSTimeInterval time,
                                         char scope);

/**
 * Helper to profile the duration of the execution of a block. This method uses
 * self and _cmd to name this event for simplicity sake.
 *
 * NOTE: The block can't expect any argument
 *
 * DEPRECATED: this approach breaks debugging and stepping through instrumented block functions
 */
#define ABI36_0_0RCTProfileBlock(block, tag, category, arguments) \
^{ \
  ABI36_0_0RCT_PROFILE_BEGIN_EVENT(tag, @(__PRETTY_FUNCTION__), nil); \
  block(); \
  ABI36_0_0RCT_PROFILE_END_EVENT(tag, category, arguments); \
}

/**
 * Hook into a bridge instance to log all bridge module's method calls
 */
ABI36_0_0RCT_EXTERN void ABI36_0_0RCTProfileHookModules(ABI36_0_0RCTBridge *);

/**
 * Unhook from a given bridge instance's modules
 */
ABI36_0_0RCT_EXTERN void ABI36_0_0RCTProfileUnhookModules(ABI36_0_0RCTBridge *);

/**
 * Hook into all of a module's methods
 */
ABI36_0_0RCT_EXTERN void ABI36_0_0RCTProfileHookInstance(id instance);

/**
 * Send systrace or cpu profiling information to the packager
 * to present to the user
 */
ABI36_0_0RCT_EXTERN void ABI36_0_0RCTProfileSendResult(ABI36_0_0RCTBridge *bridge, NSString *route, NSData *profileData);

/**
 * Systrace gluecode
 *
 * allow to use systrace to back ABI36_0_0RCTProfile
 */

typedef struct {
  const char *key;
  unsigned long key_len;
  const char *value;
  unsigned long value_len;
} systrace_arg_t;

typedef struct {
  char *(*start)(void);
  void (*stop)(void);

  void (*begin_section)(uint64_t tag, const char *name, size_t numArgs, systrace_arg_t *args);
  void (*end_section)(uint64_t tag, size_t numArgs, systrace_arg_t *args);

  void (*begin_async_section)(uint64_t tag, const char *name, int cookie, size_t numArgs, systrace_arg_t *args);
  void (*end_async_section)(uint64_t tag, const char *name, int cookie, size_t numArgs, systrace_arg_t *args);

  void (*instant_section)(uint64_t tag, const char *name, char scope);

  void (*begin_async_flow)(uint64_t tag, const char *name, int cookie);
  void (*end_async_flow)(uint64_t tag, const char *name, int cookie);
} ABI36_0_0RCTProfileCallbacks;

ABI36_0_0RCT_EXTERN void ABI36_0_0RCTProfileRegisterCallbacks(ABI36_0_0RCTProfileCallbacks *);

/**
 * Systrace control window
 */
ABI36_0_0RCT_EXTERN void ABI36_0_0RCTProfileShowControls(void);
ABI36_0_0RCT_EXTERN void ABI36_0_0RCTProfileHideControls(void);

#else

#define ABI36_0_0RCTProfileBeginFlowEvent()
#define _ABI36_0_0RCTProfileBeginFlowEvent() @0

#define ABI36_0_0RCTProfileEndFlowEvent()
#define _ABI36_0_0RCTProfileEndFlowEvent(...)

#define ABI36_0_0RCTProfileIsProfiling(...) NO
#define ABI36_0_0RCTProfileInit(...)
#define ABI36_0_0RCTProfileEnd(...) @""

#define _ABI36_0_0RCTProfileBeginEvent(...)
#define _ABI36_0_0RCTProfileEndEvent(...)

#define ABI36_0_0RCT_PROFILE_BEGIN_EVENT(...)
#define ABI36_0_0RCT_PROFILE_END_EVENT(...)

#define ABI36_0_0RCTProfileBeginAsyncEvent(...) 0
#define ABI36_0_0RCTProfileEndAsyncEvent(...)

#define ABI36_0_0RCTProfileImmediateEvent(...)

#define ABI36_0_0RCTProfileBlock(block, ...) block

#define ABI36_0_0RCTProfileHookModules(...)
#define ABI36_0_0RCTProfileHookInstance(...)
#define ABI36_0_0RCTProfileUnhookModules(...)

#define ABI36_0_0RCTProfileSendResult(...)

#define ABI36_0_0RCTProfileShowControls(...)
#define ABI36_0_0RCTProfileHideControls(...)

#endif
