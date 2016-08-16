/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTJSCExecutor.h"

#import <pthread.h>

#import <JavaScriptCore/JavaScriptCore.h>
#import <UIKit/UIDevice.h>

#import "ABI5_0_0RCTAssert.h"
#import "ABI5_0_0RCTBridge+Private.h"
#import "ABI5_0_0RCTDefines.h"
#import "ABI5_0_0RCTDevMenu.h"
#import "ABI5_0_0RCTJavaScriptLoader.h"
#import "ABI5_0_0RCTLog.h"
#import "ABI5_0_0RCTProfile.h"
#import "ABI5_0_0RCTPerformanceLogger.h"
#import "ABI5_0_0RCTUtils.h"
#import "ABI5_0_0RCTJSCProfiler.h"
#import "ABI5_0_0RCTRedBox.h"
#import "ABI5_0_0RCTSourceCode.h"

NSString *const ABI5_0_0RCTJSCThreadName = @"com.facebook.ReactABI5_0_0.JavaScript";

NSString *const ABI5_0_0RCTJavaScriptContextCreatedNotification = @"ABI5_0_0RCTJavaScriptContextCreatedNotification";

static NSString *const ABI5_0_0RCTJSCProfilerEnabledDefaultsKey = @"ABI5_0_0RCTJSCProfilerEnabled";

typedef struct ModuleData {
  uint32_t offset;
  uint32_t length;
  uint32_t lineNo;
} ModuleData;

@interface ABI5_0_0RCTJavaScriptContext : NSObject <ABI5_0_0RCTInvalidating>

@property (nonatomic, strong, readonly) JSContext *context;
@property (nonatomic, assign, readonly) JSGlobalContextRef ctx;

- (instancetype)initWithJSContext:(JSContext *)context
                         onThread:(NSThread *)javaScriptThread NS_DESIGNATED_INITIALIZER;

@end

@implementation ABI5_0_0RCTJavaScriptContext
{
  ABI5_0_0RCTJavaScriptContext *_selfReference;
  NSThread *_javaScriptThread;
}

- (instancetype)initWithJSContext:(JSContext *)context
                         onThread:(NSThread *)javaScriptThread
{
  if ((self = [super init])) {
    _context = context;
    _javaScriptThread = javaScriptThread;

    /**
     * Explicitly introduce a retain cycle here - The ABI5_0_0RCTJSCExecutor might
     * be deallocated while there's still work enqueued in the JS thread, so
     * we wouldn't be able kill the JSContext. Instead we create this retain
     * cycle, and enqueue the -invalidate message in this object, it then
     * releases the JSContext, breaks the cycle and stops the runloop.
     */
    _selfReference = self;
  }
  return self;
}

ABI5_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (JSGlobalContextRef)ctx
{
  return _context.JSGlobalContextRef;
}

- (BOOL)isValid
{
  return _context != nil;
}

- (void)invalidate
{
  if (self.isValid) {
    ABI5_0_0RCTAssertThread(_javaScriptThread, @"Must be invalidated on JS thread.");

    _context = nil;
    _selfReference = nil;
    _javaScriptThread = nil;

    CFRunLoopStop([[NSRunLoop currentRunLoop] getCFRunLoop]);
  }
}

@end

@implementation ABI5_0_0RCTJSCExecutor
{
  ABI5_0_0RCTJavaScriptContext *_context;
  NSThread *_javaScriptThread;

  FILE *_bundle;
  JSStringRef _bundleURL;
  CFMutableDictionaryRef _jsModules;
}

@synthesize valid = _valid;
@synthesize bridge = _bridge;

ABI5_0_0RCT_EXPORT_MODULE()

static NSString *ABI5_0_0RCTJSValueToNSString(JSContextRef context, JSValueRef value, JSValueRef *exception)
{
  JSStringRef JSString = JSValueToStringCopy(context, value, exception);
  if (!JSString) {
    return nil;
  }

  CFStringRef string = JSStringCopyCFString(kCFAllocatorDefault, JSString);
  JSStringRelease(JSString);

  return (__bridge_transfer NSString *)string;
}

static NSString *ABI5_0_0RCTJSValueToJSONString(JSContextRef context, JSValueRef value, JSValueRef *exception, unsigned indent)
{
  JSStringRef JSString = JSValueCreateJSONString(context, value, indent, exception);
  CFStringRef string = JSStringCopyCFString(kCFAllocatorDefault, JSString);
  JSStringRelease(JSString);

  return (__bridge_transfer NSString *)string;
}

static NSError *ABI5_0_0RCTNSErrorFromJSError(JSContextRef context, JSValueRef jsError)
{
  NSString *errorMessage = jsError ? ABI5_0_0RCTJSValueToNSString(context, jsError, NULL) : @"Unknown JS error";
  NSString *details = jsError ? ABI5_0_0RCTJSValueToJSONString(context, jsError, NULL, 2) : @"No details";
  return [NSError errorWithDomain:@"JS" code:1 userInfo:@{NSLocalizedDescriptionKey: errorMessage, NSLocalizedFailureReasonErrorKey: details}];
}

#if ABI5_0_0RCT_DEV

static void ABI5_0_0RCTInstallJSCProfiler(ABI5_0_0RCTBridge *bridge, JSContextRef context)
{
  if (ABI5_0_0RCTJSCProfilerIsSupported()) {
    [bridge.devMenu addItem:[ABI5_0_0RCTDevMenuItem toggleItemWithKey:ABI5_0_0RCTJSCProfilerEnabledDefaultsKey title:@"Start Profiling" selectedTitle:@"Stop Profiling" handler:^(BOOL shouldStart) {
      if (shouldStart != ABI5_0_0RCTJSCProfilerIsProfiling(context)) {
        if (shouldStart) {
          ABI5_0_0RCTJSCProfilerStart(context);
        } else {
          NSString *outputFile = ABI5_0_0RCTJSCProfilerStop(context);
          NSData *profileData = [NSData dataWithContentsOfFile:outputFile options:NSDataReadingMappedIfSafe error:NULL];
          ABI5_0_0RCTProfileSendResult(bridge, @"cpu-profile", profileData);
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
      ABI5_0_0RCTAssert(NO, @"not reached assertion"); // runloop spun. that's bad.
    }
  }
}

- (instancetype)init
{
  if (self = [super init]) {
    _valid = YES;

    _javaScriptThread = [[NSThread alloc] initWithTarget:[self class]
                                                selector:@selector(runRunLoopThread)
                                                  object:nil];
    _javaScriptThread.name = ABI5_0_0RCTJSCThreadName;

    if ([_javaScriptThread respondsToSelector:@selector(setQualityOfService:)]) {
      [_javaScriptThread setQualityOfService:NSOperationQualityOfServiceUserInteractive];
    } else {
      _javaScriptThread.threadPriority = [NSThread mainThread].threadPriority;
    }

    [_javaScriptThread start];
  }

  return self;
}

- (ABI5_0_0RCTJavaScriptContext *)context
{
  ABI5_0_0RCTAssertThread(_javaScriptThread, @"Must be called on JS thread.");

  if (!self.isValid) {
    return nil;
  }

  if (!_context) {
    JSContext *context = [JSContext new];
    _context = [[ABI5_0_0RCTJavaScriptContext alloc] initWithJSContext:context onThread:_javaScriptThread];
  }

  return _context;
}

- (void)addSynchronousHookWithName:(NSString *)name usingBlock:(id)block
{
  __weak ABI5_0_0RCTJSCExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:^{
    weakSelf.context.context[name] = block;
  }];
}

- (void)setUp
{
  __weak ABI5_0_0RCTJSCExecutor *weakSelf = self;
  [self addSynchronousHookWithName:@"noop" usingBlock:^{}];

  [self addSynchronousHookWithName:@"nativeLoggingHook" usingBlock:^(NSString *message, NSNumber *logLevel) {
    ABI5_0_0RCTLogLevel level = ABI5_0_0RCTLogLevelInfo;
    if (logLevel) {
      level = MAX(level, logLevel.integerValue);
    }

    _ABI5_0_0RCTLogJavaScriptInternal(level, message);
  }];

  [self addSynchronousHookWithName:@"nativeRequireModuleConfig" usingBlock:^NSString *(NSString *moduleName) {
    ABI5_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid) {
      return nil;
    }

    ABI5_0_0RCT_PROFILE_BEGIN_EVENT(0, @"nativeRequireModuleConfig", nil);
    NSArray *config = [strongSelf->_bridge configForModuleName:moduleName];
    NSString *result = config ? ABI5_0_0RCTJSONStringify(config, NULL) : nil;
    ABI5_0_0RCT_PROFILE_END_EVENT(0, @"js_call,config", @{ @"moduleName": moduleName });
    return result;
  }];

  [self addSynchronousHookWithName:@"nativeFlushQueueImmediate" usingBlock:^(NSArray<NSArray *> *calls){
    ABI5_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid || !calls) {
      return;
    }

    ABI5_0_0RCT_PROFILE_BEGIN_EVENT(0, @"nativeFlushQueueImmediate", nil);
    [strongSelf->_bridge handleBuffer:calls batchEnded:NO];
    ABI5_0_0RCT_PROFILE_END_EVENT(0, @"js_call", nil);
  }];

  [self addSynchronousHookWithName:@"nativePerformanceNow" usingBlock:^{
    return @(CACurrentMediaTime() * 1000);
  }];

#if ABI5_0_0RCT_DEV
  if (ABI5_0_0RCTProfileIsProfiling()) {
    // Cheating, since it's not a "hook", but meh
    [self addSynchronousHookWithName:@"__ABI5_0_0RCTProfileIsProfiling" usingBlock:@YES];
  }

  CFMutableDictionaryRef cookieMap = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
  [self addSynchronousHookWithName:@"nativeTraceBeginAsyncSection" usingBlock:^(uint64_t tag, NSString *name, NSUInteger cookie) {
    NSUInteger newCookie = ABI5_0_0RCTProfileBeginAsyncEvent(tag, name, nil);
    CFDictionarySetValue(cookieMap, (const void *)cookie, (const void *)newCookie);
  }];

  [self addSynchronousHookWithName:@"nativeTraceEndAsyncSection" usingBlock:^(uint64_t tag, NSString *name, NSUInteger cookie) {
    NSUInteger newCookie = (NSUInteger)CFDictionaryGetValue(cookieMap, (const void *)cookie);
    ABI5_0_0RCTProfileEndAsyncEvent(tag, @"js,async", newCookie, name, @"JS async", nil);
    CFDictionaryRemoveValue(cookieMap, (const void *)cookie);
  }];

  [self addSynchronousHookWithName:@"nativeTraceBeginSection" usingBlock:^(NSNumber *tag, NSString *profileName){
    static int profileCounter = 1;
    if (!profileName) {
      profileName = [NSString stringWithFormat:@"Profile %d", profileCounter++];
    }

    ABI5_0_0RCT_PROFILE_BEGIN_EVENT(tag.longLongValue, profileName, nil);
  }];

  [self addSynchronousHookWithName:@"nativeTraceEndSection" usingBlock:^(NSNumber *tag) {
    ABI5_0_0RCT_PROFILE_END_EVENT(tag.longLongValue, @"console", nil);
  }];

  __weak ABI5_0_0RCTBridge *weakBridge = _bridge;
#ifndef __clang_analyzer__
  _bridge.flowIDMap = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
#endif
  _bridge.flowIDMapLock = [NSLock new];
  [self addSynchronousHookWithName:@"nativeTraceBeginAsyncFlow" usingBlock:^(__unused uint64_t tag, __unused NSString *name, int64_t cookie) {
    if (ABI5_0_0RCTProfileIsProfiling()) {
      [weakBridge.flowIDMapLock lock];
      int64_t newCookie = [_ABI5_0_0RCTProfileBeginFlowEvent() longLongValue];
      CFDictionarySetValue(weakBridge.flowIDMap, (const void *)cookie, (const void *)newCookie);
      [weakBridge.flowIDMapLock unlock];
    }
  }];

  [self addSynchronousHookWithName:@"nativeTraceEndAsyncFlow" usingBlock:^(__unused uint64_t tag, __unused NSString *name, int64_t cookie) {
    if (ABI5_0_0RCTProfileIsProfiling()) {
      [weakBridge.flowIDMapLock lock];
      int64_t newCookie = (int64_t)CFDictionaryGetValue(weakBridge.flowIDMap, (const void *)cookie);
      _ABI5_0_0RCTProfileEndFlowEvent(@(newCookie));
      CFDictionaryRemoveValue(weakBridge.flowIDMap, (const void *)cookie);
      [weakBridge.flowIDMapLock unlock];
    }
  }];

  [self executeBlockOnJavaScriptQueue:^{
    ABI5_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid) {
      return;
    }

    JSContext *context = strongSelf.context.context;
    ABI5_0_0RCTInstallJSCProfiler(_bridge, context.JSGlobalContextRef);

    [[NSNotificationCenter defaultCenter] postNotificationName:ABI5_0_0RCTJavaScriptContextCreatedNotification
                                                        object:context];
  }];

  for (NSString *event in @[ABI5_0_0RCTProfileDidStartProfiling, ABI5_0_0RCTProfileDidEndProfiling]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(toggleProfilingFlag:)
                                                 name:event
                                               object:nil];
  }

  // Inject handler used by HMR
  [self addSynchronousHookWithName:@"nativeInjectHMRUpdate" usingBlock:^(NSString *sourceCode, NSString *sourceCodeURL) {
    ABI5_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid) {
      return;
    }

    JSStringRef execJSString = JSStringCreateWithUTF8CString(sourceCode.UTF8String);
    JSStringRef jsURL = JSStringCreateWithUTF8CString(sourceCodeURL.UTF8String);
    JSEvaluateScript(strongSelf->_context.ctx, execJSString, NULL, jsURL, 0, NULL);
    JSStringRelease(jsURL);
    JSStringRelease(execJSString);
  }];
#endif
}

- (void)toggleProfilingFlag:(NSNotification *)notification
{
  [self executeBlockOnJavaScriptQueue:^{
    BOOL enabled = [notification.name isEqualToString:ABI5_0_0RCTProfileDidStartProfiling];
    [_bridge enqueueJSCall:@"Systrace.setEnabled" args:@[enabled ? @YES : @NO]];
  }];
}

- (void)invalidate
{
  if (!self.isValid) {
    return;
  }

  _valid = NO;

  if (_jsModules) {
    CFRelease(_jsModules);
    fclose(_bundle);
  }

#if ABI5_0_0RCT_DEV
  [[NSNotificationCenter defaultCenter] removeObserver:self];
#endif
}

- (void)dealloc
{
  [self invalidate];

  [_context performSelector:@selector(invalidate)
                   onThread:_javaScriptThread
                 withObject:nil
              waitUntilDone:NO];
  _context = nil;
}

- (void)flushedQueue:(ABI5_0_0RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"flushedQueue" arguments:@[] callback:onComplete];
}

- (void)callFunctionOnModule:(NSString *)module
                      method:(NSString *)method
                   arguments:(NSArray *)args
                    callback:(ABI5_0_0RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"callFunctionReturnFlushedQueue" arguments:@[module, method, args] callback:onComplete];
}

- (void)invokeCallbackID:(NSNumber *)cbID
               arguments:(NSArray *)args
                callback:(ABI5_0_0RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"invokeCallbackAndReturnFlushedQueue" arguments:@[cbID, args] callback:onComplete];
}

- (void)_executeJSCall:(NSString *)method
             arguments:(NSArray *)arguments
              callback:(ABI5_0_0RCTJavaScriptCallback)onComplete
{
  ABI5_0_0RCTAssert(onComplete != nil, @"onComplete block should not be nil");
  __weak ABI5_0_0RCTJSCExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:ABI5_0_0RCTProfileBlock((^{
    ABI5_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }
    NSError *error;
    NSString *argsString = (arguments.count == 1) ? ABI5_0_0RCTJSONStringify(arguments[0], &error) : ABI5_0_0RCTJSONStringify(arguments, &error);
    if (!argsString) {
      ABI5_0_0RCTLogError(@"Cannot convert argument to string: %@", error);
      onComplete(nil, error);
      return;
    }

    JSValueRef errorJSRef = NULL;
    JSValueRef resultJSRef = NULL;
    JSGlobalContextRef contextJSRef = JSContextGetGlobalContext(strongSelf->_context.ctx);
    JSObjectRef globalObjectJSRef = JSContextGetGlobalObject(strongSelf->_context.ctx);

    // get the BatchedBridge object
    JSStringRef moduleNameJSStringRef = JSStringCreateWithUTF8CString("__fbBatchedBridge");
    JSValueRef moduleJSRef = JSObjectGetProperty(contextJSRef, globalObjectJSRef, moduleNameJSStringRef, &errorJSRef);
    JSStringRelease(moduleNameJSStringRef);

    if (moduleJSRef != NULL && errorJSRef == NULL && !JSValueIsUndefined(contextJSRef, moduleJSRef)) {
      // get method
      JSStringRef methodNameJSStringRef = JSStringCreateWithCFString((__bridge CFStringRef)method);
      JSValueRef methodJSRef = JSObjectGetProperty(contextJSRef, (JSObjectRef)moduleJSRef, methodNameJSStringRef, &errorJSRef);
      JSStringRelease(methodNameJSStringRef);

      if (methodJSRef != NULL && errorJSRef == NULL && !JSValueIsUndefined(contextJSRef, methodJSRef)) {
        // direct method invoke with no arguments
        if (arguments.count == 0) {
          resultJSRef = JSObjectCallAsFunction(contextJSRef, (JSObjectRef)methodJSRef, (JSObjectRef)moduleJSRef, 0, NULL, &errorJSRef);
        }

        // direct method invoke with 1 argument
        else if(arguments.count == 1) {
          JSStringRef argsJSStringRef = JSStringCreateWithCFString((__bridge CFStringRef)argsString);
          JSValueRef argsJSRef = JSValueMakeFromJSONString(contextJSRef, argsJSStringRef);
          resultJSRef = JSObjectCallAsFunction(contextJSRef, (JSObjectRef)methodJSRef, (JSObjectRef)moduleJSRef, 1, &argsJSRef, &errorJSRef);
          JSStringRelease(argsJSStringRef);

        } else {
          // apply invoke with array of arguments
          JSStringRef applyNameJSStringRef = JSStringCreateWithUTF8CString("apply");
          JSValueRef applyJSRef = JSObjectGetProperty(contextJSRef, (JSObjectRef)methodJSRef, applyNameJSStringRef, &errorJSRef);
          JSStringRelease(applyNameJSStringRef);

          if (applyJSRef != NULL && errorJSRef == NULL) {
            // invoke apply
            JSStringRef argsJSStringRef = JSStringCreateWithCFString((__bridge CFStringRef)argsString);
            JSValueRef argsJSRef = JSValueMakeFromJSONString(contextJSRef, argsJSStringRef);

            JSValueRef args[2];
            args[0] = JSValueMakeNull(contextJSRef);
            args[1] = argsJSRef;

            resultJSRef = JSObjectCallAsFunction(contextJSRef, (JSObjectRef)applyJSRef, (JSObjectRef)methodJSRef, 2, args, &errorJSRef);
            JSStringRelease(argsJSStringRef);
          }
        }
      } else {
        if (!errorJSRef && JSValueIsUndefined(contextJSRef, methodJSRef)) {
          error = ABI5_0_0RCTErrorWithMessage([NSString stringWithFormat:@"Unable to execute JS call: method %@ is undefined", method]);
        }
      }
    } else {
      if (!errorJSRef && JSValueIsUndefined(contextJSRef, moduleJSRef)) {
        error = ABI5_0_0RCTErrorWithMessage(@"Unable to execute JS call: __fbBatchedBridge is undefined");
      }
    }

    if (errorJSRef || error) {
      if (!error) {
        error = ABI5_0_0RCTNSErrorFromJSError(contextJSRef, errorJSRef);
      }
      onComplete(nil, error);
      return;
    }

    // Looks like making lots of JSC API calls is slower than communicating by using a JSON
    // string. Also it ensures that data stuctures don't have cycles and non-serializable fields.
    // see [ABI5_0_0RCTJSCExecutorTests testDeserializationPerf]
    id objcValue;
    // We often return `null` from JS when there is nothing for native side. JSONKit takes an extra hundred microseconds
    // to handle this simple case, so we are adding a shortcut to make executeJSCall method even faster
    if (!JSValueIsNull(contextJSRef, resultJSRef)) {
      JSStringRef jsJSONString = JSValueCreateJSONString(contextJSRef, resultJSRef, 0, nil);
      if (jsJSONString) {
        NSString *objcJSONString = (__bridge_transfer NSString *)JSStringCopyCFString(kCFAllocatorDefault, jsJSONString);
        JSStringRelease(jsJSONString);

        objcValue = ABI5_0_0RCTJSONParse(objcJSONString, NULL);
      }
    }

    onComplete(objcValue, nil);
  }), 0, @"js_call", (@{@"method": method, @"args": arguments}))];
}

- (void)executeApplicationScript:(NSData *)script
                       sourceURL:(NSURL *)sourceURL
                      onComplete:(ABI5_0_0RCTJavaScriptCompleteBlock)onComplete
{
  ABI5_0_0RCTAssertParam(script);
  ABI5_0_0RCTAssertParam(sourceURL);

  // The RAM bundle has a magic number in the 4 first bytes `(0xFB0BD1E5)`.
  uint32_t magicNumber = NSSwapLittleIntToHost(*((uint32_t *)script.bytes));
  BOOL isRAMBundle = magicNumber == ABI5_0_0RCTRAMBundleMagicNumber;
  if (isRAMBundle) {
    NSError *error;
    script = [self loadRAMBundle:sourceURL error:&error];

    if (error) {
      if (onComplete) {
        onComplete(error);
      }
      return;
    }
  } else {
    // JSStringCreateWithUTF8CString expects a null terminated C string.
    // RAM Bundling already provides a null terminated one.
    NSMutableData *nullTerminatedScript = [NSMutableData dataWithCapacity:script.length + 1];

    [nullTerminatedScript appendData:script];
    [nullTerminatedScript appendBytes:"" length:1];

    script = nullTerminatedScript;
  }

  _bundleURL = JSStringCreateWithUTF8CString(sourceURL.absoluteString.UTF8String);

  __weak ABI5_0_0RCTJSCExecutor *weakSelf = self;

  [self executeBlockOnJavaScriptQueue:ABI5_0_0RCTProfileBlock((^{
    ABI5_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }

    ABI5_0_0RCTPerformanceLoggerStart(ABI5_0_0RCTPLScriptExecution);

    JSValueRef jsError = NULL;
    JSStringRef execJSString = JSStringCreateWithUTF8CString(script.bytes);
    JSValueRef result = JSEvaluateScript(strongSelf->_context.ctx, execJSString, NULL, _bundleURL, 0, &jsError);
    JSStringRelease(execJSString);
    ABI5_0_0RCTPerformanceLoggerEnd(ABI5_0_0RCTPLScriptExecution);

    if (onComplete) {
      NSError *error;
      if (!result) {
        error = ABI5_0_0RCTNSErrorFromJSError(strongSelf->_context.ctx, jsError);
      }
      onComplete(error);
    }
  }), 0, @"js_call", (@{ @"url": sourceURL.absoluteString }))];
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
              callback:(ABI5_0_0RCTJavaScriptCompleteBlock)onComplete
{
  if (ABI5_0_0RCT_DEBUG) {
    ABI5_0_0RCTAssert(ABI5_0_0RCTJSONParse(script, NULL) != nil, @"%@ wasn't valid JSON!", script);
  }

  __weak ABI5_0_0RCTJSCExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:ABI5_0_0RCTProfileBlock((^{
    ABI5_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }
    JSStringRef execJSString = JSStringCreateWithCFString((__bridge CFStringRef)script);
    JSValueRef valueToInject = JSValueMakeFromJSONString(strongSelf->_context.ctx, execJSString);
    JSStringRelease(execJSString);

    if (!valueToInject) {
      NSString *errorDesc = [NSString stringWithFormat:@"Can't make JSON value from script '%@'", script];
      ABI5_0_0RCTLogError(@"%@", errorDesc);

      if (onComplete) {
        NSError *error = [NSError errorWithDomain:@"JS" code:2 userInfo:@{NSLocalizedDescriptionKey: errorDesc}];
        onComplete(error);
      }
      return;
    }

    JSObjectRef globalObject = JSContextGetGlobalObject(strongSelf->_context.ctx);
    JSStringRef JSName = JSStringCreateWithCFString((__bridge CFStringRef)objectName);
    JSObjectSetProperty(strongSelf->_context.ctx, globalObject, JSName, valueToInject, kJSPropertyAttributeNone, NULL);
    JSStringRelease(JSName);
    if (onComplete) {
      onComplete(nil);
    }
  }), 0, @"js_call,json_call", (@{@"objectName": objectName}))];
}

static int streq(const char *a, const char *b)
{
  return strcmp(a, b) == 0;
}

static void freeModule(__unused CFAllocatorRef allocator, void *ptr)
{
  free(ptr);
}

static uint32_t readUint32(const void **ptr) {
  uint32_t data;
  memcpy(&data, *ptr, sizeof(uint32_t));
  data = NSSwapLittleIntToHost(data);
  *ptr += sizeof(uint32_t);
  return data;
}

static int readBundle(FILE *fd, size_t offset, size_t length, void *ptr) {
  if (fseek(fd, offset, SEEK_SET) != 0) {
   return 1;
  }

  if (fread(ptr, sizeof(uint8_t), length, fd) != length) {
    return 1;
  }

  return 0;
}

- (void)registerNativeRequire
{
  ABI5_0_0RCTPerformanceLoggerSet(ABI5_0_0RCTPLRAMNativeRequires, 0);
  ABI5_0_0RCTPerformanceLoggerSet(ABI5_0_0RCTPLRAMNativeRequiresCount, 0);
  ABI5_0_0RCTPerformanceLoggerSet(ABI5_0_0RCTPLRAMNativeRequiresSize, 0);

  __weak ABI5_0_0RCTJSCExecutor *weakSelf = self;
  [self addSynchronousHookWithName:@"nativeRequire" usingBlock:^(NSString *moduleName) {
    ABI5_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !moduleName) {
      return;
    }

    ABI5_0_0RCTPerformanceLoggerAdd(ABI5_0_0RCTPLRAMNativeRequiresCount, 1);
    ABI5_0_0RCTPerformanceLoggerAppendStart(ABI5_0_0RCTPLRAMNativeRequires);
    ABI5_0_0RCT_PROFILE_BEGIN_EVENT(0, [@"nativeRequire_" stringByAppendingString:moduleName], nil);

    ModuleData *data = (ModuleData *)CFDictionaryGetValue(strongSelf->_jsModules, moduleName.UTF8String);
    ABI5_0_0RCTPerformanceLoggerAdd(ABI5_0_0RCTPLRAMNativeRequiresSize, data->length);

    char bytes[data->length];
    if (readBundle(strongSelf->_bundle, data->offset, data->length, bytes) != 0) {
      ABI5_0_0RCTFatal(ABI5_0_0RCTErrorWithMessage(@"Error loading RAM module"));
      return;
    }
    JSStringRef code = JSStringCreateWithUTF8CString(bytes);
    JSValueRef jsError = NULL;
    JSValueRef result = JSEvaluateScript(strongSelf->_context.ctx, code, NULL, strongSelf->_bundleURL, data->lineNo, NULL);

    CFDictionaryRemoveValue(strongSelf->_jsModules, moduleName.UTF8String);
    JSStringRelease(code);

    ABI5_0_0RCT_PROFILE_END_EVENT(0, @"js_call", nil);
    ABI5_0_0RCTPerformanceLoggerAppendEnd(ABI5_0_0RCTPLRAMNativeRequires);

    if (!result) {
      dispatch_async(dispatch_get_main_queue(), ^{
        ABI5_0_0RCTFatal(ABI5_0_0RCTNSErrorFromJSError(strongSelf->_context.ctx, jsError));
        [strongSelf invalidate];
      });
    }
  }];
}

- (NSData *)loadRAMBundle:(NSURL *)sourceURL error:(NSError **)error
{
  ABI5_0_0RCTPerformanceLoggerStart(ABI5_0_0RCTPLRAMBundleLoad);
  _bundle = fopen(sourceURL.path.UTF8String, "r");
  if (!_bundle) {
    if (error) {
      *error = ABI5_0_0RCTErrorWithMessage([NSString stringWithFormat:@"Bundle %@ cannot be opened: %d", sourceURL.path, errno]);
    }
    return nil;
  }

  [self registerNativeRequire];

  // once a module has been loaded free its space from the heap, remove it from the index and release the module name
  CFDictionaryKeyCallBacks keyCallbacks = { 0, NULL, (CFDictionaryReleaseCallBack)freeModule, NULL, (CFDictionaryEqualCallBack)streq, (CFDictionaryHashCallBack)strlen };
  CFDictionaryValueCallBacks valueCallbacks = { 0, NULL, (CFDictionaryReleaseCallBack)freeModule, NULL, NULL };
  _jsModules = CFDictionaryCreateMutable(NULL, 0, &keyCallbacks, &valueCallbacks);

  uint32_t currentOffset = sizeof(uint32_t); // skip magic number

  uint32_t tableLength;
  if (readBundle(_bundle, currentOffset, sizeof(tableLength), &tableLength) != 0) {
    if (error) {
      *error = ABI5_0_0RCTErrorWithMessage(@"Error loading RAM Bundle");
    }
    return nil;
  }
  tableLength = NSSwapLittleIntToHost(tableLength);

  currentOffset += sizeof(uint32_t); // skip table length

  // base offset to add to every module's offset to skip the header of the RAM bundle
  uint32_t baseOffset = 4 + tableLength;

  char tableStart[tableLength];
  if (readBundle(_bundle, currentOffset, tableLength, tableStart) != 0) {
    if (error) {
      *error = ABI5_0_0RCTErrorWithMessage(@"Error loading RAM Bundle");
    }
    return nil;
  }

  void *tableCursor = tableStart;
  void *endOfTable = tableCursor + tableLength;

  while (tableCursor < endOfTable) {
    uint32_t nameLength = strlen((const char *)tableCursor);
    char *name = malloc(nameLength + 1);

    if (!name) {
      if (error) {
        *error = ABI5_0_0RCTErrorWithMessage(@"Error loading RAM Bundle");
      }
      return nil;
    }

    strcpy(name, tableCursor);

    // the space allocated for each module's metada gets freed when the module is injected into JSC on `nativeRequire`
    ModuleData *moduleData = malloc(sizeof(ModuleData));

    tableCursor += nameLength + 1; // null byte terminator

    moduleData->offset = baseOffset + readUint32((const void **)&tableCursor);
    moduleData->length = readUint32((const void **)&tableCursor);
    moduleData->lineNo = readUint32((const void **)&tableCursor);

    CFDictionarySetValue(_jsModules, name, moduleData);
  }

  ModuleData *startupData = ((ModuleData *)CFDictionaryGetValue(_jsModules, ""));

  void *startupCode;
  if (!(startupCode = malloc(startupData->length))) {
    if (error) {
      *error = ABI5_0_0RCTErrorWithMessage(@"Error loading RAM Bundle");
    }
    return nil;
  }

  if (readBundle(_bundle, startupData->offset, startupData->length, startupCode) != 0) {
    if (error) {
      *error = ABI5_0_0RCTErrorWithMessage(@"Error loading RAM Bundle");
    }
    free(startupCode);
    return nil;
  }
  ABI5_0_0RCTPerformanceLoggerEnd(ABI5_0_0RCTPLRAMBundleLoad);
  ABI5_0_0RCTPerformanceLoggerSet(ABI5_0_0RCTPLRAMStartupCodeSize, startupData->length);
  return [NSData dataWithBytesNoCopy:startupCode length:startupData->length freeWhenDone:YES];
}

ABI5_0_0RCT_EXPORT_METHOD(setContextName:(nonnull NSString *)name)
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wtautological-pointer-compare"
  if (JSGlobalContextSetName != NULL) {
#pragma clang diagnostic pop
    JSStringRef JSName = JSStringCreateWithCFString((__bridge CFStringRef)name);
    JSGlobalContextSetName(_context.ctx, JSName);
    JSStringRelease(JSName);
  }
}

@end
