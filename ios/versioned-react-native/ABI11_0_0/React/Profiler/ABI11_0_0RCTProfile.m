/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0RCTProfile.h"

#import <dlfcn.h>

#import <libkern/OSAtomic.h>
#import <mach/mach.h>
#import <objc/message.h>
#import <objc/runtime.h>

#import <UIKit/UIKit.h>

#import "ABI11_0_0RCTAssert.h"
#import "ABI11_0_0RCTBridge.h"
#import "ABI11_0_0RCTBridge+Private.h"
#import "ABI11_0_0RCTComponentData.h"
#import "ABI11_0_0RCTDefines.h"
#import "ABI11_0_0RCTLog.h"
#import "ABI11_0_0RCTModuleData.h"
#import "ABI11_0_0RCTUtils.h"
#import "ABI11_0_0RCTUIManager.h"
#import "ABI11_0_0RCTJSCExecutor.h"

NSString *const ABI11_0_0RCTProfileDidStartProfiling = @"ABI11_0_0RCTProfileDidStartProfiling";
NSString *const ABI11_0_0RCTProfileDidEndProfiling = @"ABI11_0_0RCTProfileDidEndProfiling";

const uint64_t ABI11_0_0RCTProfileTagAlways = 1L << 0;

#if ABI11_0_0RCT_PROFILE

#pragma mark - Constants

NSString *const ABI11_0_0RCTProfileTraceEvents = @"traceEvents";
NSString *const ABI11_0_0RCTProfileSamples = @"samples";
NSString *const ABI11_0_0RCTProfilePrefix = @"rct_profile_";

#pragma mark - Variables

// This is actually a BOOL - but has to be compatible with OSAtomic
static volatile uint32_t ABI11_0_0RCTProfileProfiling;

static NSDictionary *ABI11_0_0RCTProfileInfo;
static NSMutableDictionary *ABI11_0_0RCTProfileOngoingEvents;
static NSTimeInterval ABI11_0_0RCTProfileStartTime;
static NSUInteger ABI11_0_0RCTProfileEventID = 0;
static CADisplayLink *ABI11_0_0RCTProfileDisplayLink;
static __weak ABI11_0_0RCTBridge *_ABI11_0_0RCTProfilingBridge;
static UIWindow *ABI11_0_0RCTProfileControlsWindow;

#pragma mark - Macros

#define ABI11_0_0RCTProfileAddEvent(type, props...) \
[ABI11_0_0RCTProfileInfo[type] addObject:@{ \
  @"pid": @([[NSProcessInfo processInfo] processIdentifier]), \
  props \
}];

#define CHECK(...) \
if (!ABI11_0_0RCTProfileIsProfiling()) { \
  return __VA_ARGS__; \
}

#pragma mark - systrace glue code

static ABI11_0_0RCTProfileCallbacks *callbacks;
static char *systrace_buffer;

static systrace_arg_t *ABI11_0_0RCTProfileSystraceArgsFromNSDictionary(NSDictionary *args)
{
  if (args.count == 0) {
    return NULL;
  }

  systrace_arg_t *systrace_args = malloc(sizeof(systrace_arg_t) * args.count);
  __block size_t i = 0;
  [args enumerateKeysAndObjectsUsingBlock:^(id key, id value, __unused BOOL *stop) {
    const char *keyc = [key description].UTF8String;
    systrace_args[i].key = keyc;
    systrace_args[i].key_len = (int)strlen(keyc);

    const char *valuec = ABI11_0_0RCTJSONStringify(value, NULL).UTF8String;
    systrace_args[i].value = valuec;
    systrace_args[i].value_len = (int)strlen(valuec);
    i++;
  }];
  return systrace_args;
}

void ABI11_0_0RCTProfileRegisterCallbacks(ABI11_0_0RCTProfileCallbacks *cb)
{
  callbacks = cb;
}

#pragma mark - Private Helpers

static ABI11_0_0RCTBridge *ABI11_0_0RCTProfilingBridge(void)
{
  return _ABI11_0_0RCTProfilingBridge ?: [ABI11_0_0RCTBridge currentBridge];
}

static NSNumber *ABI11_0_0RCTProfileTimestamp(NSTimeInterval timestamp)
{
  return @((timestamp - ABI11_0_0RCTProfileStartTime) * 1e6);
}

static NSString *ABI11_0_0RCTProfileMemory(vm_size_t memory)
{
  double mem = ((double)memory) / 1024 / 1024;
  return [NSString stringWithFormat:@"%.2lfmb", mem];
}

static NSDictionary *ABI11_0_0RCTProfileGetMemoryUsage(void)
{
  struct task_basic_info info;
  mach_msg_type_number_t size = sizeof(info);
  kern_return_t kerr = task_info(mach_task_self(),
                                 TASK_BASIC_INFO,
                                 (task_info_t)&info,
                                 &size);
  if( kerr == KERN_SUCCESS ) {
    return @{
      @"suspend_count": @(info.suspend_count),
      @"virtual_size": ABI11_0_0RCTProfileMemory(info.virtual_size),
      @"resident_size": ABI11_0_0RCTProfileMemory(info.resident_size),
    };
  } else {
    return @{};
  }
}

#pragma mark - Module hooks

static const char *ABI11_0_0RCTProfileProxyClassName(Class class)
{
  return [ABI11_0_0RCTProfilePrefix stringByAppendingString:NSStringFromClass(class)].UTF8String;
}

static dispatch_group_t ABI11_0_0RCTProfileGetUnhookGroup(void)
{
  static dispatch_group_t unhookGroup;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    unhookGroup = dispatch_group_create();
  });

  return unhookGroup;
}

ABI11_0_0RCT_EXTERN IMP ABI11_0_0RCTProfileGetImplementation(id obj, SEL cmd);
IMP ABI11_0_0RCTProfileGetImplementation(id obj, SEL cmd)
{
  return class_getMethodImplementation([obj class], cmd);
}

/**
 * For the profiling we have to execute some code before and after every
 * function being profiled, the only way of doing that with pure Objective-C is
 * by using `-forwardInvocation:`, which is slow and could skew the profile
 * results.
 *
 * The alternative in assembly is much simpler, we just need to store all the
 * state at the beginning of the function, start the profiler, restore all the
 * state, call the actual function we want to profile and stop the profiler.
 *
 * The implementation can be found in ABI11_0_0RCTProfileTrampoline-<arch>.s where arch
 * is one of: i386, x86_64, arm, arm64.
 */
#if defined(__i386__) || \
    defined(__x86_64__) || \
    defined(__arm__) || \
    defined(__arm64__)

  ABI11_0_0RCT_EXTERN void ABI11_0_0RCTProfileTrampoline(void);
#else
  static void *ABI11_0_0RCTProfileTrampoline = NULL;
#endif

ABI11_0_0RCT_EXTERN void ABI11_0_0RCTProfileTrampolineStart(id, SEL);
void ABI11_0_0RCTProfileTrampolineStart(id self, SEL cmd)
{
  /**
   * This call might be during dealloc, so we shouldn't retain the object in the
   * block.
   */
  Class klass = [self class];
  ABI11_0_0RCT_PROFILE_BEGIN_EVENT(ABI11_0_0RCTProfileTagAlways, ([NSString stringWithFormat:@"-[%s %s]", class_getName(klass), sel_getName(cmd)]), nil);
}

ABI11_0_0RCT_EXTERN void ABI11_0_0RCTProfileTrampolineEnd(void);
void ABI11_0_0RCTProfileTrampolineEnd(void)
{
  ABI11_0_0RCT_PROFILE_END_EVENT(ABI11_0_0RCTProfileTagAlways, @"objc_call,modules,auto");
}

static UIView *(*originalCreateView)(ABI11_0_0RCTComponentData *, SEL, NSNumber *);
static UIView *ABI11_0_0RCTProfileCreateView(ABI11_0_0RCTComponentData *self, SEL _cmd, NSNumber *tag)
{
  UIView *view = originalCreateView(self, _cmd, tag);
  ABI11_0_0RCTProfileHookInstance(view);
  return view;
}

static void ABI11_0_0RCTProfileHookUIManager(ABI11_0_0RCTUIManager *uiManager)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    for (id view in [uiManager valueForKey:@"viewRegistry"]) {
      ABI11_0_0RCTProfileHookInstance([uiManager viewForReactABI11_0_0Tag:view]);
    }

    Method createView = class_getInstanceMethod([ABI11_0_0RCTComponentData class], @selector(createViewWithTag:));

    if (method_getImplementation(createView) != (IMP)ABI11_0_0RCTProfileCreateView) {
      originalCreateView = (typeof(originalCreateView))method_getImplementation(createView);
      method_setImplementation(createView, (IMP)ABI11_0_0RCTProfileCreateView);
    }
  });
}

void ABI11_0_0RCTProfileHookInstance(id instance)
{
  Class moduleClass = object_getClass(instance);

  /**
   * We swizzle the instance -class method to return the original class, but
   * object_getClass will return the actual class.
   *
   * If they are different, it means that the object is returning the original
   * class, but it's actual class is the proxy subclass we created.
   */
  if ([instance class] != moduleClass) {
    return;
  }

  Class proxyClass = objc_allocateClassPair(moduleClass, ABI11_0_0RCTProfileProxyClassName(moduleClass), 0);

  if (!proxyClass) {
    proxyClass = objc_getClass(ABI11_0_0RCTProfileProxyClassName(moduleClass));
    if (proxyClass) {
      object_setClass(instance, proxyClass);
    }
    return;
  }

  unsigned int methodCount;
  Method *methods = class_copyMethodList(moduleClass, &methodCount);
  for (NSUInteger i = 0; i < methodCount; i++) {
    Method method = methods[i];
    SEL selector = method_getName(method);

    /**
     * Bail out on struct returns (except arm64) - we don't use it enough
     * to justify writing a stret version
     */
#ifdef __arm64__
    BOOL returnsStruct = NO;
#else
    const char *typeEncoding = method_getTypeEncoding(method);
    // bail out on structs and unions (since they might contain structs)
    BOOL returnsStruct = typeEncoding[0] == '{' || typeEncoding[0] == '(';
#endif

    /**
     * Avoid hooking into NSObject methods, methods generated by ReactABI11_0_0 Native
     * and special methods that start `.` (e.g. .cxx_destruct)
     */
    if ([NSStringFromSelector(selector) hasPrefix:@"rct"] || [NSObject instancesRespondToSelector:selector] || sel_getName(selector)[0] == '.' || returnsStruct) {
      continue;
    }

    const char *types = method_getTypeEncoding(method);
    class_addMethod(proxyClass, selector, (IMP)ABI11_0_0RCTProfileTrampoline, types);
  }
  free(methods);

  class_replaceMethod(object_getClass(proxyClass), @selector(initialize), imp_implementationWithBlock(^{}), "v@:");

  for (Class cls in @[proxyClass, object_getClass(proxyClass)]) {
    Method oldImp = class_getInstanceMethod(cls, @selector(class));
    class_replaceMethod(cls, @selector(class), imp_implementationWithBlock(^{ return moduleClass; }), method_getTypeEncoding(oldImp));
  }

  objc_registerClassPair(proxyClass);
  object_setClass(instance, proxyClass);

  if (moduleClass == [ABI11_0_0RCTUIManager class]) {
    ABI11_0_0RCTProfileHookUIManager((ABI11_0_0RCTUIManager *)instance);
  }
}

void ABI11_0_0RCTProfileHookModules(ABI11_0_0RCTBridge *bridge)
{
  _ABI11_0_0RCTProfilingBridge = bridge;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wtautological-pointer-compare"
  if (ABI11_0_0RCTProfileTrampoline == NULL) {
    return;
  }
#pragma clang diagnostic pop

  ABI11_0_0RCT_PROFILE_BEGIN_EVENT(ABI11_0_0RCTProfileTagAlways, @"ABI11_0_0RCTProfileHookModules", nil);
  for (ABI11_0_0RCTModuleData *moduleData in [bridge valueForKey:@"moduleDataByID"]) {
    // Only hook modules with an instance, to prevent initializing everything
    if ([moduleData hasInstance]) {
      [bridge dispatchBlock:^{
        ABI11_0_0RCTProfileHookInstance(moduleData.instance);
      } queue:moduleData.methodQueue];
    }
  }
  ABI11_0_0RCT_PROFILE_END_EVENT(ABI11_0_0RCTProfileTagAlways, @"");
}

static void ABI11_0_0RCTProfileUnhookInstance(id instance)
{
  if ([instance class] != object_getClass(instance)) {
    object_setClass(instance, [instance class]);
  }
}

void ABI11_0_0RCTProfileUnhookModules(ABI11_0_0RCTBridge *bridge)
{
  _ABI11_0_0RCTProfilingBridge = nil;

  dispatch_group_enter(ABI11_0_0RCTProfileGetUnhookGroup());

  NSDictionary *moduleDataByID = [bridge valueForKey:@"moduleDataByID"];
  for (ABI11_0_0RCTModuleData *moduleData in moduleDataByID) {
    if ([moduleData hasInstance]) {
      ABI11_0_0RCTProfileUnhookInstance(moduleData.instance);
    }
  }

  if ([bridge moduleIsInitialized:[ABI11_0_0RCTUIManager class]]) {
    dispatch_async(dispatch_get_main_queue(), ^{
      for (id view in [bridge.uiManager valueForKey:@"viewRegistry"]) {
        ABI11_0_0RCTProfileUnhookInstance(view);
      }

      dispatch_group_leave(ABI11_0_0RCTProfileGetUnhookGroup());
    });
  }
}

#pragma mark - Private ObjC class only used for the vSYNC CADisplayLink target

@interface ABI11_0_0RCTProfile : NSObject
@end

@implementation ABI11_0_0RCTProfile

+ (void)vsync:(CADisplayLink *)displayLink
{
  ABI11_0_0RCTProfileImmediateEvent(ABI11_0_0RCTProfileTagAlways, @"VSYNC", displayLink.timestamp, 'g');
}

+ (void)reload
{
  [ABI11_0_0RCTProfilingBridge() requestReload];
}

+ (void)toggle:(UIButton *)target
{
  BOOL isProfiling = ABI11_0_0RCTProfileIsProfiling();

  // Start and Stop are switched here, since we're going to toggle isProfiling
  [target setTitle:isProfiling ? @"Start" : @"Stop"
          forState:UIControlStateNormal];

  if (isProfiling) {
    ABI11_0_0RCTProfileEnd(ABI11_0_0RCTProfilingBridge(), ^(NSString *result) {
      NSString *outFile = [NSTemporaryDirectory() stringByAppendingString:@"tmp_trace.json"];
      [result writeToFile:outFile
               atomically:YES
                 encoding:NSUTF8StringEncoding
                    error:nil];
#if !TARGET_OS_TV
      UIActivityViewController *activityViewController = [[UIActivityViewController alloc] initWithActivityItems:@[[NSURL fileURLWithPath:outFile]]
                                                                                           applicationActivities:nil];
      activityViewController.completionHandler = ^(__unused NSString *activityType, __unused BOOL completed) {
        ABI11_0_0RCTProfileControlsWindow.hidden = NO;
      };
      ABI11_0_0RCTProfileControlsWindow.hidden = YES;
      dispatch_async(dispatch_get_main_queue(), ^{
        [[[[[UIApplication sharedApplication] delegate] window] rootViewController] presentViewController:activityViewController
                                                                                                 animated:YES
                                                                                               completion:nil];
      });
#endif
    });
  } else {
    ABI11_0_0RCTProfileInit(ABI11_0_0RCTProfilingBridge());
  }
}

+ (void)drag:(UIPanGestureRecognizer *)gestureRecognizer
{
  CGPoint translation = [gestureRecognizer translationInView:ABI11_0_0RCTProfileControlsWindow];
  ABI11_0_0RCTProfileControlsWindow.center = CGPointMake(
    ABI11_0_0RCTProfileControlsWindow.center.x + translation.x,
    ABI11_0_0RCTProfileControlsWindow.center.y + translation.y
  );
  [gestureRecognizer setTranslation:CGPointMake(0, 0)
                             inView:ABI11_0_0RCTProfileControlsWindow];
}

@end

#pragma mark - Public Functions

dispatch_queue_t ABI11_0_0RCTProfileGetQueue(void)
{
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("com.facebook.ReactABI11_0_0.Profiler", DISPATCH_QUEUE_SERIAL);
  });
  return queue;
}

BOOL ABI11_0_0RCTProfileIsProfiling(void)
{
  return (BOOL)ABI11_0_0RCTProfileProfiling;
}

void ABI11_0_0RCTProfileInit(ABI11_0_0RCTBridge *bridge)
{
  // TODO: enable assert JS thread from any file (and assert here)
  if (ABI11_0_0RCTProfileIsProfiling()) {
    return;
  }

  OSAtomicOr32Barrier(1, &ABI11_0_0RCTProfileProfiling);

  if (callbacks != NULL) {
    size_t buffer_size = 1 << 22;
    systrace_buffer = calloc(1, buffer_size);
    callbacks->start(~((uint64_t)0), systrace_buffer, buffer_size);
  } else {
    NSTimeInterval time = CACurrentMediaTime();
    dispatch_async(ABI11_0_0RCTProfileGetQueue(), ^{
      ABI11_0_0RCTProfileStartTime = time;
      ABI11_0_0RCTProfileOngoingEvents = [NSMutableDictionary new];
      ABI11_0_0RCTProfileInfo = @{
        ABI11_0_0RCTProfileTraceEvents: [NSMutableArray new],
        ABI11_0_0RCTProfileSamples: [NSMutableArray new],
      };
    });
  }

  // Set up thread ordering
  dispatch_async(ABI11_0_0RCTProfileGetQueue(), ^{
    NSArray *orderedThreads = @[@"JS async", @"ABI11_0_0RCTPerformanceLogger", ABI11_0_0RCTJSCThreadName, @(ABI11_0_0RCTUIManagerQueueName), @"main"];
    [orderedThreads enumerateObjectsUsingBlock:^(NSString *thread, NSUInteger idx, __unused BOOL *stop) {
      ABI11_0_0RCTProfileAddEvent(ABI11_0_0RCTProfileTraceEvents,
        @"ph": @"M", // metadata event
        @"name": @"thread_sort_index",
        @"tid": thread,
        @"args": @{ @"sort_index": @(-1000 + (NSInteger)idx) }
      );
    }];
  });

  ABI11_0_0RCTProfileHookModules(bridge);

  ABI11_0_0RCTProfileDisplayLink = [CADisplayLink displayLinkWithTarget:[ABI11_0_0RCTProfile class]
                                                      selector:@selector(vsync:)];
  [ABI11_0_0RCTProfileDisplayLink addToRunLoop:[NSRunLoop mainRunLoop]
                              forMode:NSRunLoopCommonModes];

  [[NSNotificationCenter defaultCenter] postNotificationName:ABI11_0_0RCTProfileDidStartProfiling
                                                      object:bridge];
}

void ABI11_0_0RCTProfileEnd(ABI11_0_0RCTBridge *bridge, void (^callback)(NSString *))
{
  // assert JavaScript thread here again

  if (!ABI11_0_0RCTProfileIsProfiling()) {
    return;
  }

  OSAtomicAnd32Barrier(0, &ABI11_0_0RCTProfileProfiling);

  [[NSNotificationCenter defaultCenter] postNotificationName:ABI11_0_0RCTProfileDidEndProfiling
                                                      object:bridge];

  [ABI11_0_0RCTProfileDisplayLink invalidate];
  ABI11_0_0RCTProfileDisplayLink = nil;

  ABI11_0_0RCTProfileUnhookModules(bridge);

  if (callbacks != NULL) {
    callbacks->stop();

    callback(@(systrace_buffer));
  } else {
    dispatch_async(ABI11_0_0RCTProfileGetQueue(), ^{
      NSString *log = ABI11_0_0RCTJSONStringify(ABI11_0_0RCTProfileInfo, NULL);
      ABI11_0_0RCTProfileEventID = 0;
      ABI11_0_0RCTProfileInfo = nil;
      ABI11_0_0RCTProfileOngoingEvents = nil;

      callback(log);
    });
  }
}

static NSMutableArray<NSArray *> *ABI11_0_0RCTProfileGetThreadEvents(NSThread *thread)
{
  static NSString *const ABI11_0_0RCTProfileThreadEventsKey = @"ABI11_0_0RCTProfileThreadEventsKey";
  NSMutableArray<NSArray *> *threadEvents =
    thread.threadDictionary[ABI11_0_0RCTProfileThreadEventsKey];
  if (!threadEvents) {
    threadEvents = [NSMutableArray new];
    thread.threadDictionary[ABI11_0_0RCTProfileThreadEventsKey] = threadEvents;
  }
  return threadEvents;
}

void _ABI11_0_0RCTProfileBeginEvent(
  NSThread *calleeThread,
  NSTimeInterval time,
  uint64_t tag,
  NSString *name,
  NSDictionary *args
) {
  CHECK();

  if (callbacks != NULL) {
    callbacks->begin_section(tag, name.UTF8String, args.count, ABI11_0_0RCTProfileSystraceArgsFromNSDictionary(args));
    return;
  }

  dispatch_async(ABI11_0_0RCTProfileGetQueue(), ^{
    NSMutableArray *events = ABI11_0_0RCTProfileGetThreadEvents(calleeThread);
    [events addObject:@[
      ABI11_0_0RCTProfileTimestamp(time),
      name,
      ABI11_0_0RCTNullIfNil(args),
    ]];
  });
}

void _ABI11_0_0RCTProfileEndEvent(
  NSThread *calleeThread,
  NSString *threadName,
  NSTimeInterval time,
  uint64_t tag,
  NSString *category
) {
  CHECK();

  if (callbacks != NULL) {
    callbacks->end_section(tag, 0, nil);
    return;
  }

  dispatch_async(ABI11_0_0RCTProfileGetQueue(), ^{
    NSMutableArray<NSArray *> *events = ABI11_0_0RCTProfileGetThreadEvents(calleeThread);
    NSArray *event = events.lastObject;
    [events removeLastObject];

    if (!event) {
      return;
    }

    NSNumber *start = event[0];
    ABI11_0_0RCTProfileAddEvent(ABI11_0_0RCTProfileTraceEvents,
      @"tid": threadName,
      @"name": event[1],
      @"cat": category,
      @"ph": @"X",
      @"ts": start,
      @"dur": @(ABI11_0_0RCTProfileTimestamp(time).doubleValue - start.doubleValue),
      @"args": event[2],
    );
  });
}

NSUInteger ABI11_0_0RCTProfileBeginAsyncEvent(
  uint64_t tag,
  NSString *name,
  NSDictionary *args
) {
  CHECK(0);

  static NSUInteger eventID = 0;

  NSTimeInterval time = CACurrentMediaTime();
  NSUInteger currentEventID = ++eventID;

  if (callbacks != NULL) {
    callbacks->begin_async_section(tag, name.UTF8String, (int)(currentEventID % INT_MAX), args.count, ABI11_0_0RCTProfileSystraceArgsFromNSDictionary(args));
  } else {
    dispatch_async(ABI11_0_0RCTProfileGetQueue(), ^{
      ABI11_0_0RCTProfileOngoingEvents[@(currentEventID)] = @[
        ABI11_0_0RCTProfileTimestamp(time),
        name,
        ABI11_0_0RCTNullIfNil(args),
      ];
    });
  }

  return currentEventID;
}

void ABI11_0_0RCTProfileEndAsyncEvent(
  uint64_t tag,
  NSString *category,
  NSUInteger cookie,
  NSString *name,
  NSString *threadName
) {
  CHECK();

  if (callbacks != NULL) {
    callbacks->end_async_section(tag, name.UTF8String, (int)(cookie % INT_MAX), 0, nil);
    return;
  }

  NSTimeInterval time = CACurrentMediaTime();

  dispatch_async(ABI11_0_0RCTProfileGetQueue(), ^{
    NSArray *event = ABI11_0_0RCTProfileOngoingEvents[@(cookie)];

    if (event) {
      NSNumber *endTimestamp = ABI11_0_0RCTProfileTimestamp(time);

      ABI11_0_0RCTProfileAddEvent(ABI11_0_0RCTProfileTraceEvents,
        @"tid": threadName,
        @"name": event[1],
        @"cat": category,
        @"ph": @"X",
        @"ts": event[0],
        @"dur": @(endTimestamp.doubleValue - [event[0] doubleValue]),
        @"args": event[2],
      );
      [ABI11_0_0RCTProfileOngoingEvents removeObjectForKey:@(cookie)];
    }
  });
}

void ABI11_0_0RCTProfileImmediateEvent(
  uint64_t tag,
  NSString *name,
  NSTimeInterval time,
  char scope
) {
  CHECK();

  if (callbacks != NULL) {
    callbacks->instant_section(tag, name.UTF8String, scope);
    return;
  }

  NSString *threadName = ABI11_0_0RCTCurrentThreadName();

  dispatch_async(ABI11_0_0RCTProfileGetQueue(), ^{
    ABI11_0_0RCTProfileAddEvent(ABI11_0_0RCTProfileTraceEvents,
      @"tid": threadName,
      @"name": name,
      @"ts": ABI11_0_0RCTProfileTimestamp(time),
      @"scope": @(scope),
      @"ph": @"i",
      @"args": ABI11_0_0RCTProfileGetMemoryUsage(),
    );
  });
}

NSUInteger _ABI11_0_0RCTProfileBeginFlowEvent(void)
{
  static NSUInteger flowID = 0;

  CHECK(0);

  NSUInteger cookie = ++flowID;
  if (callbacks != NULL) {
    callbacks->begin_async_flow(1, "flow", (int)cookie);
    return cookie;
  }

  NSTimeInterval time = CACurrentMediaTime();
  NSString *threadName = ABI11_0_0RCTCurrentThreadName();

  dispatch_async(ABI11_0_0RCTProfileGetQueue(), ^{
    ABI11_0_0RCTProfileAddEvent(ABI11_0_0RCTProfileTraceEvents,
      @"tid": threadName,
      @"name": @"flow",
      @"id": @(cookie),
      @"cat": @"flow",
      @"ph": @"s",
      @"ts": ABI11_0_0RCTProfileTimestamp(time),
    );

  });

  return cookie;
}

void _ABI11_0_0RCTProfileEndFlowEvent(NSUInteger cookie)
{
  CHECK();

  if (callbacks != NULL) {
    callbacks->end_async_flow(1, "flow", (int)cookie);
    return;
  }

  NSTimeInterval time = CACurrentMediaTime();
  NSString *threadName = ABI11_0_0RCTCurrentThreadName();

  dispatch_async(ABI11_0_0RCTProfileGetQueue(), ^{
    ABI11_0_0RCTProfileAddEvent(ABI11_0_0RCTProfileTraceEvents,
      @"tid": threadName,
      @"name": @"flow",
      @"id": @(cookie),
      @"cat": @"flow",
      @"ph": @"f",
      @"ts": ABI11_0_0RCTProfileTimestamp(time),
    );
  });
}

void ABI11_0_0RCTProfileSendResult(ABI11_0_0RCTBridge *bridge, NSString *route, NSData *data)
{
  if (![bridge.bundleURL.scheme hasPrefix:@"http"]) {
    ABI11_0_0RCTLogWarn(@"Cannot upload profile information because you're not connected to the packager. The profiling data is still saved in the app container.");
    return;
  }

  NSURL *URL = [NSURL URLWithString:[@"/" stringByAppendingString:route] relativeToURL:bridge.bundleURL];

  NSMutableURLRequest *URLRequest = [NSMutableURLRequest requestWithURL:URL];
  URLRequest.HTTPMethod = @"POST";
  [URLRequest setValue:@"application/json"
    forHTTPHeaderField:@"Content-Type"];

  NSURLSessionTask *task =
    [[NSURLSession sharedSession] uploadTaskWithRequest:URLRequest
                                               fromData:data
                                    completionHandler:
   ^(NSData *responseData, __unused NSURLResponse *response, NSError *error) {
     if (error) {
       ABI11_0_0RCTLogError(@"%@", error.localizedDescription);
     } else {
       NSString *message = [[NSString alloc] initWithData:responseData
                                                 encoding:NSUTF8StringEncoding];

       if (message.length) {
#if !TARGET_OS_TV
         dispatch_async(dispatch_get_main_queue(), ^{
           [[[UIAlertView alloc] initWithTitle:@"Profile"
                                       message:message
                                      delegate:nil
                             cancelButtonTitle:@"OK"
                             otherButtonTitles:nil] show];
         });
#endif
       }
     }
   }];

  [task resume];
}

void ABI11_0_0RCTProfileShowControls(void)
{
  static const CGFloat height = 30;
  static const CGFloat width = 60;

  UIWindow *window = [[UIWindow alloc] initWithFrame:CGRectMake(20, 80, width * 2, height)];
  window.windowLevel = UIWindowLevelAlert + 1000;
  window.hidden = NO;
  window.backgroundColor = [UIColor lightGrayColor];
  window.layer.borderColor = [UIColor grayColor].CGColor;
  window.layer.borderWidth = 1;
  window.alpha = 0.8;

  UIButton *startOrStop = [[UIButton alloc] initWithFrame:CGRectMake(0, 0, width, height)];
  [startOrStop setTitle:ABI11_0_0RCTProfileIsProfiling() ? @"Stop" : @"Start"
               forState:UIControlStateNormal];
  [startOrStop addTarget:[ABI11_0_0RCTProfile class] action:@selector(toggle:) forControlEvents:UIControlEventTouchUpInside];
  startOrStop.titleLabel.font = [UIFont systemFontOfSize:12];

  UIButton *reload = [[UIButton alloc] initWithFrame:CGRectMake(width, 0, width, height)];
  [reload setTitle:@"Reload" forState:UIControlStateNormal];
  [reload addTarget:[ABI11_0_0RCTProfile class] action:@selector(reload) forControlEvents:UIControlEventTouchUpInside];
  reload.titleLabel.font = [UIFont systemFontOfSize:12];

  [window addSubview:startOrStop];
  [window addSubview:reload];

  UIPanGestureRecognizer *gestureRecognizer = [[UIPanGestureRecognizer alloc] initWithTarget:[ABI11_0_0RCTProfile class]
                                                                                      action:@selector(drag:)];
  [window addGestureRecognizer:gestureRecognizer];

  ABI11_0_0RCTProfileControlsWindow = window;
}

void ABI11_0_0RCTProfileHideControls(void)
{
  ABI11_0_0RCTProfileControlsWindow.hidden = YES;
  ABI11_0_0RCTProfileControlsWindow = nil;
}

#endif
