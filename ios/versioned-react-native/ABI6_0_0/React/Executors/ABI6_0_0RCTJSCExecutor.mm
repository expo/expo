/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI6_0_0RCTJSCExecutor.h"

#import <cinttypes>
#import <memory>
#import <pthread.h>

#ifdef WITH_FB_JSC_TUNING
#include <string>
#include <fbjsc/jsc_config_ios.h>
#endif

#import <JavaScriptCore/JavaScriptCore.h>
#import <UIKit/UIDevice.h>

#import "ABI6_0_0RCTAssert.h"
#import "ABI6_0_0RCTBridge+Private.h"
#import "ABI6_0_0RCTDefines.h"
#import "ABI6_0_0RCTDevMenu.h"
#import "ABI6_0_0RCTJavaScriptLoader.h"
#import "ABI6_0_0RCTLog.h"
#import "ABI6_0_0RCTProfile.h"
#import "ABI6_0_0RCTPerformanceLogger.h"
#import "ABI6_0_0RCTUtils.h"
#import "ABI6_0_0RCTJSCProfiler.h"
#import "ABI6_0_0RCTRedBox.h"
#import "ABI6_0_0RCTSourceCode.h"

NSString *const ABI6_0_0RCTJSCThreadName = @"com.facebook.ReactABI6_0_0.JavaScript";

NSString *const ABI6_0_0RCTJavaScriptContextCreatedNotification = @"ABI6_0_0RCTJavaScriptContextCreatedNotification";

static NSString *const ABI6_0_0RCTJSCProfilerEnabledDefaultsKey = @"ABI6_0_0RCTJSCProfilerEnabled";

struct __attribute__((packed)) ModuleData {
  uint32_t offset;
  uint32_t size;
};

using file_ptr = std::unique_ptr<FILE, decltype(&fclose)>;
using memory_ptr = std::unique_ptr<void, decltype(&free)>;
using table_ptr = std::unique_ptr<ModuleData[], decltype(&free)>;

struct RandomAccessBundleData {
  file_ptr bundle;
  size_t baseOffset;
  size_t numTableEntries;
  table_ptr table;
  RandomAccessBundleData(): bundle(nullptr, fclose), table(nullptr, free) {}
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

@interface ABI6_0_0RCTJavaScriptContext : NSObject <ABI6_0_0RCTInvalidating>

@property (nonatomic, strong, readonly) JSContext *context;
@property (nonatomic, assign, readonly) JSGlobalContextRef ctx;

- (instancetype)initWithJSContext:(JSContext *)context
                         onThread:(NSThread *)javaScriptThread NS_DESIGNATED_INITIALIZER;

@end

@implementation ABI6_0_0RCTJavaScriptContext
{
  ABI6_0_0RCTJavaScriptContext *_selfReference;
  NSThread *_javaScriptThread;
}

- (instancetype)initWithJSContext:(JSContext *)context
                         onThread:(NSThread *)javaScriptThread
{
  if ((self = [super init])) {
    _context = context;
    _javaScriptThread = javaScriptThread;

    /**
     * Explicitly introduce a retain cycle here - The ABI6_0_0RCTJSCExecutor might
     * be deallocated while there's still work enqueued in the JS thread, so
     * we wouldn't be able kill the JSContext. Instead we create this retain
     * cycle, and enqueue the -invalidate message in this object, it then
     * releases the JSContext, breaks the cycle and stops the runloop.
     */
    _selfReference = self;
  }
  return self;
}

ABI6_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

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
    ABI6_0_0RCTAssertThread(_javaScriptThread, @"Must be invalidated on JS thread.");

    _context = nil;
    _selfReference = nil;
    _javaScriptThread = nil;

    CFRunLoopStop([[NSRunLoop currentRunLoop] getCFRunLoop]);
  }
}

@end

@implementation ABI6_0_0RCTJSCExecutor
{
  ABI6_0_0RCTJavaScriptContext *_context;
  NSThread *_javaScriptThread;
  CFMutableDictionaryRef _cookieMap;

  JSStringRef _bundleURL;
  RandomAccessBundleData _randomAccessBundle;
}

@synthesize valid = _valid;
@synthesize bridge = _bridge;

ABI6_0_0RCT_EXPORT_MODULE()

static NSString *ABI6_0_0RCTJSValueToNSString(JSContextRef context, JSValueRef value, JSValueRef *exception)
{
  JSStringRef JSString = JSValueToStringCopy(context, value, exception);
  if (!JSString) {
    return nil;
  }

  CFStringRef string = JSStringCopyCFString(kCFAllocatorDefault, JSString);
  JSStringRelease(JSString);

  return (__bridge_transfer NSString *)string;
}

static NSString *ABI6_0_0RCTJSValueToJSONString(JSContextRef context, JSValueRef value, JSValueRef *exception, unsigned indent)
{
  JSStringRef JSString = JSValueCreateJSONString(context, value, indent, exception);
  CFStringRef string = JSStringCopyCFString(kCFAllocatorDefault, JSString);
  JSStringRelease(JSString);

  return (__bridge_transfer NSString *)string;
}

NSError *ABI6_0_0RCTNSErrorFromJSError(JSContextRef context, JSValueRef jsError)
{
  NSMutableDictionary *errorInfo = [NSMutableDictionary new];

  NSString *description = jsError ? ABI6_0_0RCTJSValueToNSString(context, jsError, NULL) : @"Unknown JS error";
  errorInfo[NSLocalizedDescriptionKey] = [@"Unhandled JS Exception: " stringByAppendingString:description];

  NSString *details = jsError ? ABI6_0_0RCTJSValueToJSONString(context, jsError, NULL, 0) : nil;
  if (details) {
    errorInfo[NSLocalizedFailureReasonErrorKey] = details;

    // Format stack as used in ABI6_0_0RCTFormatError
    id json = ABI6_0_0RCTJSONParse(details, NULL);
    if ([json isKindOfClass:[NSDictionary class]]) {
      if (json[@"stack"]) {
        NSError *regexError;
        NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"^([^@]+)@(.*):(\\d+):(\\d+)$" options:0 error:&regexError];
        if (regexError) {
          ABI6_0_0RCTLogError(@"Failed to build regex: %@", [regexError localizedDescription]);
        }

        NSMutableArray *stackTrace = [NSMutableArray array];
        for (NSString *stackLine in [json[@"stack"] componentsSeparatedByString:@"\n"]) {
          NSTextCheckingResult *result = [regex firstMatchInString:stackLine options:0 range:NSMakeRange(0, stackLine.length)];
          if (result) {
            [stackTrace addObject:@{
              @"methodName": [stackLine substringWithRange:[result rangeAtIndex:1]],
              @"file": [stackLine substringWithRange:[result rangeAtIndex:2]],
              @"lineNumber": [stackLine substringWithRange:[result rangeAtIndex:3]],
              @"column": [stackLine substringWithRange:[result rangeAtIndex:4]]
            }];
          }
        }
        if ([stackTrace count]) {
          errorInfo[ABI6_0_0RCTJSStackTraceKey] = stackTrace;
        }
      }

      // Fall back to just logging the line number
      if (!errorInfo[ABI6_0_0RCTJSStackTraceKey] && json[@"line"]) {
        errorInfo[ABI6_0_0RCTJSStackTraceKey] = @[@{
          @"methodName": @"",
          @"file": ABI6_0_0RCTNullIfNil(json[@"sourceURL"]),
          @"lineNumber": ABI6_0_0RCTNullIfNil(json[@"line"]),
          @"column": @0,
        }];
      }
    }
  }

  return [NSError errorWithDomain:ABI6_0_0RCTErrorDomain code:1 userInfo:errorInfo];
}

#if ABI6_0_0RCT_DEV

static void ABI6_0_0RCTInstallJSCProfiler(ABI6_0_0RCTBridge *bridge, JSContextRef context)
{
  if (ABI6_0_0RCTJSCProfilerIsSupported()) {
    [bridge.devMenu addItem:[ABI6_0_0RCTDevMenuItem toggleItemWithKey:ABI6_0_0RCTJSCProfilerEnabledDefaultsKey title:@"Start Profiling" selectedTitle:@"Stop Profiling" handler:^(BOOL shouldStart) {
      if (shouldStart != ABI6_0_0RCTJSCProfilerIsProfiling(context)) {
        if (shouldStart) {
          ABI6_0_0RCTJSCProfilerStart(context);
        } else {
          NSString *outputFile = ABI6_0_0RCTJSCProfilerStop(context);
          NSData *profileData = [NSData dataWithContentsOfFile:outputFile options:NSDataReadingMappedIfSafe error:NULL];
          ABI6_0_0RCTProfileSendResult(bridge, @"cpu-profile", profileData);
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
      ABI6_0_0RCTAssert(NO, @"not reached assertion"); // runloop spun. that's bad.
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
    _javaScriptThread.name = ABI6_0_0RCTJSCThreadName;

    if ([_javaScriptThread respondsToSelector:@selector(setQualityOfService:)]) {
      [_javaScriptThread setQualityOfService:NSOperationQualityOfServiceUserInteractive];
    } else {
      _javaScriptThread.threadPriority = [NSThread mainThread].threadPriority;
    }

    [_javaScriptThread start];
  }

  return self;
}

- (ABI6_0_0RCTJavaScriptContext *)context
{
  ABI6_0_0RCTAssertThread(_javaScriptThread, @"Must be called on JS thread.");

  if (!self.isValid) {
    return nil;
  }

  if (!_context) {
    JSContext *context = [JSContext new];
    _context = [[ABI6_0_0RCTJavaScriptContext alloc] initWithJSContext:context onThread:_javaScriptThread];

    [[NSNotificationCenter defaultCenter] postNotificationName:ABI6_0_0RCTJavaScriptContextCreatedNotification
                                                        object:context];
  }

  return _context;
}

- (void)addSynchronousHookWithName:(NSString *)name usingBlock:(id)block
{
  __weak ABI6_0_0RCTJSCExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:^{
    weakSelf.context.context[name] = block;
  }];
}

- (void)setUp
{
  __weak ABI6_0_0RCTJSCExecutor *weakSelf = self;

#ifdef WITH_FB_JSC_TUNING
  [self executeBlockOnJavaScriptQueue:^{
    ABI6_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid) {
      return;
    }

    NSString *cachesPath = [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) firstObject];
    ABI6_0_0RCTAssert(cachesPath != nil, @"cachesPath should not be nil");
    if (cachesPath) {
      std::string path = std::string([cachesPath UTF8String]);
      configureJSContextForIOS(strongSelf.context.ctx, path);
    }
  }];
#endif

  [self addSynchronousHookWithName:@"noop" usingBlock:^{}];

  [self addSynchronousHookWithName:@"nativeLoggingHook" usingBlock:^(NSString *message, NSNumber *logLevel) {
    ABI6_0_0RCTLogLevel level = ABI6_0_0RCTLogLevelInfo;
    if (logLevel) {
      level = MAX(level, (ABI6_0_0RCTLogLevel)logLevel.integerValue);
    }

    _ABI6_0_0RCTLogJavaScriptInternal(level, message);
  }];

  [self addSynchronousHookWithName:@"nativeRequireModuleConfig" usingBlock:^NSString *(NSString *moduleName) {
    ABI6_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid) {
      return nil;
    }

    ABI6_0_0RCT_PROFILE_BEGIN_EVENT(ABI6_0_0RCTProfileTagAlways, @"nativeRequireModuleConfig", nil);
    NSArray *config = [strongSelf->_bridge configForModuleName:moduleName];
    NSString *result = config ? ABI6_0_0RCTJSONStringify(config, NULL) : nil;
    ABI6_0_0RCT_PROFILE_END_EVENT(ABI6_0_0RCTProfileTagAlways, @"js_call,config", @{ @"moduleName": moduleName });
    return result;
  }];

  [self addSynchronousHookWithName:@"nativeFlushQueueImmediate" usingBlock:^(NSArray<NSArray *> *calls){
    ABI6_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid || !calls) {
      return;
    }

    ABI6_0_0RCT_PROFILE_BEGIN_EVENT(ABI6_0_0RCTProfileTagAlways, @"nativeFlushQueueImmediate", nil);
    [strongSelf->_bridge handleBuffer:calls batchEnded:NO];
    ABI6_0_0RCT_PROFILE_END_EVENT(ABI6_0_0RCTProfileTagAlways, @"js_call", nil);
  }];

  [self addSynchronousHookWithName:@"nativePerformanceNow" usingBlock:^{
    return @(CACurrentMediaTime() * 1000);
  }];

#if ABI6_0_0RCT_DEV
  if (ABI6_0_0RCTProfileIsProfiling()) {
    // Cheating, since it's not a "hook", but meh
    [self addSynchronousHookWithName:@"__ABI6_0_0RCTProfileIsProfiling" usingBlock:@YES];
  }

  _cookieMap = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
  [self addSynchronousHookWithName:@"nativeTraceBeginAsyncSection" usingBlock:^(uint64_t tag, NSString *name, NSUInteger cookie) {
    ABI6_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }
    NSUInteger newCookie = ABI6_0_0RCTProfileBeginAsyncEvent(tag, name, nil);
    CFDictionarySetValue(strongSelf->_cookieMap, (const void *)cookie, (const void *)newCookie);
  }];

  [self addSynchronousHookWithName:@"nativeTraceEndAsyncSection" usingBlock:^(uint64_t tag, NSString *name, NSUInteger cookie) {
    ABI6_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }
    NSUInteger newCookie = (NSUInteger)CFDictionaryGetValue(strongSelf->_cookieMap, (const void *)cookie);
    ABI6_0_0RCTProfileEndAsyncEvent(tag, @"js,async", newCookie, name, @"JS async", nil);
    CFDictionaryRemoveValue(strongSelf->_cookieMap, (const void *)cookie);
  }];

  [self addSynchronousHookWithName:@"nativeTraceBeginSection" usingBlock:^(NSNumber *tag, NSString *profileName){
    static int profileCounter = 1;
    if (!profileName) {
      profileName = [NSString stringWithFormat:@"Profile %d", profileCounter++];
    }

    ABI6_0_0RCT_PROFILE_BEGIN_EVENT(tag.longLongValue, profileName, nil);
  }];

  [self addSynchronousHookWithName:@"nativeTraceEndSection" usingBlock:^(NSNumber *tag) {
    ABI6_0_0RCT_PROFILE_END_EVENT(tag.longLongValue, @"console", nil);
  }];

  __weak ABI6_0_0RCTBridge *weakBridge = _bridge;
#ifndef __clang_analyzer__
  _bridge.flowIDMap = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
#endif
  _bridge.flowIDMapLock = [NSLock new];
  [self addSynchronousHookWithName:@"nativeTraceBeginAsyncFlow" usingBlock:^(__unused uint64_t tag, __unused NSString *name, int64_t cookie) {
    if (ABI6_0_0RCTProfileIsProfiling()) {
      [weakBridge.flowIDMapLock lock];
      int64_t newCookie = [_ABI6_0_0RCTProfileBeginFlowEvent() longLongValue];
      CFDictionarySetValue(weakBridge.flowIDMap, (const void *)cookie, (const void *)newCookie);
      [weakBridge.flowIDMapLock unlock];
    }
  }];

  [self addSynchronousHookWithName:@"nativeTraceEndAsyncFlow" usingBlock:^(__unused uint64_t tag, __unused NSString *name, int64_t cookie) {
    if (ABI6_0_0RCTProfileIsProfiling()) {
      [weakBridge.flowIDMapLock lock];
      int64_t newCookie = (int64_t)CFDictionaryGetValue(weakBridge.flowIDMap, (const void *)cookie);
      _ABI6_0_0RCTProfileEndFlowEvent(@(newCookie));
      CFDictionaryRemoveValue(weakBridge.flowIDMap, (const void *)cookie);
      [weakBridge.flowIDMapLock unlock];
    }
  }];

  [self executeBlockOnJavaScriptQueue:^{
    ABI6_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf.valid) {
      return;
    }

    JSContext *context = strongSelf.context.context;
    ABI6_0_0RCTInstallJSCProfiler(_bridge, context.JSGlobalContextRef);
  }];

  for (NSString *event in @[ABI6_0_0RCTProfileDidStartProfiling, ABI6_0_0RCTProfileDidEndProfiling]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(toggleProfilingFlag:)
                                                 name:event
                                               object:nil];
  }

  // Inject handler used by HMR
  [self addSynchronousHookWithName:@"nativeInjectHMRUpdate" usingBlock:^(NSString *sourceCode, NSString *sourceCodeURL) {
    ABI6_0_0RCTJSCExecutor *strongSelf = weakSelf;
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
    BOOL enabled = [notification.name isEqualToString:ABI6_0_0RCTProfileDidStartProfiling];
    [_bridge enqueueJSCall:@"Systrace.setEnabled" args:@[enabled ? @YES : @NO]];
  }];
}

- (void)invalidate
{
  if (!self.isValid) {
    return;
  }

  _valid = NO;

#if ABI6_0_0RCT_DEV
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

  _randomAccessBundle.bundle.reset();
  _randomAccessBundle.table.reset();
  if (_cookieMap) {
    CFRelease(_cookieMap);
  }
}

- (void)flushedQueue:(ABI6_0_0RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"flushedQueue" arguments:@[] callback:onComplete];
}

- (void)callFunctionOnModule:(NSString *)module
                      method:(NSString *)method
                   arguments:(NSArray *)args
                    callback:(ABI6_0_0RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"callFunctionReturnFlushedQueue" arguments:@[module, method, args] callback:onComplete];
}

- (void)invokeCallbackID:(NSNumber *)cbID
               arguments:(NSArray *)args
                callback:(ABI6_0_0RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"invokeCallbackAndReturnFlushedQueue" arguments:@[cbID, args] callback:onComplete];
}

- (void)_executeJSCall:(NSString *)method
             arguments:(NSArray *)arguments
              callback:(ABI6_0_0RCTJavaScriptCallback)onComplete
{
  ABI6_0_0RCTAssert(onComplete != nil, @"onComplete block should not be nil");
  __weak ABI6_0_0RCTJSCExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:ABI6_0_0RCTProfileBlock((^{
    ABI6_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }
    NSError *error;

    JSValueRef errorJSRef = NULL;
    JSValueRef resultJSRef = NULL;
    JSGlobalContextRef contextJSRef = JSContextGetGlobalContext(strongSelf->_context.ctx);
    JSContext *context = strongSelf->_context.context;
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
        JSValueRef jsArgs[arguments.count];
        for (NSUInteger i = 0; i < arguments.count; i++) {
          jsArgs[i] = [JSValue valueWithObject:arguments[i] inContext:context].JSValueRef;
        }
        resultJSRef = JSObjectCallAsFunction(contextJSRef, (JSObjectRef)methodJSRef, (JSObjectRef)moduleJSRef, arguments.count, jsArgs, &errorJSRef);
      } else {
        if (!errorJSRef && JSValueIsUndefined(contextJSRef, methodJSRef)) {
          error = ABI6_0_0RCTErrorWithMessage([NSString stringWithFormat:@"Unable to execute JS call: method %@ is undefined", method]);
        }
      }
    } else {
      if (!errorJSRef && JSValueIsUndefined(contextJSRef, moduleJSRef)) {
        error = ABI6_0_0RCTErrorWithMessage(@"Unable to execute JS call: __fbBatchedBridge is undefined");
      }
    }

    if (errorJSRef || error) {
      if (!error) {
        error = ABI6_0_0RCTNSErrorFromJSError(contextJSRef, errorJSRef);
      }
      onComplete(nil, error);
      return;
    }

    // Looks like making lots of JSC API calls is slower than communicating by using a JSON
    // string. Also it ensures that data stuctures don't have cycles and non-serializable fields.
    // see [ABI6_0_0RCTJSCExecutorTests testDeserializationPerf]
    id objcValue;
    // We often return `null` from JS when there is nothing for native side. JSONKit takes an extra hundred microseconds
    // to handle this simple case, so we are adding a shortcut to make executeJSCall method even faster
    if (!JSValueIsNull(contextJSRef, resultJSRef)) {
      objcValue = [[JSValue valueWithJSValueRef:resultJSRef inContext:context] toObject];
    }

    onComplete(objcValue, nil);
  }), 0, @"js_call", (@{@"method": method, @"args": arguments}))];
}

- (void)executeApplicationScript:(NSData *)script
                       sourceURL:(NSURL *)sourceURL
                      onComplete:(ABI6_0_0RCTJavaScriptCompleteBlock)onComplete
{
  ABI6_0_0RCTAssertParam(script);
  ABI6_0_0RCTAssertParam(sourceURL);

  // The RAM bundle has a magic number in the 4 first bytes `(0xFB0BD1E5)`.
  uint32_t magicNumber = NSSwapLittleIntToHost(*((uint32_t *)script.bytes));
  BOOL isRAMBundle = magicNumber == ABI6_0_0RCTRAMBundleMagicNumber;
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

  __weak ABI6_0_0RCTJSCExecutor *weakSelf = self;

  [self executeBlockOnJavaScriptQueue:ABI6_0_0RCTProfileBlock((^{
    ABI6_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }

    ABI6_0_0RCTPerformanceLoggerStart(ABI6_0_0RCTPLScriptExecution);

    JSValueRef jsError = NULL;
    JSStringRef execJSString = JSStringCreateWithUTF8CString((const char *)script.bytes);
    JSValueRef result = JSEvaluateScript(strongSelf->_context.ctx, execJSString, NULL, _bundleURL, 0, &jsError);
    JSStringRelease(execJSString);
    ABI6_0_0RCTPerformanceLoggerEnd(ABI6_0_0RCTPLScriptExecution);

    if (onComplete) {
      NSError *error;
      if (!result) {
        error = ABI6_0_0RCTNSErrorFromJSError(strongSelf->_context.ctx, jsError);
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
              callback:(ABI6_0_0RCTJavaScriptCompleteBlock)onComplete
{
  if (ABI6_0_0RCT_DEBUG) {
    ABI6_0_0RCTAssert(ABI6_0_0RCTJSONParse(script, NULL) != nil, @"%@ wasn't valid JSON!", script);
  }

  __weak ABI6_0_0RCTJSCExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:ABI6_0_0RCTProfileBlock((^{
    ABI6_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }
    JSStringRef execJSString = JSStringCreateWithCFString((__bridge CFStringRef)script);
    JSValueRef valueToInject = JSValueMakeFromJSONString(strongSelf->_context.ctx, execJSString);
    JSStringRelease(execJSString);

    if (!valueToInject) {
      NSString *errorDesc = [NSString stringWithFormat:@"Can't make JSON value from script '%@'", script];
      ABI6_0_0RCTLogError(@"%@", errorDesc);

      if (onComplete) {
        NSError *error = [NSError errorWithDomain:ABI6_0_0RCTErrorDomain code:2 userInfo:@{NSLocalizedDescriptionKey: errorDesc}];
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

static bool readRandomAccessModule(const RandomAccessBundleData& bundleData, size_t offset, size_t size, char *data)
{
  return fseek(bundleData.bundle.get(), offset + bundleData.baseOffset, SEEK_SET) == 0 &&
         fread(data, 1, size, bundleData.bundle.get()) == size;
}

static void executeRandomAccessModule(ABI6_0_0RCTJSCExecutor *executor, uint32_t moduleID, size_t offset, size_t size)
{
  auto data = std::unique_ptr<char[]>(new char[size]);
  if (!readRandomAccessModule(executor->_randomAccessBundle, offset, size, data.get())) {
    ABI6_0_0RCTFatal(ABI6_0_0RCTErrorWithMessage(@"Error loading RAM module"));
    return;
  }

  static char url[14]; // 10 = maximum decimal digits in a 32bit unsigned int + ".js" + null byte
  sprintf(url, "%" PRIu32 ".js", moduleID);

  JSStringRef code = JSStringCreateWithUTF8CString(data.get());
  JSValueRef jsError = NULL;
  JSStringRef sourceURL = JSStringCreateWithUTF8CString(url);
  JSValueRef result = JSEvaluateScript(executor->_context.ctx, code, NULL, sourceURL, 0, &jsError);

  JSStringRelease(code);
  JSStringRelease(sourceURL);

  if (!result) {
    dispatch_async(dispatch_get_main_queue(), ^{
      ABI6_0_0RCTFatal(ABI6_0_0RCTNSErrorFromJSError(executor->_context.ctx, jsError));
      [executor invalidate];
    });
  }
}

- (void)registerNativeRequire
{
  ABI6_0_0RCTPerformanceLoggerSet(ABI6_0_0RCTPLRAMNativeRequires, 0);
  ABI6_0_0RCTPerformanceLoggerSet(ABI6_0_0RCTPLRAMNativeRequiresCount, 0);
  ABI6_0_0RCTPerformanceLoggerSet(ABI6_0_0RCTPLRAMNativeRequiresSize, 0);

  __weak ABI6_0_0RCTJSCExecutor *weakSelf = self;
  [self addSynchronousHookWithName:@"nativeRequire" usingBlock:^(NSNumber *moduleID) {
    ABI6_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !moduleID) {
      return;
    }

    ABI6_0_0RCTPerformanceLoggerAdd(ABI6_0_0RCTPLRAMNativeRequiresCount, 1);
    ABI6_0_0RCTPerformanceLoggerAppendStart(ABI6_0_0RCTPLRAMNativeRequires);
    ABI6_0_0RCT_PROFILE_BEGIN_EVENT(ABI6_0_0RCTProfileTagAlways, 
                            [@"nativeRequire_" stringByAppendingFormat:@"%@", moduleID], nil);

    const uint32_t ID = [moduleID unsignedIntValue];

    if (ID < strongSelf->_randomAccessBundle.numTableEntries) {
      ModuleData *moduleData = &strongSelf->_randomAccessBundle.table[ID];
      const uint32_t size = NSSwapLittleIntToHost(moduleData->size);

      // sparse entry in the table -- module does not exist or is contained in the startup section
      if (size == 0) {
        return;
      }

      ABI6_0_0RCTPerformanceLoggerAdd(ABI6_0_0RCTPLRAMNativeRequiresSize, size);
      executeRandomAccessModule(strongSelf, ID, NSSwapLittleIntToHost(moduleData->offset), size);
    }

    ABI6_0_0RCT_PROFILE_END_EVENT(ABI6_0_0RCTProfileTagAlways, @"js_call", nil);
    ABI6_0_0RCTPerformanceLoggerAppendEnd(ABI6_0_0RCTPLRAMNativeRequires);
  }];
}

static RandomAccessBundleStartupCode readRAMBundle(file_ptr bundle, RandomAccessBundleData& randomAccessBundle)
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
  table_ptr table(static_cast<ModuleData *>(malloc(tableSize)), free);
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

- (NSData *)loadRAMBundle:(NSURL *)sourceURL error:(NSError **)error
{
  ABI6_0_0RCTPerformanceLoggerStart(ABI6_0_0RCTPLRAMBundleLoad);
  file_ptr bundle(fopen(sourceURL.path.UTF8String, "r"), fclose);
  if (!bundle) {
    if (error) {
      *error = ABI6_0_0RCTErrorWithMessage([NSString stringWithFormat:@"Bundle %@ cannot be opened: %d", sourceURL.path, errno]);
    }
    return nil;
  }

  [self registerNativeRequire];


  auto startupCode = readRAMBundle(std::move(bundle), _randomAccessBundle);
  if (startupCode.isEmpty()) {
    if (error) {
      *error = ABI6_0_0RCTErrorWithMessage(@"Error loading RAM Bundle");
    }
    return nil;
  }

  ABI6_0_0RCTPerformanceLoggerEnd(ABI6_0_0RCTPLRAMBundleLoad);
  ABI6_0_0RCTPerformanceLoggerSet(ABI6_0_0RCTPLRAMStartupCodeSize, startupCode.size);
  return [NSData dataWithBytesNoCopy:startupCode.code.release() length:startupCode.size freeWhenDone:YES];
}

ABI6_0_0RCT_EXPORT_METHOD(setContextName:(nonnull NSString *)name)
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
