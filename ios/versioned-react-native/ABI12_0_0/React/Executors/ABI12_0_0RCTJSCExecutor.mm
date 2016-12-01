/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTJSCExecutor.h"

#import <cinttypes>
#import <memory>
#import <pthread.h>
#import <string>
#import <unordered_map>

#import <UIKit/UIDevice.h>

#import "ABI12_0_0RCTAssert.h"
#import "ABI12_0_0RCTBridge+Private.h"
#import "ABI12_0_0RCTDefines.h"
#import "ABI12_0_0RCTDevMenu.h"
#import "ABI12_0_0RCTJavaScriptLoader.h"
#import "ABI12_0_0RCTLog.h"
#import "ABI12_0_0RCTProfile.h"
#import "ABI12_0_0RCTPerformanceLogger.h"
#import "ABI12_0_0RCTUtils.h"
#import "ABI12_0_0RCTJSCProfiler.h"
#import "ABI12_0_0RCTRedBox.h"
#import "ABI12_0_0RCTSourceCode.h"
#import "ABI12_0_0RCTJSCWrapper.h"
#import "ABI12_0_0RCTJSCErrorHandling.h"

NSString *const ABI12_0_0RCTJSCThreadName = @"com.facebook.ReactABI12_0_0.JavaScript";
NSString *const ABI12_0_0RCTJavaScriptContextCreatedNotification = @"ABI12_0_0RCTJavaScriptContextCreatedNotification";
ABI12_0_0RCT_EXTERN NSString *const ABI12_0_0RCTFBJSContextClassKey = @"_ABI12_0_0RCTFBJSContextClassKey";
ABI12_0_0RCT_EXTERN NSString *const ABI12_0_0RCTFBJSValueClassKey = @"_ABI12_0_0RCTFBJSValueClassKey";

static NSString *const ABI12_0_0RCTJSCProfilerEnabledDefaultsKey = @"ABI12_0_0RCTJSCProfilerEnabled";

struct __attribute__((packed)) ModuleData {
  uint32_t offset;
  uint32_t size;
};

using file_ptr = std::unique_ptr<FILE, decltype(&fclose)>;
using memory_ptr = std::unique_ptr<void, decltype(&free)>;

struct RandomAccessBundleData {
  file_ptr bundle;
  size_t baseOffset;
  size_t numTableEntries;
  std::unique_ptr<ModuleData[]> table;
  RandomAccessBundleData(): bundle(nullptr, fclose) {}
};

struct RandomAccessBundleStartupCode {
  memory_ptr code;
  size_t size;
  static RandomAccessBundleStartupCode empty() {
    return RandomAccessBundleStartupCode{memory_ptr(nullptr, free), 0};
  };
  bool isEmpty() {
    return !code;
  }
};

#if ABI12_0_0RCT_PROFILE
@interface ABI12_0_0RCTCookieMap : NSObject
{
  @package
  std::unordered_map<NSUInteger, NSUInteger> _cookieMap;
}
@end
@implementation ABI12_0_0RCTCookieMap @end
#endif

struct ABI12_0_0RCTJSContextData {
  BOOL useCustomJSCLibrary;
  NSThread *javaScriptThread;
  JSContext *context;
  ABI12_0_0RCTJSCWrapper *jscWrapper;
};

@interface ABI12_0_0RCTJSContextProvider ()
/** May only be called once, or deadlock will result. */
- (ABI12_0_0RCTJSContextData)data;
@end

@interface ABI12_0_0RCTJavaScriptContext : NSObject <ABI12_0_0RCTInvalidating>

@property (nonatomic, strong, readonly) JSContext *context;

- (instancetype)initWithJSContext:(JSContext *)context
                         onThread:(NSThread *)javaScriptThread NS_DESIGNATED_INITIALIZER;

@end

@implementation ABI12_0_0RCTJavaScriptContext
{
  ABI12_0_0RCTJavaScriptContext *_selfReference;
  NSThread *_javaScriptThread;
}

- (instancetype)initWithJSContext:(JSContext *)context
                         onThread:(NSThread *)javaScriptThread
{
  if ((self = [super init])) {
    _context = context;
    _context.name = @"ABI12_0_0RCTJSContext";
    _javaScriptThread = javaScriptThread;

    /**
     * Explicitly introduce a retain cycle here - The ABI12_0_0RCTJSCExecutor might
     * be deallocated while there's still work enqueued in the JS thread, so
     * we wouldn't be able kill the JSContext. Instead we create this retain
     * cycle, and enqueue the -invalidate message in this object, it then
     * releases the JSContext, breaks the cycle and stops the runloop.
     */
    _selfReference = self;
  }
  return self;
}

ABI12_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (BOOL)isValid
{
  return _context != nil;
}

- (void)invalidate
{
  if (self.isValid) {
    ABI12_0_0RCTAssertThread(_javaScriptThread, @"Must be invalidated on JS thread.");

    _context = nil;
    _selfReference = nil;
    _javaScriptThread = nil;

    CFRunLoopStop([[NSRunLoop currentRunLoop] getCFRunLoop]);
  }
}

@end

@implementation ABI12_0_0RCTJSCExecutor
{
  // Set at init time:
  BOOL _useCustomJSCLibrary;
  NSThread *_javaScriptThread;

  // Set at setUp time:
  ABI12_0_0RCTPerformanceLogger *_performanceLogger;
  ABI12_0_0RCTJSCWrapper *_jscWrapper;
  ABI12_0_0RCTJavaScriptContext *_context;

  // Set as needed:
  RandomAccessBundleData _randomAccessBundle;
  JSValueRef _batchedBridgeRef;
}

@synthesize valid = _valid;
@synthesize bridge = _bridge;

ABI12_0_0RCT_EXPORT_MODULE()

#if ABI12_0_0RCT_DEV

static void ABI12_0_0RCTInstallJSCProfiler(ABI12_0_0RCTBridge *bridge, JSContextRef context)
{
  if (ABI12_0_0RCTJSCProfilerIsSupported()) {
    [bridge.devMenu addItem:[ABI12_0_0RCTDevMenuItem toggleItemWithKey:ABI12_0_0RCTJSCProfilerEnabledDefaultsKey title:@"Start Profiling" selectedTitle:@"Stop Profiling" handler:^(BOOL shouldStart) {
      if (shouldStart != ABI12_0_0RCTJSCProfilerIsProfiling(context)) {
        if (shouldStart) {
          ABI12_0_0RCTJSCProfilerStart(context);
        } else {
          NSString *outputFile = ABI12_0_0RCTJSCProfilerStop(context);
          NSData *profileData = [NSData dataWithContentsOfFile:outputFile options:NSDataReadingMappedIfSafe error:NULL];
          ABI12_0_0RCTProfileSendResult(bridge, @"cpu-profile", profileData);
        }
      }
    }]];
  }
}

#endif

+ (void)runRunLoopThread
{
  @autoreleasepool {
    // copy thread name to pthread name
    pthread_setname_np([NSThread currentThread].name.UTF8String);

    // Set up a dummy runloop source to avoid spinning
    CFRunLoopSourceContext noSpinCtx = {0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL};
    CFRunLoopSourceRef noSpinSource = CFRunLoopSourceCreate(NULL, 0, &noSpinCtx);
    CFRunLoopAddSource(CFRunLoopGetCurrent(), noSpinSource, kCFRunLoopDefaultMode);
    CFRelease(noSpinSource);

    // run the run loop
    while (kCFRunLoopRunStopped != CFRunLoopRunInMode(kCFRunLoopDefaultMode, ((NSDate *)[NSDate distantFuture]).timeIntervalSinceReferenceDate, NO)) {
      ABI12_0_0RCTAssert(NO, @"not reached assertion"); // runloop spun. that's bad.
    }
  }
}

static NSThread *newJavaScriptThread(void)
{
  NSThread *javaScriptThread = [[NSThread alloc] initWithTarget:[ABI12_0_0RCTJSCExecutor class]
                                                       selector:@selector(runRunLoopThread)
                                                         object:nil];
  javaScriptThread.name = ABI12_0_0RCTJSCThreadName;
  if ([javaScriptThread respondsToSelector:@selector(setQualityOfService:)]) {
    [javaScriptThread setQualityOfService:NSOperationQualityOfServiceUserInteractive];
  } else {
    javaScriptThread.threadPriority = [NSThread mainThread].threadPriority;
  }
  [javaScriptThread start];
  return javaScriptThread;
}

- (void)setBridge:(ABI12_0_0RCTBridge *)bridge
{
  _bridge = bridge;
  _performanceLogger = [bridge performanceLogger];
}

- (instancetype)init
{
  return [self initWithUseCustomJSCLibrary:NO];
}

- (instancetype)initWithUseCustomJSCLibrary:(BOOL)useCustomJSCLibrary
{
  ABI12_0_0RCT_PROFILE_BEGIN_EVENT(0, @"-[ABI12_0_0RCTJSCExecutor init]", nil);

  if (self = [super init]) {
    _useCustomJSCLibrary = useCustomJSCLibrary;
    _valid = YES;
    _javaScriptThread = newJavaScriptThread();
  }

  ABI12_0_0RCT_PROFILE_END_EVENT(ABI12_0_0RCTProfileTagAlways, @"");
  return self;
}

+ (instancetype)initializedExecutorWithContextProvider:(ABI12_0_0RCTJSContextProvider *)JSContextProvider
                                     applicationScript:(NSData *)applicationScript
                                             sourceURL:(NSURL *)sourceURL
                                             JSContext:(JSContext **)JSContext
                                                 error:(NSError **)error
{
  const ABI12_0_0RCTJSContextData data = JSContextProvider.data;
  if (JSContext) {
    *JSContext = data.context;
  }
  ABI12_0_0RCTJSCExecutor *executor = [[ABI12_0_0RCTJSCExecutor alloc] initWithJSContextData:data];
  if (applicationScript && ![executor _synchronouslyExecuteApplicationScript:applicationScript sourceURL:sourceURL JSContext:data.context error:error]) {
    return nil; // error has been set by _synchronouslyExecuteApplicationScript:
  }
  return executor;
}

- (instancetype)initWithJSContextData:(const ABI12_0_0RCTJSContextData &)data
{
  if (self = [super init]) {
    _useCustomJSCLibrary = data.useCustomJSCLibrary;
    _valid = YES;
    _javaScriptThread = data.javaScriptThread;
    _jscWrapper = data.jscWrapper;
    _context = [[ABI12_0_0RCTJavaScriptContext alloc] initWithJSContext:data.context onThread:_javaScriptThread];
  }
  return self;
}

- (BOOL)_synchronouslyExecuteApplicationScript:(NSData *)script
                                     sourceURL:(NSURL *)sourceURL
                                     JSContext:(JSContext *)context
                                         error:(NSError **)error
{
  BOOL isRAMBundle = NO;
  script = loadPossiblyBundledApplicationScript(script, sourceURL, _performanceLogger, isRAMBundle, _randomAccessBundle, error);
  if (!script) {
    return NO;
  }
  if (isRAMBundle) {
    registerNativeRequire(context, self);
  }
  NSError *returnedError = executeApplicationScript(script, sourceURL, _jscWrapper, _performanceLogger, _context.context.JSGlobalContextRef);
  if (returnedError) {
    if (error) {
      *error = returnedError;
    }
    return NO;
  } else {
    return YES;
  }
}

- (ABI12_0_0RCTJavaScriptContext *)context
{
  ABI12_0_0RCTAssertThread(_javaScriptThread, @"Must be called on JS thread.");
  if (!self.isValid) {
    return nil;
  }
  ABI12_0_0RCTAssert(_context != nil, @"Fetching context while valid, but before it is created");
  return _context;
}

- (void)setUp
{
#if ABI12_0_0RCT_PROFILE
#ifndef __clang_analyzer__
  _bridge.flowIDMap = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
#endif
  _bridge.flowIDMapLock = [NSLock new];

  for (NSString *event in @[ABI12_0_0RCTProfileDidStartProfiling, ABI12_0_0RCTProfileDidEndProfiling]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(toggleProfilingFlag:)
                                                 name:event
                                               object:nil];
  }
#endif

  [self executeBlockOnJavaScriptQueue:^{
    if (!self.valid) {
      return;
    }

    JSContext *context = nil;
    if (self->_jscWrapper) {
      ABI12_0_0RCTAssert(self->_context != nil, @"If wrapper was pre-initialized, context should be too");
      context = self->_context.context;
    } else {
      [self->_performanceLogger markStartForTag:ABI12_0_0RCTPLJSCWrapperOpenLibrary];
      self->_jscWrapper = ABI12_0_0RCTJSCWrapperCreate(self->_useCustomJSCLibrary);
      [self->_performanceLogger markStopForTag:ABI12_0_0RCTPLJSCWrapperOpenLibrary];

      ABI12_0_0RCTAssert(self->_context == nil, @"Didn't expect to set up twice");
      context = [self->_jscWrapper->JSContext new];
      self->_context = [[ABI12_0_0RCTJavaScriptContext alloc] initWithJSContext:context onThread:self->_javaScriptThread];
      [[NSNotificationCenter defaultCenter] postNotificationName:ABI12_0_0RCTJavaScriptContextCreatedNotification
                                                          object:context];

      installBasicSynchronousHooksOnContext(context);
    }

    NSMutableDictionary *threadDictionary = [[NSThread currentThread] threadDictionary];
    if (!threadDictionary[ABI12_0_0RCTFBJSContextClassKey] || !threadDictionary[ABI12_0_0RCTFBJSValueClassKey]) {
      threadDictionary[ABI12_0_0RCTFBJSContextClassKey] = self->_jscWrapper->JSContext;
      threadDictionary[ABI12_0_0RCTFBJSValueClassKey] = self->_jscWrapper->JSValue;
    }

    __weak ABI12_0_0RCTJSCExecutor *weakSelf = self;

    context[@"nativeRequireModuleConfig"] = ^NSArray *(NSString *moduleName) {
      ABI12_0_0RCTJSCExecutor *strongSelf = weakSelf;
      if (!strongSelf.valid) {
        return nil;
      }

      ABI12_0_0RCT_PROFILE_BEGIN_EVENT(ABI12_0_0RCTProfileTagAlways, @"nativeRequireModuleConfig", @{ @"moduleName": moduleName });
      NSArray *result = [strongSelf->_bridge configForModuleName:moduleName];
      ABI12_0_0RCT_PROFILE_END_EVENT(ABI12_0_0RCTProfileTagAlways, @"js_call,config");
      return ABI12_0_0RCTNullIfNil(result);
    };

    context[@"nativeFlushQueueImmediate"] = ^(NSArray<NSArray *> *calls){
      ABI12_0_0RCTJSCExecutor *strongSelf = weakSelf;
      if (!strongSelf.valid || !calls) {
        return;
      }

      ABI12_0_0RCT_PROFILE_BEGIN_EVENT(ABI12_0_0RCTProfileTagAlways, @"nativeFlushQueueImmediate", nil);
      [strongSelf->_bridge handleBuffer:calls batchEnded:NO];
      ABI12_0_0RCT_PROFILE_END_EVENT(ABI12_0_0RCTProfileTagAlways, @"js_call");
    };

    context[@"nativeCallSyncHook"] = ^id(NSUInteger module, NSUInteger method, NSArray *args) {
      ABI12_0_0RCTJSCExecutor *strongSelf = weakSelf;
      if (!strongSelf.valid) {
        return nil;
      }

      ABI12_0_0RCT_PROFILE_BEGIN_EVENT(ABI12_0_0RCTProfileTagAlways, @"nativeCallSyncHook", nil);
      id result = [strongSelf->_bridge callNativeModule:module method:method params:args];
      ABI12_0_0RCT_PROFILE_END_EVENT(ABI12_0_0RCTProfileTagAlways, @"js_call,config");
      return result;
    };

#if ABI12_0_0RCT_PROFILE
    __weak ABI12_0_0RCTBridge *weakBridge = self->_bridge;
    context[@"nativeTraceBeginAsyncFlow"] = ^(__unused uint64_t tag, __unused NSString *name, int64_t cookie) {
      if (ABI12_0_0RCTProfileIsProfiling()) {
        [weakBridge.flowIDMapLock lock];
        NSUInteger newCookie = _ABI12_0_0RCTProfileBeginFlowEvent();
        CFDictionarySetValue(weakBridge.flowIDMap, (const void *)cookie, (const void *)newCookie);
        [weakBridge.flowIDMapLock unlock];
      }
    };

    context[@"nativeTraceEndAsyncFlow"] = ^(__unused uint64_t tag, __unused NSString *name, int64_t cookie) {
      if (ABI12_0_0RCTProfileIsProfiling()) {
        [weakBridge.flowIDMapLock lock];
        NSUInteger newCookie = (NSUInteger)CFDictionaryGetValue(weakBridge.flowIDMap, (const void *)cookie);
        _ABI12_0_0RCTProfileEndFlowEvent(newCookie);
        CFDictionaryRemoveValue(weakBridge.flowIDMap, (const void *)cookie);
        [weakBridge.flowIDMapLock unlock];
      }
    };
#endif

#if ABI12_0_0RCT_DEV
    ABI12_0_0RCTInstallJSCProfiler(self->_bridge, context.JSGlobalContextRef);

    // Inject handler used by HMR
    context[@"nativeInjectHMRUpdate"] = ^(NSString *sourceCode, NSString *sourceCodeURL) {
      ABI12_0_0RCTJSCExecutor *strongSelf = weakSelf;
      if (!strongSelf.valid) {
        return;
      }

      ABI12_0_0RCTJSCWrapper *jscWrapper = strongSelf->_jscWrapper;
      JSStringRef execJSString = jscWrapper->JSStringCreateWithUTF8CString(sourceCode.UTF8String);
      JSStringRef jsURL = jscWrapper->JSStringCreateWithUTF8CString(sourceCodeURL.UTF8String);
      jscWrapper->JSEvaluateScript(strongSelf->_context.context.JSGlobalContextRef, execJSString, NULL, jsURL, 0, NULL);
      jscWrapper->JSStringRelease(jsURL);
      jscWrapper->JSStringRelease(execJSString);
    };
#endif
  }];
}

/** Installs synchronous hooks that don't require a weak reference back to the ABI12_0_0RCTJSCExecutor. */
static void installBasicSynchronousHooksOnContext(JSContext *context)
{
  context[@"nativeLoggingHook"] = ^(NSString *message, NSNumber *logLevel) {
    ABI12_0_0RCTLogLevel level = ABI12_0_0RCTLogLevelInfo;
    if (logLevel) {
      level = MAX(level, (ABI12_0_0RCTLogLevel)logLevel.integerValue);
    }

    _ABI12_0_0RCTLogJavaScriptInternal(level, message);
  };
  context[@"nativePerformanceNow"] = ^{
    return @(CACurrentMediaTime() * 1000);
  };
#if ABI12_0_0RCT_PROFILE
  if (ABI12_0_0RCTProfileIsProfiling()) {
    // Cheating, since it's not a "hook", but meh
    context[@"__ABI12_0_0RCTProfileIsProfiling"] = @YES;
  }
  context[@"nativeTraceBeginSection"] = ^(NSNumber *tag, NSString *profileName, NSDictionary *args) {
    static int profileCounter = 1;
    if (!profileName) {
      profileName = [NSString stringWithFormat:@"Profile %d", profileCounter++];
    }

    ABI12_0_0RCT_PROFILE_BEGIN_EVENT(tag.longLongValue, profileName, args);
  };
  context[@"nativeTraceEndSection"] = ^(NSNumber *tag) {
    ABI12_0_0RCT_PROFILE_END_EVENT(tag.longLongValue, @"console");
  };
  ABI12_0_0RCTCookieMap *cookieMap = [ABI12_0_0RCTCookieMap new];
  context[@"nativeTraceBeginAsyncSection"] = ^(uint64_t tag, NSString *name, NSUInteger cookie) {
    NSUInteger newCookie = ABI12_0_0RCTProfileBeginAsyncEvent(tag, name, nil);
    cookieMap->_cookieMap.insert({cookie, newCookie});
  };
  context[@"nativeTraceEndAsyncSection"] = ^(uint64_t tag, NSString *name, NSUInteger cookie) {
    NSUInteger newCookie = 0;
    const auto &it = cookieMap->_cookieMap.find(cookie);
    if (it != cookieMap->_cookieMap.end()) {
      newCookie = it->second;
      cookieMap->_cookieMap.erase(it);
    }
    ABI12_0_0RCTProfileEndAsyncEvent(tag, @"js,async", newCookie, name, @"JS async");
  };
#endif
}

- (void)toggleProfilingFlag:(NSNotification *)notification
{
  [self executeBlockOnJavaScriptQueue:^{
    BOOL enabled = [notification.name isEqualToString:ABI12_0_0RCTProfileDidStartProfiling];
    [self->_bridge enqueueJSCall:@"Systrace"
                          method:@"setEnabled"
                            args:@[enabled ? @YES : @NO]
                      completion:NULL];
  }];
}

- (void)invalidate
{
  if (!self.isValid) {
    return;
  }

  _valid = NO;

#if ABI12_0_0RCT_PROFILE
  [[NSNotificationCenter defaultCenter] removeObserver:self];
#endif
}

- (NSString *)contextName
{
  return [_context.context name];
}

ABI12_0_0RCT_EXPORT_METHOD(setContextName:(nonnull NSString *)contextName)
{
  [_context.context setName:contextName];
}

- (void)dealloc
{
  [self invalidate];

  [_context performSelector:@selector(invalidate)
                   onThread:_javaScriptThread
                 withObject:nil
              waitUntilDone:NO];
  _context = nil;

  _randomAccessBundle.bundle.reset();
  _randomAccessBundle.table.reset();

  if (_jscWrapper) {
    ABI12_0_0RCTJSCWrapperRelease(_jscWrapper);
    _jscWrapper = NULL;
  }
}

- (void)flushedQueue:(ABI12_0_0RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"flushedQueue" arguments:@[] unwrapResult:YES callback:onComplete];
}

- (void)_callFunctionOnModule:(NSString *)module
                       method:(NSString *)method
                    arguments:(NSArray *)args
                  returnValue:(BOOL)returnValue
                 unwrapResult:(BOOL)unwrapResult
                     callback:(ABI12_0_0RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  NSString *bridgeMethod = returnValue ? @"callFunctionReturnFlushedQueue" : @"callFunctionReturnResultAndFlushedQueue";
  [self _executeJSCall:bridgeMethod arguments:@[module, method, args] unwrapResult:unwrapResult callback:onComplete];
}

- (void)callFunctionOnModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args callback:(ABI12_0_0RCTJavaScriptCallback)onComplete
{
  [self _callFunctionOnModule:module method:method arguments:args returnValue:YES unwrapResult:YES callback:onComplete];
}

- (void)callFunctionOnModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args jsValueCallback:(ABI12_0_0RCTJavaScriptValueCallback)onComplete
{
  [self _callFunctionOnModule:module method:method arguments:args returnValue:NO unwrapResult:NO callback:onComplete];
}

- (void)invokeCallbackID:(NSNumber *)cbID
               arguments:(NSArray *)args
                callback:(ABI12_0_0RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"invokeCallbackAndReturnFlushedQueue" arguments:@[cbID, args] unwrapResult:YES callback:onComplete];
}

- (void)_executeJSCall:(NSString *)method
             arguments:(NSArray *)arguments
          unwrapResult:(BOOL)unwrapResult
              callback:(ABI12_0_0RCTJavaScriptCallback)onComplete
{
  ABI12_0_0RCTAssert(onComplete != nil, @"onComplete block should not be nil");
  __weak ABI12_0_0RCTJSCExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:^{
    ABI12_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }

    ABI12_0_0RCT_PROFILE_BEGIN_EVENT(0, @"executeJSCall", (@{@"method": method, @"args": arguments}));

    ABI12_0_0RCTJSCWrapper *jscWrapper = strongSelf->_jscWrapper;
    JSContext *context = strongSelf->_context.context;
    JSGlobalContextRef contextJSRef = context.JSGlobalContextRef;

    // get the BatchedBridge object
    JSValueRef errorJSRef = NULL;
    JSValueRef batchedBridgeRef = strongSelf->_batchedBridgeRef;
    if (!batchedBridgeRef) {
      JSStringRef moduleNameJSStringRef = jscWrapper->JSStringCreateWithUTF8CString("__fbBatchedBridge");
      JSObjectRef globalObjectJSRef = jscWrapper->JSContextGetGlobalObject(contextJSRef);
      batchedBridgeRef = jscWrapper->JSObjectGetProperty(contextJSRef, globalObjectJSRef, moduleNameJSStringRef, &errorJSRef);
      jscWrapper->JSStringRelease(moduleNameJSStringRef);
      strongSelf->_batchedBridgeRef = batchedBridgeRef;
    }

    NSError *error;
    JSValueRef resultJSRef = NULL;
    if (batchedBridgeRef != NULL && errorJSRef == NULL && !jscWrapper->JSValueIsUndefined(contextJSRef, batchedBridgeRef)) {
      // get method
      JSStringRef methodNameJSStringRef = jscWrapper->JSStringCreateWithCFString((__bridge CFStringRef)method);
      JSValueRef methodJSRef = jscWrapper->JSObjectGetProperty(contextJSRef, (JSObjectRef)batchedBridgeRef, methodNameJSStringRef, &errorJSRef);
      jscWrapper->JSStringRelease(methodNameJSStringRef);

      if (methodJSRef != NULL && errorJSRef == NULL && !jscWrapper->JSValueIsUndefined(contextJSRef, methodJSRef)) {
        JSValueRef jsArgs[arguments.count];
        for (NSUInteger i = 0; i < arguments.count; i++) {
          jsArgs[i] = [jscWrapper->JSValue valueWithObject:arguments[i] inContext:context].JSValueRef;
        }
        resultJSRef = jscWrapper->JSObjectCallAsFunction(contextJSRef, (JSObjectRef)methodJSRef, (JSObjectRef)batchedBridgeRef, arguments.count, jsArgs, &errorJSRef);
      } else {
        if (!errorJSRef && jscWrapper->JSValueIsUndefined(contextJSRef, methodJSRef)) {
          error = ABI12_0_0RCTErrorWithMessage([NSString stringWithFormat:@"Unable to execute JS call: method %@ is undefined", method]);
        }
      }
    } else {
      if (!errorJSRef && jscWrapper->JSValueIsUndefined(contextJSRef, batchedBridgeRef)) {
        error = ABI12_0_0RCTErrorWithMessage(@"Unable to execute JS call: __fbBatchedBridge is undefined");
      }
    }

    id objcValue;
    if (errorJSRef || error) {
      if (!error) {
        error = ABI12_0_0RCTNSErrorFromJSError([jscWrapper->JSValue valueWithJSValueRef:errorJSRef inContext:context]);
      }
    } else {
      // We often return `null` from JS when there is nothing for native side. [JSValue toValue]
      // returns [NSNull null] in this case, which we don't want.
      if (!jscWrapper->JSValueIsNull(contextJSRef, resultJSRef)) {
        JSValue *result = [jscWrapper->JSValue valueWithJSValueRef:resultJSRef inContext:context];
        objcValue = unwrapResult ? [result toObject] : result;
      }
    }

    ABI12_0_0RCT_PROFILE_END_EVENT(0, @"js_call");

    onComplete(objcValue, error);
  }];
}

- (void)executeApplicationScript:(NSData *)script
                       sourceURL:(NSURL *)sourceURL
                      onComplete:(ABI12_0_0RCTJavaScriptCompleteBlock)onComplete
{
  ABI12_0_0RCTAssertParam(script);
  ABI12_0_0RCTAssertParam(sourceURL);

  BOOL isRAMBundle = NO;
  {
    NSError *error;
    script = loadPossiblyBundledApplicationScript(script, sourceURL, _performanceLogger, isRAMBundle, _randomAccessBundle, &error);
    if (script == nil) {
      if (onComplete) {
        onComplete(error);
      }
      return;
    }
  }

  ABI12_0_0RCTProfileBeginFlowEvent();
  [self executeBlockOnJavaScriptQueue:^{
    ABI12_0_0RCTProfileEndFlowEvent();
    if (!self.isValid) {
      return;
    }

    if (isRAMBundle) {
      registerNativeRequire(self.context.context, self);
    }

    NSError *error = executeApplicationScript(script, sourceURL, self->_jscWrapper, self->_performanceLogger,
                                              self->_context.context.JSGlobalContextRef);
    if (onComplete) {
      onComplete(error);
    }
  }];
}

static NSData *loadPossiblyBundledApplicationScript(NSData *script, NSURL *sourceURL,
                                                    ABI12_0_0RCTPerformanceLogger *performanceLogger,
                                                    BOOL &isRAMBundle, RandomAccessBundleData &randomAccessBundle,
                                                    NSError **error)
{
  ABI12_0_0RCT_PROFILE_BEGIN_EVENT(0, @"executeApplicationScript / prepare bundle", nil);

  // The RAM bundle has a magic number in the 4 first bytes `(0xFB0BD1E5)`.
  uint32_t magicNumber = 0;
  [script getBytes:&magicNumber length:sizeof(magicNumber)];
  isRAMBundle = NSSwapLittleIntToHost(magicNumber) == ABI12_0_0RCTRAMBundleMagicNumber;
  if (isRAMBundle) {
    [performanceLogger markStartForTag:ABI12_0_0RCTPLRAMBundleLoad];
    script = loadRAMBundle(sourceURL, error, randomAccessBundle);
    [performanceLogger markStopForTag:ABI12_0_0RCTPLRAMBundleLoad];
    [performanceLogger setValue:script.length forTag:ABI12_0_0RCTPLRAMStartupCodeSize];
  } else {
    // JSStringCreateWithUTF8CString expects a null terminated C string.
    // RAM Bundling already provides a null terminated one.
    NSMutableData *nullTerminatedScript = [NSMutableData dataWithCapacity:script.length + 1];
    [nullTerminatedScript appendData:script];
    [nullTerminatedScript appendBytes:"" length:1];
    script = nullTerminatedScript;
  }

  ABI12_0_0RCT_PROFILE_END_EVENT(ABI12_0_0RCTProfileTagAlways, @"");
  return script;
}

static void registerNativeRequire(JSContext *context, ABI12_0_0RCTJSCExecutor *executor)
{
  __weak ABI12_0_0RCTJSCExecutor *weakExecutor = executor;
  context[@"nativeRequire"] = ^(NSNumber *moduleID) { [weakExecutor _nativeRequire:moduleID]; };
}

static NSError *executeApplicationScript(NSData *script, NSURL *sourceURL, ABI12_0_0RCTJSCWrapper *jscWrapper,
                                         ABI12_0_0RCTPerformanceLogger *performanceLogger, JSGlobalContextRef ctx)
{
  ABI12_0_0RCT_PROFILE_BEGIN_EVENT(0, @"executeApplicationScript / execute script", (@{
    @"url": sourceURL.absoluteString, @"size": @(script.length)
  }));
  [performanceLogger markStartForTag:ABI12_0_0RCTPLScriptExecution];
  JSValueRef jsError = NULL;
  JSStringRef execJSString = jscWrapper->JSStringCreateWithUTF8CString((const char *)script.bytes);
  JSStringRef bundleURL = jscWrapper->JSStringCreateWithUTF8CString(sourceURL.absoluteString.UTF8String);
  jscWrapper->JSEvaluateScript(ctx, execJSString, NULL, bundleURL, 0, &jsError);
  jscWrapper->JSStringRelease(bundleURL);
  jscWrapper->JSStringRelease(execJSString);
  [performanceLogger markStopForTag:ABI12_0_0RCTPLScriptExecution];

  NSError *error = jsError ? ABI12_0_0RCTNSErrorFromJSErrorRef(jsError, ctx, jscWrapper) : nil;
  ABI12_0_0RCT_PROFILE_END_EVENT(0, @"js_call");
  return error;
}

- (void)executeBlockOnJavaScriptQueue:(dispatch_block_t)block
{
  if ([NSThread currentThread] != _javaScriptThread) {
    [self performSelector:@selector(executeBlockOnJavaScriptQueue:)
                 onThread:_javaScriptThread withObject:block waitUntilDone:NO];
  } else {
    block();
  }
}

- (void)executeAsyncBlockOnJavaScriptQueue:(dispatch_block_t)block
{
  [self performSelector:@selector(executeBlockOnJavaScriptQueue:)
               onThread:_javaScriptThread
             withObject:block
          waitUntilDone:NO];
}

- (void)injectJSONText:(NSString *)script
   asGlobalObjectNamed:(NSString *)objectName
              callback:(ABI12_0_0RCTJavaScriptCompleteBlock)onComplete
{
  if (ABI12_0_0RCT_DEBUG) {
    ABI12_0_0RCTAssert(ABI12_0_0RCTJSONParse(script, NULL) != nil, @"%@ wasn't valid JSON!", script);
  }

  __weak ABI12_0_0RCTJSCExecutor *weakSelf = self;
  ABI12_0_0RCTProfileBeginFlowEvent();
  [self executeBlockOnJavaScriptQueue:^{
    ABI12_0_0RCTProfileEndFlowEvent();

    ABI12_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }

    ABI12_0_0RCT_PROFILE_BEGIN_EVENT(0, @"injectJSONText", @{@"objectName": objectName});
    ABI12_0_0RCTJSCWrapper *jscWrapper = strongSelf->_jscWrapper;
    JSStringRef execJSString = jscWrapper->JSStringCreateWithCFString((__bridge CFStringRef)script);
    JSGlobalContextRef ctx = strongSelf->_context.context.JSGlobalContextRef;
    JSValueRef valueToInject = jscWrapper->JSValueMakeFromJSONString(ctx, execJSString);
    jscWrapper->JSStringRelease(execJSString);

    NSError *error;
    if (!valueToInject) {
      NSString *errorMessage = [NSString stringWithFormat:@"Can't make JSON value from script '%@'", script];
      error = [NSError errorWithDomain:ABI12_0_0RCTErrorDomain code:2 userInfo:@{NSLocalizedDescriptionKey: errorMessage}];
      ABI12_0_0RCTLogError(@"%@", errorMessage);
    } else {
      JSObjectRef globalObject = jscWrapper->JSContextGetGlobalObject(ctx);
      JSStringRef JSName = jscWrapper->JSStringCreateWithCFString((__bridge CFStringRef)objectName);
      JSValueRef jsError = NULL;
      jscWrapper->JSObjectSetProperty(ctx, globalObject, JSName, valueToInject, kJSPropertyAttributeNone, &jsError);
      jscWrapper->JSStringRelease(JSName);

      if (jsError) {
        error = ABI12_0_0RCTNSErrorFromJSErrorRef(jsError, ctx, jscWrapper);
      }
    }
    ABI12_0_0RCT_PROFILE_END_EVENT(0, @"js_call,json_call");

    if (onComplete) {
      onComplete(error);
    }
  }];
}

static bool readRandomAccessModule(const RandomAccessBundleData &bundleData, size_t offset, size_t size, char *data)
{
  return fseek(bundleData.bundle.get(), offset + bundleData.baseOffset, SEEK_SET) == 0 &&
         fread(data, 1, size, bundleData.bundle.get()) == size;
}

static void executeRandomAccessModule(ABI12_0_0RCTJSCExecutor *executor, uint32_t moduleID, size_t offset, size_t size)
{
  auto data = std::make_unique<char[]>(size);
  if (!readRandomAccessModule(executor->_randomAccessBundle, offset, size, data.get())) {
    ABI12_0_0RCTFatal(ABI12_0_0RCTErrorWithMessage(@"Error loading RAM module"));
    return;
  }

  char url[14]; // 10 = maximum decimal digits in a 32bit unsigned int + ".js" + null byte
  sprintf(url, "%" PRIu32 ".js", moduleID);

  ABI12_0_0RCTJSCWrapper *jscWrapper = executor->_jscWrapper;
  JSStringRef code = jscWrapper->JSStringCreateWithUTF8CString(data.get());
  JSValueRef jsError = NULL;
  JSStringRef sourceURL = jscWrapper->JSStringCreateWithUTF8CString(url);
  JSGlobalContextRef ctx = executor->_context.context.JSGlobalContextRef;
  JSValueRef result = jscWrapper->JSEvaluateScript(ctx, code, NULL, sourceURL, 0, &jsError);

  jscWrapper->JSStringRelease(code);
  jscWrapper->JSStringRelease(sourceURL);

  if (!result) {
    NSError *error = ABI12_0_0RCTNSErrorFromJSErrorRef(jsError, ctx, jscWrapper);
    dispatch_async(dispatch_get_main_queue(), ^{
      ABI12_0_0RCTFatal(error);
      [executor invalidate];
    });
  }
}

- (void)_nativeRequire:(NSNumber *)moduleID
{
  if (!moduleID) {
    return;
  }

  [_performanceLogger addValue:1 forTag:ABI12_0_0RCTPLRAMNativeRequiresCount];
  [_performanceLogger appendStartForTag:ABI12_0_0RCTPLRAMNativeRequires];
  ABI12_0_0RCT_PROFILE_BEGIN_EVENT(ABI12_0_0RCTProfileTagAlways, ([@"nativeRequire_" stringByAppendingFormat:@"%@", moduleID]), nil);

  const uint32_t ID = [moduleID unsignedIntValue];

  if (ID < _randomAccessBundle.numTableEntries) {
    ModuleData *moduleData = &_randomAccessBundle.table[ID];
    const uint32_t size = NSSwapLittleIntToHost(moduleData->size);

    // sparse entry in the table -- module does not exist or is contained in the startup section
    if (size == 0) {
      return;
    }

    executeRandomAccessModule(self, ID, NSSwapLittleIntToHost(moduleData->offset), size);
  }

  ABI12_0_0RCT_PROFILE_END_EVENT(ABI12_0_0RCTProfileTagAlways, @"js_call");
  [_performanceLogger appendStopForTag:ABI12_0_0RCTPLRAMNativeRequires];
}

static RandomAccessBundleStartupCode readRAMBundle(file_ptr bundle, RandomAccessBundleData &randomAccessBundle)
{
  // read in magic header, number of entries, and length of the startup section
  uint32_t header[3];
  if (fread(&header, 1, sizeof(header), bundle.get()) != sizeof(header)) {
    return RandomAccessBundleStartupCode::empty();
  }

  const size_t numTableEntries = NSSwapLittleIntToHost(header[1]);
  const size_t startupCodeSize = NSSwapLittleIntToHost(header[2]);
  const size_t tableSize = numTableEntries * sizeof(ModuleData);

  // allocate memory for meta data and lookup table. malloc instead of new to avoid constructor calls
  auto table = std::make_unique<ModuleData[]>(numTableEntries);
  if (!table) {
    return RandomAccessBundleStartupCode::empty();
  }

  // read the lookup table from the file
  if (fread(table.get(), 1, tableSize, bundle.get()) != tableSize) {
    return RandomAccessBundleStartupCode::empty();
  }

  // read the startup code
  memory_ptr code(malloc(startupCodeSize), free);
  if (!code || fread(code.get(), 1, startupCodeSize, bundle.get()) != startupCodeSize) {
    return RandomAccessBundleStartupCode::empty();
  }

  randomAccessBundle.bundle = std::move(bundle);
  randomAccessBundle.baseOffset = sizeof(header) + tableSize;
  randomAccessBundle.numTableEntries = numTableEntries;
  randomAccessBundle.table = std::move(table);

  return {std::move(code), startupCodeSize};
}

static NSData *loadRAMBundle(NSURL *sourceURL, NSError **error, RandomAccessBundleData &randomAccessBundle)
{
  file_ptr bundle(fopen(sourceURL.path.UTF8String, "r"), fclose);
  if (!bundle) {
    if (error) {
      *error = ABI12_0_0RCTErrorWithMessage([NSString stringWithFormat:@"Bundle %@ cannot be opened: %d", sourceURL.path, errno]);
    }
    return nil;
  }

  auto startupCode = readRAMBundle(std::move(bundle), randomAccessBundle);
  if (startupCode.isEmpty()) {
    if (error) {
      *error = ABI12_0_0RCTErrorWithMessage(@"Error loading RAM Bundle");
    }
    return nil;
  }

  return [NSData dataWithBytesNoCopy:startupCode.code.release() length:startupCode.size freeWhenDone:YES];
}

- (JSContext *)jsContext
{
  return [self context].context;
}

@end

@implementation ABI12_0_0RCTJSContextProvider
{
  dispatch_semaphore_t _semaphore;
  NSThread *_javaScriptThread;
  JSContext *_context;
  ABI12_0_0RCTJSCWrapper *_jscWrapper;
}

- (instancetype)initWithUseCustomJSCLibrary:(BOOL)useCustomJSCLibrary
{
  if (self = [super init]) {
    _semaphore = dispatch_semaphore_create(0);
    _useCustomJSCLibrary = useCustomJSCLibrary;
    _javaScriptThread = newJavaScriptThread();
    [self performSelector:@selector(_createContext) onThread:_javaScriptThread withObject:nil waitUntilDone:NO];
  }
  return self;
}

- (void)_createContext
{
  _jscWrapper = ABI12_0_0RCTJSCWrapperCreate(_useCustomJSCLibrary);
  _context = [_jscWrapper->JSContext new];
  installBasicSynchronousHooksOnContext(_context);
  dispatch_semaphore_signal(_semaphore);
}

- (ABI12_0_0RCTJSContextData)data
{
  // Be sure this method is only called once, otherwise it will hang here forever:
  dispatch_semaphore_wait(_semaphore, DISPATCH_TIME_FOREVER);
  return {
    .useCustomJSCLibrary = _useCustomJSCLibrary,
    .javaScriptThread = _javaScriptThread,
    .context = _context,
    .jscWrapper = _jscWrapper,
  };
}

@end
