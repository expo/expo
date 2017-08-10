/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI20_0_0RCTJSCExecutor.h"

#import <cinttypes>
#import <memory>
#import <pthread.h>
#import <string>
#import <unordered_map>

#import <UIKit/UIDevice.h>

#import <cxxReactABI20_0_0/ABI20_0_0JSBundleType.h>
#import <ABI20_0_0jschelpers/ABI20_0_0JavaScriptCore.h>
#import <ReactABI20_0_0/ABI20_0_0RCTAssert.h>
#import <ReactABI20_0_0/ABI20_0_0RCTBridge+Private.h>
#import <ReactABI20_0_0/ABI20_0_0RCTDefines.h>
#import <ReactABI20_0_0/ABI20_0_0RCTDevSettings.h>
#import <ReactABI20_0_0/ABI20_0_0RCTJSCErrorHandling.h>
#import <ReactABI20_0_0/ABI20_0_0RCTJavaScriptLoader.h>
#import <ReactABI20_0_0/ABI20_0_0RCTLog.h>
#import <ReactABI20_0_0/ABI20_0_0RCTPerformanceLogger.h>
#import <ReactABI20_0_0/ABI20_0_0RCTProfile.h>
#import <ReactABI20_0_0/ABI20_0_0RCTUtils.h>

#import "ABI20_0_0RCTJSCProfiler.h"

#if (ABI20_0_0RCT_PROFILE || ABI20_0_0RCT_DEV) && __has_include("ABI20_0_0RCTDevMenu.h")
#import "ABI20_0_0RCTDevMenu.h"
#endif

NSString *const ABI20_0_0RCTJSCThreadName = @"com.facebook.ReactABI20_0_0.JavaScript";
NSString *const ABI20_0_0RCTJavaScriptContextCreatedNotification = @"ABI20_0_0RCTJavaScriptContextCreatedNotification";

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

struct TaggedScript {
  const facebook::ReactABI20_0_0::ScriptTag tag;
  const NSData *script;
};

#if ABI20_0_0RCT_PROFILE
@interface ABI20_0_0RCTCookieMap : NSObject
{
  @package
  std::unordered_map<NSUInteger, NSUInteger> _cookieMap;
}
@end
@implementation ABI20_0_0RCTCookieMap @end
#endif

struct ABI20_0_0RCTJSContextData {
  BOOL useCustomJSCLibrary;
  NSThread *javaScriptThread;
  JSContext *context;
};

@interface ABI20_0_0RCTJavaScriptContext : NSObject <ABI20_0_0RCTInvalidating>

@property (nonatomic, strong, readonly) JSContext *context;

- (instancetype)initWithJSContext:(JSContext *)context
                         onThread:(NSThread *)javaScriptThread NS_DESIGNATED_INITIALIZER;

@end

@implementation ABI20_0_0RCTJavaScriptContext
{
  ABI20_0_0RCTJavaScriptContext *_selfReference;
  NSThread *_javaScriptThread;
}

- (instancetype)initWithJSContext:(JSContext *)context
                         onThread:(NSThread *)javaScriptThread
{
  if ((self = [super init])) {
    _context = context;
    _context.name = @"ABI20_0_0RCTJSContext";
    _javaScriptThread = javaScriptThread;

    /**
     * Explicitly introduce a retain cycle here - The ABI20_0_0RCTJSCExecutor might
     * be deallocated while there's still work enqueued in the JS thread, so
     * we wouldn't be able kill the JSContext. Instead we create this retain
     * cycle, and enqueue the -invalidate message in this object, it then
     * releases the JSContext, breaks the cycle and stops the runloop.
     */
    _selfReference = self;
  }
  return self;
}

ABI20_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (BOOL)isValid
{
  return _context != nil;
}

- (void)invalidate
{
  if (self.isValid) {
    ABI20_0_0RCTAssertThread(_javaScriptThread, @"Must be invalidated on JS thread.");

    _context = nil;
    _selfReference = nil;
    _javaScriptThread = nil;

    CFRunLoopStop([[NSRunLoop currentRunLoop] getCFRunLoop]);
  }
}

@end

@implementation ABI20_0_0RCTJSCExecutor
{
  // Set at init time:
  BOOL _useCustomJSCLibrary;
  NSThread *_javaScriptThread;

  // Set at setUp time:
  ABI20_0_0RCTPerformanceLogger *_performanceLogger;
  ABI20_0_0RCTJavaScriptContext *_context;

  // Set as needed:
  RandomAccessBundleData _randomAccessBundle;
  JSValueRef _batchedBridgeRef;
}

@synthesize valid = _valid;
@synthesize bridge = _bridge;

ABI20_0_0RCT_EXPORT_MODULE()

#if ABI20_0_0RCT_DEV
static void ABI20_0_0RCTInstallJSCProfiler(ABI20_0_0RCTBridge *bridge, JSContextRef context)
{
#if __has_include("ABI20_0_0RCTDevMenu.h")
  __weak ABI20_0_0RCTBridge *weakBridge = bridge;
  __weak ABI20_0_0RCTDevSettings *devSettings = bridge.devSettings;
  if (ABI20_0_0RCTJSCProfilerIsSupported()) {
    [bridge.devMenu addItem:[ABI20_0_0RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
      return devSettings.isJSCProfilingEnabled ? @"Stop Profiling" : @"Start Profiling";
    } handler:^{
      BOOL shouldStart = !devSettings.isJSCProfilingEnabled;
      devSettings.isJSCProfilingEnabled = shouldStart;
      if (shouldStart != ABI20_0_0RCTJSCProfilerIsProfiling(context)) {
        if (shouldStart) {
          ABI20_0_0RCTJSCProfilerStart(context);
        } else {
          NSString *outputFile = ABI20_0_0RCTJSCProfilerStop(context);
          NSData *profileData = [NSData dataWithContentsOfFile:outputFile options:NSDataReadingMappedIfSafe error:NULL];
          ABI20_0_0RCTProfileSendResult(weakBridge, @"cpu-profile", profileData);
        }
      }
    }]];
  }
#endif
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
      ABI20_0_0RCTAssert(NO, @"not reached assertion"); // runloop spun. that's bad.
    }
  }
}

static NSThread *newJavaScriptThread(void)
{
  NSThread *javaScriptThread = [[NSThread alloc] initWithTarget:[ABI20_0_0RCTJSCExecutor class]
                                                       selector:@selector(runRunLoopThread)
                                                         object:nil];
  javaScriptThread.name = ABI20_0_0RCTJSCThreadName;
  javaScriptThread.qualityOfService = NSOperationQualityOfServiceUserInteractive;
  [javaScriptThread start];
  return javaScriptThread;
}

- (void)setBridge:(ABI20_0_0RCTBridge *)bridge
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
  ABI20_0_0RCT_PROFILE_BEGIN_EVENT(0, @"-[ABI20_0_0RCTJSCExecutor init]", nil);

  if (self = [super init]) {
    _useCustomJSCLibrary = useCustomJSCLibrary;
    _valid = YES;
    _javaScriptThread = newJavaScriptThread();
  }

  ABI20_0_0RCT_PROFILE_END_EVENT(ABI20_0_0RCTProfileTagAlways, @"");
  return self;
}

- (instancetype)initWithJSContextData:(const ABI20_0_0RCTJSContextData &)data
{
  if (self = [super init]) {
    _useCustomJSCLibrary = data.useCustomJSCLibrary;
    _valid = YES;
    _javaScriptThread = data.javaScriptThread;
    _context = [[ABI20_0_0RCTJavaScriptContext alloc] initWithJSContext:data.context onThread:_javaScriptThread];
  }
  return self;
}

- (NSError *)synchronouslyExecuteApplicationScript:(NSData *)script
                                         sourceURL:(NSURL *)sourceURL
{
  NSError *loadError;
  TaggedScript taggedScript = loadTaggedScript(script, sourceURL, _performanceLogger, _randomAccessBundle, &loadError);

  if (loadError) {
    return loadError;
  }

  if (taggedScript.tag == facebook::ReactABI20_0_0::ScriptTag::RAMBundle) {
    registerNativeRequire(_context.context, self);
  }

  return executeApplicationScript(taggedScript, sourceURL,
                                  _performanceLogger,
                                  _context.context.JSGlobalContextRef);
}

- (ABI20_0_0RCTJavaScriptContext *)context
{
  if (!self.isValid) {
    return nil;
  }
  return _context;
}

- (void)setUp
{
#if ABI20_0_0RCT_PROFILE
#ifndef __clang_analyzer__
  _bridge.flowIDMap = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
#endif
  _bridge.flowIDMapLock = [NSLock new];

  for (NSString *event in @[ABI20_0_0RCTProfileDidStartProfiling, ABI20_0_0RCTProfileDidEndProfiling]) {
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

    JSGlobalContextRef contextRef = nullptr;
    JSContext *context = nil;
    if (self->_context) {
      context = self->_context.context;
      contextRef = context.JSGlobalContextRef;
    } else {
      if (self->_useCustomJSCLibrary) {
        JSC_configureJSCForIOS(true, ABI20_0_0RCTJSONStringify(@{
          @"StartSamplingProfilerOnInit": @(self->_bridge.devSettings.startSamplingProfilerOnLaunch)
        }, NULL).UTF8String);
      }
      contextRef = JSC_JSGlobalContextCreateInGroup(self->_useCustomJSCLibrary, nullptr, nullptr);
      context = [JSC_JSContext(contextRef) contextWithJSGlobalContextRef:contextRef];
      // We release the global context reference here to balance retainCount after JSGlobalContextCreateInGroup.
      // The global context _is not_ going to be released since the JSContext keeps the strong reference to it.
      JSC_JSGlobalContextRelease(contextRef);
      self->_context = [[ABI20_0_0RCTJavaScriptContext alloc] initWithJSContext:context onThread:self->_javaScriptThread];
      [[NSNotificationCenter defaultCenter] postNotificationName:ABI20_0_0RCTJavaScriptContextCreatedNotification
                                                          object:context];

      installBasicSynchronousHooksOnContext(context);
    }

    ABI20_0_0RCTFBQuickPerformanceLoggerConfigureHooks(context.JSGlobalContextRef);

    __weak ABI20_0_0RCTJSCExecutor *weakSelf = self;
    context[@"nativeRequireModuleConfig"] = ^NSArray *(NSString *moduleName) {
      ABI20_0_0RCTJSCExecutor *strongSelf = weakSelf;
      if (!strongSelf.valid) {
        return nil;
      }

      ABI20_0_0RCT_PROFILE_BEGIN_EVENT(ABI20_0_0RCTProfileTagAlways, @"nativeRequireModuleConfig", @{ @"moduleName": moduleName });
      NSArray *result = [strongSelf->_bridge configForModuleName:moduleName];
      ABI20_0_0RCT_PROFILE_END_EVENT(ABI20_0_0RCTProfileTagAlways, @"js_call,config");
      return ABI20_0_0RCTNullIfNil(result);
    };

    context[@"nativeFlushQueueImmediate"] = ^(NSArray<NSArray *> *calls){
      ABI20_0_0RCTJSCExecutor *strongSelf = weakSelf;
      if (!strongSelf.valid || !calls) {
        return;
      }

      ABI20_0_0RCT_PROFILE_BEGIN_EVENT(ABI20_0_0RCTProfileTagAlways, @"nativeFlushQueueImmediate", nil);
      [strongSelf->_bridge handleBuffer:calls batchEnded:NO];
      ABI20_0_0RCT_PROFILE_END_EVENT(ABI20_0_0RCTProfileTagAlways, @"js_call");
    };

    context[@"nativeCallSyncHook"] = ^id(NSUInteger module, NSUInteger method, NSArray *args) {
      ABI20_0_0RCTJSCExecutor *strongSelf = weakSelf;
      if (!strongSelf.valid) {
        return nil;
      }

      ABI20_0_0RCT_PROFILE_BEGIN_EVENT(ABI20_0_0RCTProfileTagAlways, @"nativeCallSyncHook", nil);
      id result = [strongSelf->_bridge callNativeModule:module method:method params:args];
      ABI20_0_0RCT_PROFILE_END_EVENT(ABI20_0_0RCTProfileTagAlways, @"js_call,config");
      return result;
    };

#if ABI20_0_0RCT_PROFILE
    __weak ABI20_0_0RCTBridge *weakBridge = self->_bridge;
    context[@"nativeTraceBeginAsyncFlow"] = ^(__unused uint64_t tag, __unused NSString *name, int64_t cookie) {
      if (ABI20_0_0RCTProfileIsProfiling()) {
        [weakBridge.flowIDMapLock lock];
        NSUInteger newCookie = _ABI20_0_0RCTProfileBeginFlowEvent();
        CFDictionarySetValue(weakBridge.flowIDMap, (const void *)cookie, (const void *)newCookie);
        [weakBridge.flowIDMapLock unlock];
      }
    };

    context[@"nativeTraceEndAsyncFlow"] = ^(__unused uint64_t tag, __unused NSString *name, int64_t cookie) {
      if (ABI20_0_0RCTProfileIsProfiling()) {
        [weakBridge.flowIDMapLock lock];
        NSUInteger newCookie = (NSUInteger)CFDictionaryGetValue(weakBridge.flowIDMap, (const void *)cookie);
        _ABI20_0_0RCTProfileEndFlowEvent(newCookie);
        CFDictionaryRemoveValue(weakBridge.flowIDMap, (const void *)cookie);
        [weakBridge.flowIDMapLock unlock];
      }
    };

    // Add toggles for JSC's sampling profiler, if the profiler is enabled
    if (JSC_JSSamplingProfilerEnabled(context.JSGlobalContextRef)) {
      // Mark this thread as the main JS thread before starting profiling.
      JSC_JSStartSamplingProfilingOnMainJSCThread(context.JSGlobalContextRef);

      __weak JSContext *weakContext = self->_context.context;

#if __has_include("ABI20_0_0RCTDevMenu.h")
      // Allow to toggle the sampling profiler through RN's dev menu
      [self->_bridge.devMenu addItem:[ABI20_0_0RCTDevMenuItem buttonItemWithTitle:@"Start / Stop JS Sampling Profiler" handler:^{
        ABI20_0_0RCTJSCExecutor *strongSelf = weakSelf;
        if (!strongSelf.valid || !weakContext) {
          return;
        }
        [weakSelf.bridge.devSettings toggleJSCSamplingProfiler];
      }]];
#endif

      // Allow for the profiler to be poked from JS code as well
      // (see SamplingProfiler.js for an example of how it could be used with the JSCSamplingProfiler module).
      context[@"pokeSamplingProfiler"] = ^NSDictionary *() {
        if (!weakContext) {
          return @{};
        }
        JSGlobalContextRef ctx = weakContext.JSGlobalContextRef;
        JSValueRef result = JSC_JSPokeSamplingProfiler(ctx);
        return [[JSC_JSValue(ctx) valueWithJSValueRef:result inContext:weakContext] toObject];
      };
    }
#endif

#if ABI20_0_0RCT_DEV
    ABI20_0_0RCTInstallJSCProfiler(self->_bridge, context.JSGlobalContextRef);

    // Inject handler used by HMR
    context[@"nativeInjectHMRUpdate"] = ^(NSString *sourceCode, NSString *sourceCodeURL) {
      ABI20_0_0RCTJSCExecutor *strongSelf = weakSelf;
      if (!strongSelf.valid) {
        return;
      }

      JSGlobalContextRef ctx = strongSelf->_context.context.JSGlobalContextRef;
      JSStringRef execJSString = JSC_JSStringCreateWithUTF8CString(ctx, sourceCode.UTF8String);
      JSStringRef jsURL = JSC_JSStringCreateWithUTF8CString(ctx, sourceCodeURL.UTF8String);
      JSC_JSEvaluateScript(ctx, execJSString, NULL, jsURL, 0, NULL);
      JSC_JSStringRelease(ctx, jsURL);
      JSC_JSStringRelease(ctx, execJSString);
    };
#endif
  }];
}

/** Installs synchronous hooks that don't require a weak reference back to the ABI20_0_0RCTJSCExecutor. */
static void installBasicSynchronousHooksOnContext(JSContext *context)
{
  context[@"nativeLoggingHook"] = ^(NSString *message, NSNumber *logLevel) {
    ABI20_0_0RCTLogLevel level = ABI20_0_0RCTLogLevelInfo;
    if (logLevel) {
      level = MAX(level, (ABI20_0_0RCTLogLevel)logLevel.integerValue);
    }

    _ABI20_0_0RCTLogJavaScriptInternal(level, message);
  };
  context[@"nativePerformanceNow"] = ^{
    return @(CACurrentMediaTime() * 1000);
  };
#if ABI20_0_0RCT_PROFILE
  if (ABI20_0_0RCTProfileIsProfiling()) {
    // Cheating, since it's not a "hook", but meh
    context[@"__ABI20_0_0RCTProfileIsProfiling"] = @YES;
  }
  context[@"nativeTraceBeginSection"] = ^(NSNumber *tag, NSString *profileName, NSDictionary *args) {
    static int profileCounter = 1;
    if (!profileName) {
      profileName = [NSString stringWithFormat:@"Profile %d", profileCounter++];
    }

    ABI20_0_0RCT_PROFILE_BEGIN_EVENT(tag.longLongValue, profileName, args);
  };
  context[@"nativeTraceEndSection"] = ^(NSNumber *tag) {
    ABI20_0_0RCT_PROFILE_END_EVENT(tag.longLongValue, @"console");
  };
  ABI20_0_0RCTCookieMap *cookieMap = [ABI20_0_0RCTCookieMap new];
  context[@"nativeTraceBeginAsyncSection"] = ^(uint64_t tag, NSString *name, NSUInteger cookie) {
    NSUInteger newCookie = ABI20_0_0RCTProfileBeginAsyncEvent(tag, name, nil);
    cookieMap->_cookieMap.insert({cookie, newCookie});
  };
  context[@"nativeTraceEndAsyncSection"] = ^(uint64_t tag, NSString *name, NSUInteger cookie) {
    NSUInteger newCookie = 0;
    const auto &it = cookieMap->_cookieMap.find(cookie);
    if (it != cookieMap->_cookieMap.end()) {
      newCookie = it->second;
      cookieMap->_cookieMap.erase(it);
    }
    ABI20_0_0RCTProfileEndAsyncEvent(tag, @"js,async", newCookie, name, @"JS async");
  };
#endif
}

- (void)toggleProfilingFlag:(NSNotification *)notification
{
  [self executeBlockOnJavaScriptQueue:^{
    BOOL enabled = [notification.name isEqualToString:ABI20_0_0RCTProfileDidStartProfiling];
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

#if ABI20_0_0RCT_PROFILE
  [[NSNotificationCenter defaultCenter] removeObserver:self];
#endif
}

- (int32_t)bytecodeFileFormatVersion
{
  return _useCustomJSCLibrary
    ? facebook::ReactABI20_0_0::customJSCWrapper()->JSBytecodeFileFormatVersion
    : JSNoBytecodeFileFormatVersion;
}

- (NSString *)contextName
{
  return [_context.context name];
}

ABI20_0_0RCT_EXPORT_METHOD(setContextName:(nonnull NSString *)contextName)
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
}

- (void)flushedQueue:(ABI20_0_0RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"flushedQueue" arguments:@[] unwrapResult:YES callback:onComplete];
}

- (void)_callFunctionOnModule:(NSString *)module
                       method:(NSString *)method
                    arguments:(NSArray *)args
                  returnValue:(BOOL)returnValue
                 unwrapResult:(BOOL)unwrapResult
                     callback:(ABI20_0_0RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  NSString *bridgeMethod = returnValue ? @"callFunctionReturnFlushedQueue" : @"callFunctionReturnResultAndFlushedQueue";
  [self _executeJSCall:bridgeMethod arguments:@[module, method, args] unwrapResult:unwrapResult callback:onComplete];
}

- (void)callFunctionOnModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args callback:(ABI20_0_0RCTJavaScriptCallback)onComplete
{
  [self _callFunctionOnModule:module method:method arguments:args returnValue:YES unwrapResult:YES callback:onComplete];
}

- (void)callFunctionOnModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args jsValueCallback:(ABI20_0_0RCTJavaScriptValueCallback)onComplete
{
  [self _callFunctionOnModule:module method:method arguments:args returnValue:NO unwrapResult:NO callback:onComplete];
}

- (void)invokeCallbackID:(NSNumber *)cbID
               arguments:(NSArray *)args
                callback:(ABI20_0_0RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"invokeCallbackAndReturnFlushedQueue" arguments:@[cbID, args] unwrapResult:YES callback:onComplete];
}

- (void)_executeJSCall:(NSString *)method
             arguments:(NSArray *)arguments
          unwrapResult:(BOOL)unwrapResult
              callback:(ABI20_0_0RCTJavaScriptCallback)onComplete
{
  ABI20_0_0RCTAssert(onComplete != nil, @"onComplete block should not be nil");
  __weak ABI20_0_0RCTJSCExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:^{
    ABI20_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }

    ABI20_0_0RCT_PROFILE_BEGIN_EVENT(0, @"executeJSCall", (@{@"method": method, @"args": arguments}));

    JSContext *context = strongSelf->_context.context;
    JSGlobalContextRef ctx = context.JSGlobalContextRef;

    // get the BatchedBridge object
    JSValueRef errorJSRef = NULL;
    JSValueRef batchedBridgeRef = strongSelf->_batchedBridgeRef;
    if (!batchedBridgeRef) {
      JSStringRef moduleNameJSStringRef = JSC_JSStringCreateWithUTF8CString(ctx, "__fbBatchedBridge");
      JSObjectRef globalObjectJSRef = JSC_JSContextGetGlobalObject(ctx);
      batchedBridgeRef = JSC_JSObjectGetProperty(ctx, globalObjectJSRef, moduleNameJSStringRef, &errorJSRef);
      JSC_JSStringRelease(ctx, moduleNameJSStringRef);
      strongSelf->_batchedBridgeRef = batchedBridgeRef;
    }

    NSError *error;
    JSValueRef resultJSRef = NULL;
    if (batchedBridgeRef != NULL && errorJSRef == NULL && JSC_JSValueGetType(ctx, batchedBridgeRef) != kJSTypeUndefined) {
      // get method
      JSStringRef methodNameJSStringRef = JSC_JSStringCreateWithCFString(ctx, (__bridge CFStringRef)method);
      JSValueRef methodJSRef = JSC_JSObjectGetProperty(ctx, (JSObjectRef)batchedBridgeRef, methodNameJSStringRef, &errorJSRef);
      JSC_JSStringRelease(ctx, methodNameJSStringRef);

      if (methodJSRef != NULL && errorJSRef == NULL && JSC_JSValueGetType(ctx, methodJSRef) != kJSTypeUndefined) {
        JSValueRef jsArgs[arguments.count];
        for (NSUInteger i = 0; i < arguments.count; i++) {
          jsArgs[i] = [JSC_JSValue(ctx) valueWithObject:arguments[i] inContext:context].JSValueRef;
        }
        resultJSRef = JSC_JSObjectCallAsFunction(ctx, (JSObjectRef)methodJSRef, (JSObjectRef)batchedBridgeRef, arguments.count, jsArgs, &errorJSRef);
      } else {
        if (!errorJSRef && JSC_JSValueGetType(ctx, methodJSRef) == kJSTypeUndefined) {
          error = ABI20_0_0RCTErrorWithMessage([NSString stringWithFormat:@"Unable to execute JS call: method %@ is undefined", method]);
        }
      }
    } else {
      if (!errorJSRef && JSC_JSValueGetType(ctx, batchedBridgeRef) == kJSTypeUndefined) {
        error = ABI20_0_0RCTErrorWithMessage(@"Unable to execute JS call: __fbBatchedBridge is undefined");
      }
    }

    id objcValue;
    if (errorJSRef || error) {
      if (!error) {
        error = ABI20_0_0RCTNSErrorFromJSError([JSC_JSValue(ctx) valueWithJSValueRef:errorJSRef inContext:context]);
      }
    } else {
      // We often return `null` from JS when there is nothing for native side. [JSValue toValue]
      // returns [NSNull null] in this case, which we don't want.
      if (JSC_JSValueGetType(ctx, resultJSRef) != kJSTypeNull) {
        JSValue *result = [JSC_JSValue(ctx) valueWithJSValueRef:resultJSRef inContext:context];
        objcValue = unwrapResult ? [result toObject] : result;
      }
    }

    ABI20_0_0RCT_PROFILE_END_EVENT(0, @"js_call");

    onComplete(objcValue, error);
  }];
}

- (void)executeApplicationScript:(NSData *)script
                       sourceURL:(NSURL *)sourceURL
                      onComplete:(ABI20_0_0RCTJavaScriptCompleteBlock)onComplete
{
  ABI20_0_0RCTAssertParam(script);
  ABI20_0_0RCTAssertParam(sourceURL);

  NSError *loadError;
  TaggedScript taggedScript = loadTaggedScript(script, sourceURL,
                                               _performanceLogger,
                                               _randomAccessBundle,
                                               &loadError);
  if (!taggedScript.script) {
    if (onComplete) {
      onComplete(loadError);
    }
    return;
  }

  ABI20_0_0RCTProfileBeginFlowEvent();
  [self executeBlockOnJavaScriptQueue:^{
    ABI20_0_0RCTProfileEndFlowEvent();
    if (!self.isValid) {
      return;
    }

    if (taggedScript.tag == facebook::ReactABI20_0_0::ScriptTag::RAMBundle) {
      registerNativeRequire(self.context.context, self);
    }

    NSError *error = executeApplicationScript(taggedScript, sourceURL,
                                              self->_performanceLogger,
                                              self->_context.context.JSGlobalContextRef);
    if (onComplete) {
      onComplete(error);
    }
  }];
}

static TaggedScript loadTaggedScript(NSData *script,
                                     NSURL *sourceURL,
                                     ABI20_0_0RCTPerformanceLogger *performanceLogger,
                                     RandomAccessBundleData &randomAccessBundle,
                                     NSError **error)
{
  ABI20_0_0RCT_PROFILE_BEGIN_EVENT(0, @"executeApplicationScript / prepare bundle", nil);

  facebook::ReactABI20_0_0::BundleHeader header;
  [script getBytes:&header length:sizeof(header)];
  facebook::ReactABI20_0_0::ScriptTag tag = facebook::ReactABI20_0_0::parseTypeFromHeader(header);

  NSData *loadedScript = NULL;
  switch (tag) {
    case facebook::ReactABI20_0_0::ScriptTag::RAMBundle:
      [performanceLogger markStartForTag:ABI20_0_0RCTPLRAMBundleLoad];

      loadedScript = loadRAMBundle(sourceURL, error, randomAccessBundle);

      [performanceLogger markStopForTag:ABI20_0_0RCTPLRAMBundleLoad];
      [performanceLogger setValue:loadedScript.length forTag:ABI20_0_0RCTPLRAMStartupCodeSize];
      break;

    case facebook::ReactABI20_0_0::ScriptTag::BCBundle:
      loadedScript = script;
      break;

    case facebook::ReactABI20_0_0::ScriptTag::String: {
      NSMutableData *nullTerminatedScript = [NSMutableData dataWithData:script];
      [nullTerminatedScript appendBytes:"" length:1];
      loadedScript = nullTerminatedScript;
    }
  }

  ABI20_0_0RCT_PROFILE_END_EVENT(ABI20_0_0RCTProfileTagAlways, @"");
  return { .tag = tag, .script = loadedScript };
}

static void registerNativeRequire(JSContext *context, ABI20_0_0RCTJSCExecutor *executor)
{
  __weak ABI20_0_0RCTJSCExecutor *weakExecutor = executor;
  context[@"nativeRequire"] = ^(NSNumber *moduleID) { [weakExecutor _nativeRequire:moduleID]; };
}

static NSError *executeApplicationScript(TaggedScript taggedScript,
                                         NSURL *sourceURL,
                                         ABI20_0_0RCTPerformanceLogger *performanceLogger,
                                         JSGlobalContextRef ctx)
{
  ABI20_0_0RCT_PROFILE_BEGIN_EVENT(0, @"executeApplicationScript / execute script", (@{
    @"url": sourceURL.absoluteString, @"size": @(taggedScript.script.length)
  }));

  [performanceLogger markStartForTag:ABI20_0_0RCTPLScriptExecution];
  JSValueRef jsError = NULL;
  JSStringRef bundleURL = JSC_JSStringCreateWithUTF8CString(ctx, sourceURL.absoluteString.UTF8String);

  switch (taggedScript.tag) {
    case facebook::ReactABI20_0_0::ScriptTag::RAMBundle:
      /* fallthrough */
    case facebook::ReactABI20_0_0::ScriptTag::String: {
      JSStringRef execJSString = JSC_JSStringCreateWithUTF8CString(ctx, (const char *)taggedScript.script.bytes);
      JSC_JSEvaluateScript(ctx, execJSString, NULL, bundleURL, 0, &jsError);
      JSC_JSStringRelease(ctx, execJSString);
      break;
    }

    case facebook::ReactABI20_0_0::ScriptTag::BCBundle: {
      file_ptr source(fopen(sourceURL.path.UTF8String, "r"), fclose);
      int sourceFD = fileno(source.get());

      JSC_JSEvaluateBytecodeBundle(ctx, NULL, sourceFD, bundleURL, &jsError);
      break;
    }
  }

  JSC_JSStringRelease(ctx, bundleURL);
  [performanceLogger markStopForTag:ABI20_0_0RCTPLScriptExecution];

  NSError *error = jsError
    ? ABI20_0_0RCTNSErrorFromJSErrorRef(jsError, ctx)
    : nil;

  ABI20_0_0RCT_PROFILE_END_EVENT(0, @"js_call");
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
              callback:(ABI20_0_0RCTJavaScriptCompleteBlock)onComplete
{
  if (ABI20_0_0RCT_DEBUG) {
    ABI20_0_0RCTAssert(ABI20_0_0RCTJSONParse(script, NULL) != nil, @"%@ wasn't valid JSON!", script);
  }

  __weak ABI20_0_0RCTJSCExecutor *weakSelf = self;
  ABI20_0_0RCTProfileBeginFlowEvent();
  [self executeBlockOnJavaScriptQueue:^{
    ABI20_0_0RCTProfileEndFlowEvent();

    ABI20_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }

    ABI20_0_0RCT_PROFILE_BEGIN_EVENT(0, @"injectJSONText", @{@"objectName": objectName});
    JSGlobalContextRef ctx = strongSelf->_context.context.JSGlobalContextRef;
    JSStringRef execJSString = JSC_JSStringCreateWithCFString(ctx, (__bridge CFStringRef)script);
    JSValueRef valueToInject = JSC_JSValueMakeFromJSONString(ctx, execJSString);
    JSC_JSStringRelease(ctx, execJSString);

    NSError *error;
    if (!valueToInject) {
      NSString *errorMessage = [NSString stringWithFormat:@"Can't make JSON value from script '%@'", script];
      error = [NSError errorWithDomain:ABI20_0_0RCTErrorDomain code:2 userInfo:@{NSLocalizedDescriptionKey: errorMessage}];
      ABI20_0_0RCTLogError(@"%@", errorMessage);
    } else {
      JSObjectRef globalObject = JSC_JSContextGetGlobalObject(ctx);
      JSStringRef JSName = JSC_JSStringCreateWithCFString(ctx, (__bridge CFStringRef)objectName);
      JSValueRef jsError = NULL;
      JSC_JSObjectSetProperty(ctx, globalObject, JSName, valueToInject, kJSPropertyAttributeNone, &jsError);
      JSC_JSStringRelease(ctx, JSName);

      if (jsError) {
        error = ABI20_0_0RCTNSErrorFromJSErrorRef(jsError, ctx);
      }
    }
    ABI20_0_0RCT_PROFILE_END_EVENT(0, @"js_call,json_call");

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

static void executeRandomAccessModule(ABI20_0_0RCTJSCExecutor *executor, uint32_t moduleID, size_t offset, size_t size)
{
  auto data = std::make_unique<char[]>(size);
  if (!readRandomAccessModule(executor->_randomAccessBundle, offset, size, data.get())) {
    ABI20_0_0RCTFatal(ABI20_0_0RCTErrorWithMessage(@"Error loading RAM module"));
    return;
  }

  char url[14]; // 10 = maximum decimal digits in a 32bit unsigned int + ".js" + null byte
  sprintf(url, "%" PRIu32 ".js", moduleID);

  JSGlobalContextRef ctx = executor->_context.context.JSGlobalContextRef;
  JSStringRef code = JSC_JSStringCreateWithUTF8CString(ctx, data.get());
  JSValueRef jsError = NULL;
  JSStringRef sourceURL = JSC_JSStringCreateWithUTF8CString(ctx, url);
  JSValueRef result = JSC_JSEvaluateScript(ctx, code, NULL, sourceURL, 0, &jsError);

  JSC_JSStringRelease(ctx, code);
  JSC_JSStringRelease(ctx, sourceURL);

  if (!result) {
    NSError *error = ABI20_0_0RCTNSErrorFromJSErrorRef(jsError, ctx);
    dispatch_async(dispatch_get_main_queue(), ^{
      ABI20_0_0RCTFatal(error);
      [executor invalidate];
    });
  }
}

- (void)_nativeRequire:(NSNumber *)moduleID
{
  if (!moduleID) {
    return;
  }

  [_performanceLogger addValue:1 forTag:ABI20_0_0RCTPLRAMNativeRequiresCount];
  [_performanceLogger appendStartForTag:ABI20_0_0RCTPLRAMNativeRequires];
  ABI20_0_0RCT_PROFILE_BEGIN_EVENT(ABI20_0_0RCTProfileTagAlways, ([@"nativeRequire_" stringByAppendingFormat:@"%@", moduleID]), nil);

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

  ABI20_0_0RCT_PROFILE_END_EVENT(ABI20_0_0RCTProfileTagAlways, @"js_call");
  [_performanceLogger appendStopForTag:ABI20_0_0RCTPLRAMNativeRequires];
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
      *error = ABI20_0_0RCTErrorWithMessage([NSString stringWithFormat:@"Bundle %@ cannot be opened: %d", sourceURL.path, errno]);
    }
    return nil;
  }

  auto startupCode = readRAMBundle(std::move(bundle), randomAccessBundle);
  if (startupCode.isEmpty()) {
    if (error) {
      *error = ABI20_0_0RCTErrorWithMessage(@"Error loading RAM Bundle");
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

@implementation ABI20_0_0RCTJSContextProvider
{
  dispatch_semaphore_t _semaphore;
  NSThread *_javaScriptThread;
  JSContext *_context;
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
  if (_useCustomJSCLibrary) {
    JSC_configureJSCForIOS(true, "{}");
  }
  JSGlobalContextRef ctx = JSC_JSGlobalContextCreateInGroup(_useCustomJSCLibrary, nullptr, nullptr);
  _context = [JSC_JSContext(ctx) contextWithJSGlobalContextRef:ctx];
  installBasicSynchronousHooksOnContext(_context);
  dispatch_semaphore_signal(_semaphore);
}

- (ABI20_0_0RCTJSContextData)data
{
  // Be sure this method is only called once, otherwise it will hang here forever:
  dispatch_semaphore_wait(_semaphore, DISPATCH_TIME_FOREVER);
  return {
    .useCustomJSCLibrary = _useCustomJSCLibrary,
    .javaScriptThread = _javaScriptThread,
    .context = _context,
  };
}


- (ABI20_0_0RCTJSCExecutor *)createExecutorWithContext:(JSContext **)JSContext
{
  const ABI20_0_0RCTJSContextData data = self.data;
  if (JSContext) {
    *JSContext = data.context;
  }
  return [[ABI20_0_0RCTJSCExecutor alloc] initWithJSContextData:data];
}

@end
