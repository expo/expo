/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTJSCExecutor.h"

#import <cinttypes>
#import <memory>
#import <pthread.h>
#import <string>
#import <unordered_map>

#import <UIKit/UIDevice.h>

#import "ABI10_0_0RCTAssert.h"
#import "ABI10_0_0RCTBridge+Private.h"
#import "ABI10_0_0RCTDefines.h"
#import "ABI10_0_0RCTDevMenu.h"
#import "ABI10_0_0RCTJavaScriptLoader.h"
#import "ABI10_0_0RCTLog.h"
#import "ABI10_0_0RCTProfile.h"
#import "ABI10_0_0RCTPerformanceLogger.h"
#import "ABI10_0_0RCTUtils.h"
#import "ABI10_0_0RCTJSCProfiler.h"
#import "ABI10_0_0RCTRedBox.h"
#import "ABI10_0_0RCTSourceCode.h"
#import "ABI10_0_0RCTJSCWrapper.h"

NSString *const ABI10_0_0RCTJSCThreadName = @"com.facebook.ReactABI10_0_0.JavaScript";

NSString *const ABI10_0_0RCTJavaScriptContextCreatedNotification = @"ABI10_0_0RCTJavaScriptContextCreatedNotification";

static NSString *const ABI10_0_0RCTJSCProfilerEnabledDefaultsKey = @"ABI10_0_0RCTJSCProfilerEnabled";

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

#if ABI10_0_0RCT_PROFILE
@interface ABI10_0_0RCTCookieMap : NSObject
{
  @package
  std::unordered_map<NSUInteger, NSUInteger> _cookieMap;
}
@end
@implementation ABI10_0_0RCTCookieMap @end
#endif

struct ABI10_0_0RCTJSContextData {
  BOOL useCustomJSCLibrary;
  NSThread *javaScriptThread;
  JSContext *context;
  ABI10_0_0RCTJSCWrapper *jscWrapper;
};

@interface ABI10_0_0RCTJSContextProvider ()
/** May only be called once, or deadlock will result. */
- (ABI10_0_0RCTJSContextData)data;
@end

@interface ABI10_0_0RCTJavaScriptContext : NSObject <ABI10_0_0RCTInvalidating>

@property (nonatomic, strong, readonly) JSContext *context;

- (instancetype)initWithJSContext:(JSContext *)context
                         onThread:(NSThread *)javaScriptThread NS_DESIGNATED_INITIALIZER;

@end

@implementation ABI10_0_0RCTJavaScriptContext
{
  ABI10_0_0RCTJavaScriptContext *_selfReference;
  NSThread *_javaScriptThread;
}

- (instancetype)initWithJSContext:(JSContext *)context
                         onThread:(NSThread *)javaScriptThread
{
  if ((self = [super init])) {
    _context = context;
    _javaScriptThread = javaScriptThread;

    /**
     * Explicitly introduce a retain cycle here - The ABI10_0_0RCTJSCExecutor might
     * be deallocated while there's still work enqueued in the JS thread, so
     * we wouldn't be able kill the JSContext. Instead we create this retain
     * cycle, and enqueue the -invalidate message in this object, it then
     * releases the JSContext, breaks the cycle and stops the runloop.
     */
    _selfReference = self;
  }
  return self;
}

ABI10_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (BOOL)isValid
{
  return _context != nil;
}

- (void)invalidate
{
  if (self.isValid) {
    ABI10_0_0RCTAssertThread(_javaScriptThread, @"Must be invalidated on JS thread.");

    _context = nil;
    _selfReference = nil;
    _javaScriptThread = nil;

    CFRunLoopStop([[NSRunLoop currentRunLoop] getCFRunLoop]);
  }
}

@end

@implementation ABI10_0_0RCTJSCExecutor
{
  // Set at init time:
  BOOL _useCustomJSCLibrary;
  NSThread *_javaScriptThread;

  // Set at setUp time:
  ABI10_0_0RCTPerformanceLogger *_performanceLogger;
  ABI10_0_0RCTJSCWrapper *_jscWrapper;
  ABI10_0_0RCTJavaScriptContext *_context;

  // Set as needed:
  RandomAccessBundleData _randomAccessBundle;
  JSValueRef _batchedBridgeRef;
}

@synthesize valid = _valid;
@synthesize bridge = _bridge;

ABI10_0_0RCT_EXPORT_MODULE()

static NSString *ABI10_0_0RCTJSValueToNSString(ABI10_0_0RCTJSCWrapper *jscWrapper, JSContextRef context, JSValueRef value, JSValueRef *exception)
{
  JSStringRef JSString = jscWrapper->JSValueToStringCopy(context, value, exception);
  if (!JSString) {
    return nil;
  }

  CFStringRef string = jscWrapper->JSStringCopyCFString(kCFAllocatorDefault, JSString);
  jscWrapper->JSStringRelease(JSString);

  return (__bridge_transfer NSString *)string;
}

static NSString *ABI10_0_0RCTJSValueToJSONString(ABI10_0_0RCTJSCWrapper *jscWrapper, JSContextRef context, JSValueRef value, JSValueRef *exception, unsigned indent)
{
  JSStringRef jsString = jscWrapper->JSValueCreateJSONString(context, value, indent, exception);
  CFStringRef string = jscWrapper->JSStringCopyCFString(kCFAllocatorDefault, jsString);
  jscWrapper->JSStringRelease(jsString);

  return (__bridge_transfer NSString *)string;
}

static NSError *ABI10_0_0RCTNSErrorFromJSError(ABI10_0_0RCTJSCWrapper *jscWrapper, JSContextRef context, JSValueRef jsError)
{
  NSMutableDictionary *errorInfo = [NSMutableDictionary new];

  NSString *description = jsError ? ABI10_0_0RCTJSValueToNSString(jscWrapper, context, jsError, NULL) : @"Unknown JS error";
  errorInfo[NSLocalizedDescriptionKey] = [@"Unhandled JS Exception: " stringByAppendingString:description];

  NSString *details = jsError ? ABI10_0_0RCTJSValueToJSONString(jscWrapper, context, jsError, NULL, 0) : nil;
  if (details) {
    errorInfo[NSLocalizedFailureReasonErrorKey] = details;

    // Format stack as used in ABI10_0_0RCTFormatError
    id json = ABI10_0_0RCTJSONParse(details, NULL);
    if ([json isKindOfClass:[NSDictionary class]]) {
      if (json[@"stack"]) {
        NSError *regexError;
        NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"^([^@]+)@(.*):(\\d+):(\\d+)$" options:0 error:&regexError];
        if (regexError) {
          ABI10_0_0RCTLogError(@"Failed to build regex: %@", [regexError localizedDescription]);
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
          errorInfo[ABI10_0_0RCTJSStackTraceKey] = stackTrace;
        }
      }

      // Fall back to just logging the line number
      if (!errorInfo[ABI10_0_0RCTJSStackTraceKey] && json[@"line"]) {
        errorInfo[ABI10_0_0RCTJSStackTraceKey] = @[@{
          @"methodName": @"",
          @"file": ABI10_0_0RCTNullIfNil(json[@"sourceURL"]),
          @"lineNumber": ABI10_0_0RCTNullIfNil(json[@"line"]),
          @"column": @0,
        }];
      }
    }
  }

  return [NSError errorWithDomain:ABI10_0_0RCTErrorDomain code:1 userInfo:errorInfo];
}

- (NSError *)errorForJSError:(JSValue *)jsError
{
  return ABI10_0_0RCTNSErrorFromJSError(_jscWrapper, jsError.context.JSGlobalContextRef, jsError.JSValueRef);
}

#if ABI10_0_0RCT_DEV

static void ABI10_0_0RCTInstallJSCProfiler(ABI10_0_0RCTBridge *bridge, JSContextRef context)
{
  if (ABI10_0_0RCTJSCProfilerIsSupported()) {
    [bridge.devMenu addItem:[ABI10_0_0RCTDevMenuItem toggleItemWithKey:ABI10_0_0RCTJSCProfilerEnabledDefaultsKey title:@"Start Profiling" selectedTitle:@"Stop Profiling" handler:^(BOOL shouldStart) {
      if (shouldStart != ABI10_0_0RCTJSCProfilerIsProfiling(context)) {
        if (shouldStart) {
          ABI10_0_0RCTJSCProfilerStart(context);
        } else {
          NSString *outputFile = ABI10_0_0RCTJSCProfilerStop(context);
          NSData *profileData = [NSData dataWithContentsOfFile:outputFile options:NSDataReadingMappedIfSafe error:NULL];
          ABI10_0_0RCTProfileSendResult(bridge, @"cpu-profile", profileData);
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
      ABI10_0_0RCTAssert(NO, @"not reached assertion"); // runloop spun. that's bad.
    }
  }
}

static NSThread *newJavaScriptThread(void)
{
  NSThread *javaScriptThread = [[NSThread alloc] initWithTarget:[ABI10_0_0RCTJSCExecutor class]
                                                       selector:@selector(runRunLoopThread)
                                                         object:nil];
  javaScriptThread.name = ABI10_0_0RCTJSCThreadName;
  if ([javaScriptThread respondsToSelector:@selector(setQualityOfService:)]) {
    [javaScriptThread setQualityOfService:NSOperationQualityOfServiceUserInteractive];
  } else {
    javaScriptThread.threadPriority = [NSThread mainThread].threadPriority;
  }
  [javaScriptThread start];
  return javaScriptThread;
}

- (void)setBridge:(ABI10_0_0RCTBridge *)bridge
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
  ABI10_0_0RCT_PROFILE_BEGIN_EVENT(0, @"-[ABI10_0_0RCTJSCExecutor init]", nil);

  if (self = [super init]) {
    _useCustomJSCLibrary = useCustomJSCLibrary;
    _valid = YES;
    _javaScriptThread = newJavaScriptThread();
  }

  ABI10_0_0RCT_PROFILE_END_EVENT(0, @"", nil);
  return self;
}

+ (instancetype)initializedExecutorWithContextProvider:(ABI10_0_0RCTJSContextProvider *)JSContextProvider
                                     applicationScript:(NSData *)applicationScript
                                             sourceURL:(NSURL *)sourceURL
                                             JSContext:(JSContext **)JSContext
                                                 error:(NSError **)error
{
  const ABI10_0_0RCTJSContextData data = JSContextProvider.data;
  if (JSContext) {
    *JSContext = data.context;
  }
  ABI10_0_0RCTJSCExecutor *executor = [[ABI10_0_0RCTJSCExecutor alloc] initWithJSContextData:data];
  if (![executor _synchronouslyExecuteApplicationScript:applicationScript sourceURL:sourceURL JSContext:data.context error:error]) {
    return nil; // error has been set by _synchronouslyExecuteApplicationScript:
  }
  return executor;
}

- (instancetype)initWithJSContextData:(const ABI10_0_0RCTJSContextData &)data
{
  if (self = [super init]) {
    _useCustomJSCLibrary = data.useCustomJSCLibrary;
    _valid = YES;
    _javaScriptThread = data.javaScriptThread;
    _jscWrapper = data.jscWrapper;
    _context = [[ABI10_0_0RCTJavaScriptContext alloc] initWithJSContext:data.context onThread:_javaScriptThread];
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

- (ABI10_0_0RCTJavaScriptContext *)context
{
  ABI10_0_0RCTAssertThread(_javaScriptThread, @"Must be called on JS thread.");
  if (!self.isValid) {
    return nil;
  }
  ABI10_0_0RCTAssert(_context != nil, @"Fetching context while valid, but before it is created");
  return _context;
}

- (void)setUp
{
#if ABI10_0_0RCT_PROFILE
#ifndef __clang_analyzer__
  _bridge.flowIDMap = CFDictionaryCreateMutable(NULL, 0, NULL, NULL);
#endif
  _bridge.flowIDMapLock = [NSLock new];

  for (NSString *event in @[ABI10_0_0RCTProfileDidStartProfiling, ABI10_0_0RCTProfileDidEndProfiling]) {
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
      ABI10_0_0RCTAssert(self->_context != nil, @"If wrapper was pre-initialized, context should be too");
      context = self->_context.context;
    } else {
      [self->_performanceLogger markStartForTag:ABI10_0_0RCTPLJSCWrapperOpenLibrary];
      self->_jscWrapper = ABI10_0_0RCTJSCWrapperCreate(self->_useCustomJSCLibrary);
      [self->_performanceLogger markStopForTag:ABI10_0_0RCTPLJSCWrapperOpenLibrary];

      ABI10_0_0RCTAssert(self->_context == nil, @"Didn't expect to set up twice");
      context = [self->_jscWrapper->JSContext new];
      self->_context = [[ABI10_0_0RCTJavaScriptContext alloc] initWithJSContext:context onThread:self->_javaScriptThread];
      [[NSNotificationCenter defaultCenter] postNotificationName:ABI10_0_0RCTJavaScriptContextCreatedNotification
                                                          object:context];

      configureCacheOnContext(context, self->_jscWrapper);
      installBasicSynchronousHooksOnContext(context);
    }

    __weak ABI10_0_0RCTJSCExecutor *weakSelf = self;

    context[@"nativeRequireModuleConfig"] = ^NSString *(NSString *moduleName) {
      ABI10_0_0RCTJSCExecutor *strongSelf = weakSelf;
      if (!strongSelf.valid) {
        return nil;
      }

      ABI10_0_0RCT_PROFILE_BEGIN_EVENT(ABI10_0_0RCTProfileTagAlways, @"nativeRequireModuleConfig", nil);
      NSArray *config = [strongSelf->_bridge configForModuleName:moduleName];
      NSString *result = config ? ABI10_0_0RCTJSONStringify(config, NULL) : nil;
      ABI10_0_0RCT_PROFILE_END_EVENT(ABI10_0_0RCTProfileTagAlways, @"js_call,config", @{ @"moduleName": moduleName });
      return result;
    };

    context[@"nativeFlushQueueImmediate"] = ^(NSArray<NSArray *> *calls){
      ABI10_0_0RCTJSCExecutor *strongSelf = weakSelf;
      if (!strongSelf.valid || !calls) {
        return;
      }

      ABI10_0_0RCT_PROFILE_BEGIN_EVENT(ABI10_0_0RCTProfileTagAlways, @"nativeFlushQueueImmediate", nil);
      [strongSelf->_bridge handleBuffer:calls batchEnded:NO];
      ABI10_0_0RCT_PROFILE_END_EVENT(ABI10_0_0RCTProfileTagAlways, @"js_call", nil);
    };

    context[@"nativeCallSyncHook"] = ^id(NSUInteger module, NSUInteger method, NSArray *args) {
      ABI10_0_0RCTJSCExecutor *strongSelf = weakSelf;
      if (!strongSelf.valid) {
        return nil;
      }

      ABI10_0_0RCT_PROFILE_BEGIN_EVENT(ABI10_0_0RCTProfileTagAlways, @"nativeCallSyncHook", nil);
      id result = [strongSelf->_bridge callNativeModule:module method:method params:args];
      ABI10_0_0RCT_PROFILE_END_EVENT(ABI10_0_0RCTProfileTagAlways, @"js_call,config", nil);
      return result;
    };

#if ABI10_0_0RCT_PROFILE
    __weak ABI10_0_0RCTBridge *weakBridge = self->_bridge;
    context[@"nativeTraceBeginAsyncFlow"] = ^(__unused uint64_t tag, __unused NSString *name, int64_t cookie) {
      if (ABI10_0_0RCTProfileIsProfiling()) {
        [weakBridge.flowIDMapLock lock];
        NSUInteger newCookie = _ABI10_0_0RCTProfileBeginFlowEvent();
        CFDictionarySetValue(weakBridge.flowIDMap, (const void *)cookie, (const void *)newCookie);
        [weakBridge.flowIDMapLock unlock];
      }
    };

    context[@"nativeTraceEndAsyncFlow"] = ^(__unused uint64_t tag, __unused NSString *name, int64_t cookie) {
      if (ABI10_0_0RCTProfileIsProfiling()) {
        [weakBridge.flowIDMapLock lock];
        NSUInteger newCookie = (int64_t)CFDictionaryGetValue(weakBridge.flowIDMap, (const void *)cookie);
        _ABI10_0_0RCTProfileEndFlowEvent(newCookie);
        CFDictionaryRemoveValue(weakBridge.flowIDMap, (const void *)cookie);
        [weakBridge.flowIDMapLock unlock];
      }
    };
#endif

#if ABI10_0_0RCT_DEV
    ABI10_0_0RCTInstallJSCProfiler(self->_bridge, context.JSGlobalContextRef);

    // Inject handler used by HMR
    context[@"nativeInjectHMRUpdate"] = ^(NSString *sourceCode, NSString *sourceCodeURL) {
      ABI10_0_0RCTJSCExecutor *strongSelf = weakSelf;
      if (!strongSelf.valid) {
        return;
      }

      ABI10_0_0RCTJSCWrapper *jscWrapper = strongSelf->_jscWrapper;
      JSStringRef execJSString = jscWrapper->JSStringCreateWithUTF8CString(sourceCode.UTF8String);
      JSStringRef jsURL = jscWrapper->JSStringCreateWithUTF8CString(sourceCodeURL.UTF8String);
      jscWrapper->JSEvaluateScript(strongSelf->_context.context.JSGlobalContextRef, execJSString, NULL, jsURL, 0, NULL);
      jscWrapper->JSStringRelease(jsURL);
      jscWrapper->JSStringRelease(execJSString);
    };
#endif
  }];
}

/** If configureJSContextForIOS is available on jscWrapper, calls it with the correct parameters. */
static void configureCacheOnContext(JSContext *context, ABI10_0_0RCTJSCWrapper *jscWrapper)
{
  if (jscWrapper->configureJSContextForIOS != NULL) {
    NSString *cachesPath = [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) firstObject];
    ABI10_0_0RCTAssert(cachesPath != nil, @"cachesPath should not be nil");
    if (cachesPath) {
      jscWrapper->configureJSContextForIOS(context.JSGlobalContextRef, [cachesPath UTF8String]);
    }
  }
}

/** Installs synchronous hooks that don't require a weak reference back to the ABI10_0_0RCTJSCExecutor. */
static void installBasicSynchronousHooksOnContext(JSContext *context)
{
  context[@"noop"] = ^{};
  context[@"nativeLoggingHook"] = ^(NSString *message, NSNumber *logLevel) {
    ABI10_0_0RCTLogLevel level = ABI10_0_0RCTLogLevelInfo;
    if (logLevel) {
      level = MAX(level, (ABI10_0_0RCTLogLevel)logLevel.integerValue);
    }

    _ABI10_0_0RCTLogJavaScriptInternal(level, message);
  };
  context[@"nativePerformanceNow"] = ^{
    return @(CACurrentMediaTime() * 1000);
  };
#if ABI10_0_0RCT_PROFILE
  if (ABI10_0_0RCTProfileIsProfiling()) {
    // Cheating, since it's not a "hook", but meh
    context[@"__ABI10_0_0RCTProfileIsProfiling"] = @YES;
  }
  context[@"nativeTraceBeginSection"] = ^(NSNumber *tag, NSString *profileName, NSDictionary *args) {
    static int profileCounter = 1;
    if (!profileName) {
      profileName = [NSString stringWithFormat:@"Profile %d", profileCounter++];
    }

    ABI10_0_0RCT_PROFILE_BEGIN_EVENT(tag.longLongValue, profileName, args);
  };
  context[@"nativeTraceEndSection"] = ^(NSNumber *tag) {
    ABI10_0_0RCT_PROFILE_END_EVENT(tag.longLongValue, @"console", nil);
  };
  ABI10_0_0RCTCookieMap *cookieMap = [ABI10_0_0RCTCookieMap new];
  context[@"nativeTraceBeginAsyncSection"] = ^(uint64_t tag, NSString *name, NSUInteger cookie) {
    NSUInteger newCookie = ABI10_0_0RCTProfileBeginAsyncEvent(tag, name, nil);
    cookieMap->_cookieMap.insert({cookie, newCookie});
  };
  context[@"nativeTraceEndAsyncSection"] = ^(uint64_t tag, NSString *name, NSUInteger cookie) {
    NSUInteger newCookie = 0;
    const auto &it = cookieMap->_cookieMap.find(cookie);
    if (it != cookieMap->_cookieMap.end()) {
      newCookie = it->second;
      cookieMap->_cookieMap.erase(it);
    }
    ABI10_0_0RCTProfileEndAsyncEvent(tag, @"js,async", newCookie, name, @"JS async", nil);
  };
#endif
}

- (void)toggleProfilingFlag:(NSNotification *)notification
{
  [self executeBlockOnJavaScriptQueue:^{
    BOOL enabled = [notification.name isEqualToString:ABI10_0_0RCTProfileDidStartProfiling];
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

#if ABI10_0_0RCT_DEV
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

  if (_jscWrapper) {
    ABI10_0_0RCTJSCWrapperRelease(_jscWrapper);
    _jscWrapper = NULL;
  }
}

- (void)flushedQueue:(ABI10_0_0RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"flushedQueue" arguments:@[] unwrapResult:YES callback:onComplete];
}

- (void)_callFunctionOnModule:(NSString *)module
                       method:(NSString *)method
                    arguments:(NSArray *)args
                   flushQueue:(BOOL)flushQueue
                 unwrapResult:(BOOL)unwrapResult
                     callback:(ABI10_0_0RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  NSString *bridgeMethod = flushQueue ? @"callFunctionReturnFlushedQueue" : @"callFunction";
  [self _executeJSCall:bridgeMethod arguments:@[module, method, args] unwrapResult:unwrapResult callback:onComplete];
}

- (void)callFunctionOnModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args callback:(ABI10_0_0RCTJavaScriptCallback)onComplete
{
  [self _callFunctionOnModule:module method:method arguments:args flushQueue:YES unwrapResult:YES callback:onComplete];
}

- (void)callFunctionOnModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args jsValueCallback:(ABI10_0_0RCTJavaScriptValueCallback)onComplete
{
  [self _callFunctionOnModule:module method:method arguments:args flushQueue:NO unwrapResult:NO callback:onComplete];
}

- (void)invokeCallbackID:(NSNumber *)cbID
               arguments:(NSArray *)args
                callback:(ABI10_0_0RCTJavaScriptCallback)onComplete
{
  // TODO: Make this function handle first class instead of dynamically dispatching it. #9317773
  [self _executeJSCall:@"invokeCallbackAndReturnFlushedQueue" arguments:@[cbID, args] unwrapResult:YES callback:onComplete];
}

- (void)_executeJSCall:(NSString *)method
             arguments:(NSArray *)arguments
          unwrapResult:(BOOL)unwrapResult
              callback:(ABI10_0_0RCTJavaScriptCallback)onComplete
{
  ABI10_0_0RCTAssert(onComplete != nil, @"onComplete block should not be nil");
  __weak ABI10_0_0RCTJSCExecutor *weakSelf = self;
  [self executeBlockOnJavaScriptQueue:^{
    ABI10_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }

    ABI10_0_0RCT_PROFILE_BEGIN_EVENT(0, @"executeJSCall", @{@"method": method, @"args": arguments});

    ABI10_0_0RCTJSCWrapper *jscWrapper = strongSelf->_jscWrapper;
    JSContext *context = strongSelf->_context.context;
    JSGlobalContextRef ctx = context.JSGlobalContextRef;
    JSGlobalContextRef contextJSRef = jscWrapper->JSContextGetGlobalContext(ctx);

    // get the BatchedBridge object
    JSValueRef errorJSRef = NULL;
    JSValueRef batchedBridgeRef = strongSelf->_batchedBridgeRef;
    if (!batchedBridgeRef) {
      JSStringRef moduleNameJSStringRef = jscWrapper->JSStringCreateWithUTF8CString("__fbBatchedBridge");
      JSObjectRef globalObjectJSRef = jscWrapper->JSContextGetGlobalObject(ctx);
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
          error = ABI10_0_0RCTErrorWithMessage([NSString stringWithFormat:@"Unable to execute JS call: method %@ is undefined", method]);
        }
      }
    } else {
      if (!errorJSRef && jscWrapper->JSValueIsUndefined(contextJSRef, batchedBridgeRef)) {
        error = ABI10_0_0RCTErrorWithMessage(@"Unable to execute JS call: __fbBatchedBridge is undefined");
      }
    }

    id objcValue;
    if (errorJSRef || error) {
      if (!error) {
        error = ABI10_0_0RCTNSErrorFromJSError(jscWrapper, contextJSRef, errorJSRef);
      }
    } else {
      // We often return `null` from JS when there is nothing for native side. [JSValue toValue]
      // returns [NSNull null] in this case, which we don't want.
      if (!jscWrapper->JSValueIsNull(contextJSRef, resultJSRef)) {
        JSValue *result = [jscWrapper->JSValue valueWithJSValueRef:resultJSRef inContext:context];
        objcValue = unwrapResult ? [result toObject] : result;
      }
    }

    ABI10_0_0RCT_PROFILE_END_EVENT(0, @"js_call", nil);

    onComplete(objcValue, error);
  }];
}

- (void)executeApplicationScript:(NSData *)script
                       sourceURL:(NSURL *)sourceURL
                      onComplete:(ABI10_0_0RCTJavaScriptCompleteBlock)onComplete
{
  ABI10_0_0RCTAssertParam(script);
  ABI10_0_0RCTAssertParam(sourceURL);

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

  ABI10_0_0RCTProfileBeginFlowEvent();
  [self executeBlockOnJavaScriptQueue:^{
    ABI10_0_0RCTProfileEndFlowEvent();
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
                                                    ABI10_0_0RCTPerformanceLogger *performanceLogger,
                                                    BOOL &isRAMBundle, RandomAccessBundleData &randomAccessBundle,
                                                    NSError **error)
{
  ABI10_0_0RCT_PROFILE_BEGIN_EVENT(0, @"executeApplicationScript / prepare bundle", nil);

  // The RAM bundle has a magic number in the 4 first bytes `(0xFB0BD1E5)`.
  uint32_t magicNumber = 0;
  [script getBytes:&magicNumber length:sizeof(magicNumber)];
  isRAMBundle = NSSwapLittleIntToHost(magicNumber) == ABI10_0_0RCTRAMBundleMagicNumber;
  if (isRAMBundle) {
    [performanceLogger markStartForTag:ABI10_0_0RCTPLRAMBundleLoad];
    script = loadRAMBundle(sourceURL, error, randomAccessBundle);
    [performanceLogger markStopForTag:ABI10_0_0RCTPLRAMBundleLoad];
    [performanceLogger setValue:script.length forTag:ABI10_0_0RCTPLRAMStartupCodeSize];

    // Reset the counters that the native require implementation uses
    [performanceLogger setValue:0 forTag:ABI10_0_0RCTPLRAMNativeRequires];
    [performanceLogger setValue:0 forTag:ABI10_0_0RCTPLRAMNativeRequiresCount];
    [performanceLogger setValue:0 forTag:ABI10_0_0RCTPLRAMNativeRequiresSize];
  } else {
    // JSStringCreateWithUTF8CString expects a null terminated C string.
    // RAM Bundling already provides a null terminated one.
    NSMutableData *nullTerminatedScript = [NSMutableData dataWithCapacity:script.length + 1];
    [nullTerminatedScript appendData:script];
    [nullTerminatedScript appendBytes:"" length:1];
    script = nullTerminatedScript;
  }

  ABI10_0_0RCT_PROFILE_END_EVENT(0, @"", nil);
  return script;
}

static void registerNativeRequire(JSContext *context, ABI10_0_0RCTJSCExecutor *executor)
{
  __weak ABI10_0_0RCTJSCExecutor *weakExecutor = executor;
  context[@"nativeRequire"] = ^(NSNumber *moduleID) { [weakExecutor _nativeRequire:moduleID]; };
}

static NSError *executeApplicationScript(NSData *script, NSURL *sourceURL, ABI10_0_0RCTJSCWrapper *jscWrapper,
                                         ABI10_0_0RCTPerformanceLogger *performanceLogger, JSGlobalContextRef ctx)
{
  ABI10_0_0RCT_PROFILE_BEGIN_EVENT(0, @"executeApplicationScript / execute script",
                          @{ @"url": sourceURL.absoluteString, @"size": @(script.length) });
  [performanceLogger markStartForTag:ABI10_0_0RCTPLScriptExecution];
  JSValueRef jsError = NULL;
  JSStringRef execJSString = jscWrapper->JSStringCreateWithUTF8CString((const char *)script.bytes);
  JSStringRef bundleURL = jscWrapper->JSStringCreateWithUTF8CString(sourceURL.absoluteString.UTF8String);
  JSValueRef result = jscWrapper->JSEvaluateScript(ctx, execJSString, NULL, bundleURL, 0, &jsError);
  jscWrapper->JSStringRelease(bundleURL);
  jscWrapper->JSStringRelease(execJSString);
  [performanceLogger markStopForTag:ABI10_0_0RCTPLScriptExecution];
  NSError *error = result ? nil : ABI10_0_0RCTNSErrorFromJSError(jscWrapper, ctx, jsError);
  ABI10_0_0RCT_PROFILE_END_EVENT(0, @"js_call", nil);
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
              callback:(ABI10_0_0RCTJavaScriptCompleteBlock)onComplete
{
  if (ABI10_0_0RCT_DEBUG) {
    ABI10_0_0RCTAssert(ABI10_0_0RCTJSONParse(script, NULL) != nil, @"%@ wasn't valid JSON!", script);
  }

  __weak ABI10_0_0RCTJSCExecutor *weakSelf = self;
  ABI10_0_0RCTProfileBeginFlowEvent();
  [self executeBlockOnJavaScriptQueue:^{
    ABI10_0_0RCTProfileEndFlowEvent();

    ABI10_0_0RCTJSCExecutor *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.isValid) {
      return;
    }

    ABI10_0_0RCT_PROFILE_BEGIN_EVENT(0, @"injectJSONText", @{@"objectName": objectName});
    ABI10_0_0RCTJSCWrapper *jscWrapper = strongSelf->_jscWrapper;
    JSStringRef execJSString = jscWrapper->JSStringCreateWithCFString((__bridge CFStringRef)script);
    JSGlobalContextRef ctx = strongSelf->_context.context.JSGlobalContextRef;
    JSValueRef valueToInject = jscWrapper->JSValueMakeFromJSONString(ctx, execJSString);
    jscWrapper->JSStringRelease(execJSString);

    NSError *error;
    if (!valueToInject) {
      NSString *errorMessage = [NSString stringWithFormat:@"Can't make JSON value from script '%@'", script];
      error = [NSError errorWithDomain:ABI10_0_0RCTErrorDomain code:2 userInfo:@{NSLocalizedDescriptionKey: errorMessage}];
      ABI10_0_0RCTLogError(@"%@", errorMessage);
    } else {
      JSObjectRef globalObject = jscWrapper->JSContextGetGlobalObject(ctx);
      JSStringRef JSName = jscWrapper->JSStringCreateWithCFString((__bridge CFStringRef)objectName);
      JSValueRef jsError = NULL;
      jscWrapper->JSObjectSetProperty(ctx, globalObject, JSName, valueToInject, kJSPropertyAttributeNone, &jsError);
      jscWrapper->JSStringRelease(JSName);

      if (jsError) {
        error = ABI10_0_0RCTNSErrorFromJSError(jscWrapper, ctx, jsError);
      }
    }
    ABI10_0_0RCT_PROFILE_END_EVENT(0, @"js_call,json_call", nil);

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

static void executeRandomAccessModule(ABI10_0_0RCTJSCExecutor *executor, uint32_t moduleID, size_t offset, size_t size)
{
  auto data = std::make_unique<char[]>(size);
  if (!readRandomAccessModule(executor->_randomAccessBundle, offset, size, data.get())) {
    ABI10_0_0RCTFatal(ABI10_0_0RCTErrorWithMessage(@"Error loading RAM module"));
    return;
  }

  char url[14]; // 10 = maximum decimal digits in a 32bit unsigned int + ".js" + null byte
  sprintf(url, "%" PRIu32 ".js", moduleID);

  ABI10_0_0RCTJSCWrapper *jscWrapper = executor->_jscWrapper;
  JSStringRef code = jscWrapper->JSStringCreateWithUTF8CString(data.get());
  JSValueRef jsError = NULL;
  JSStringRef sourceURL = jscWrapper->JSStringCreateWithUTF8CString(url);
  JSGlobalContextRef ctx = executor->_context.context.JSGlobalContextRef;
  JSValueRef result = jscWrapper->JSEvaluateScript(ctx, code, NULL, sourceURL, 0, &jsError);

  jscWrapper->JSStringRelease(code);
  jscWrapper->JSStringRelease(sourceURL);

  if (!result) {
    dispatch_async(dispatch_get_main_queue(), ^{
      ABI10_0_0RCTFatal(ABI10_0_0RCTNSErrorFromJSError(jscWrapper, ctx, jsError));
      [executor invalidate];
    });
  }
}

- (void)_nativeRequire:(NSNumber *)moduleID
{
  if (!moduleID) {
    return;
  }

  [_performanceLogger addValue:1 forTag:ABI10_0_0RCTPLRAMNativeRequiresCount];
  [_performanceLogger appendStartForTag:ABI10_0_0RCTPLRAMNativeRequires];
  ABI10_0_0RCT_PROFILE_BEGIN_EVENT(ABI10_0_0RCTProfileTagAlways,
                          [@"nativeRequire_" stringByAppendingFormat:@"%@", moduleID], nil);

  const uint32_t ID = [moduleID unsignedIntValue];

  if (ID < _randomAccessBundle.numTableEntries) {
    ModuleData *moduleData = &_randomAccessBundle.table[ID];
    const uint32_t size = NSSwapLittleIntToHost(moduleData->size);

    // sparse entry in the table -- module does not exist or is contained in the startup section
    if (size == 0) {
      return;
    }

    [_performanceLogger addValue:size forTag:ABI10_0_0RCTPLRAMNativeRequiresSize];
    executeRandomAccessModule(self, ID, NSSwapLittleIntToHost(moduleData->offset), size);
  }

  ABI10_0_0RCT_PROFILE_END_EVENT(ABI10_0_0RCTProfileTagAlways, @"js_call", nil);
  [_performanceLogger appendStopForTag:ABI10_0_0RCTPLRAMNativeRequires];
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
      *error = ABI10_0_0RCTErrorWithMessage([NSString stringWithFormat:@"Bundle %@ cannot be opened: %d", sourceURL.path, errno]);
    }
    return nil;
  }

  auto startupCode = readRAMBundle(std::move(bundle), randomAccessBundle);
  if (startupCode.isEmpty()) {
    if (error) {
      *error = ABI10_0_0RCTErrorWithMessage(@"Error loading RAM Bundle");
    }
    return nil;
  }

  return [NSData dataWithBytesNoCopy:startupCode.code.release() length:startupCode.size freeWhenDone:YES];
}

ABI10_0_0RCT_EXPORT_METHOD(setContextName:(nonnull NSString *)name)
{
  if (_jscWrapper->JSGlobalContextSetName != NULL) {
    JSStringRef JSName = _jscWrapper->JSStringCreateWithCFString((__bridge CFStringRef)name);
    _jscWrapper->JSGlobalContextSetName(_context.context.JSGlobalContextRef, JSName);
    _jscWrapper->JSStringRelease(JSName);
  }
}

@end

@implementation ABI10_0_0RCTJSContextProvider
{
  dispatch_semaphore_t _semaphore;
  BOOL _useCustomJSCLibrary;
  NSThread *_javaScriptThread;
  JSContext *_context;
  ABI10_0_0RCTJSCWrapper *_jscWrapper;
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
  _jscWrapper = ABI10_0_0RCTJSCWrapperCreate(_useCustomJSCLibrary);
  _context = [_jscWrapper->JSContext new];
  configureCacheOnContext(_context, _jscWrapper);
  installBasicSynchronousHooksOnContext(_context);
  dispatch_semaphore_signal(_semaphore);
}

- (ABI10_0_0RCTJSContextData)data
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
