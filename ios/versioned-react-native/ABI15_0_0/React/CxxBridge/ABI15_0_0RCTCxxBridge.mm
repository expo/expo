// Copyright 2004-present Facebook. All Rights Reserved.

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "ABI15_0_0RCTCxxBridge.h"

#include <atomic>
#include <future>
#include <libkern/OSAtomic.h>

#import <ReactABI15_0_0/ABI15_0_0RCTAssert.h>
#import <ReactABI15_0_0/ABI15_0_0RCTBridge+Private.h>
#import <ReactABI15_0_0/ABI15_0_0RCTBridge.h>
#import <ReactABI15_0_0/ABI15_0_0RCTBridgeMethod.h>
#import <ReactABI15_0_0/ABI15_0_0RCTConvert.h>
#import <ReactABI15_0_0/ABI15_0_0RCTCxxModule.h>
#import <ReactABI15_0_0/ABI15_0_0RCTCxxUtils.h>
#import <ReactABI15_0_0/ABI15_0_0RCTDevLoadingView.h>
#import <ReactABI15_0_0/ABI15_0_0RCTDevSettings.h>
#import <ReactABI15_0_0/ABI15_0_0RCTDisplayLink.h>
#ifdef WITH_FBSYSTRACE
#import <ReactABI15_0_0/ABI15_0_0RCTFBSystrace.h>
#endif
#import <ReactABI15_0_0/ABI15_0_0RCTJavaScriptLoader.h>
#import <ReactABI15_0_0/ABI15_0_0RCTLog.h>
#import <ReactABI15_0_0/ABI15_0_0RCTModuleData.h>
#import <ReactABI15_0_0/ABI15_0_0RCTPerformanceLogger.h>
#import <ReactABI15_0_0/ABI15_0_0RCTProfile.h>
#import <ReactABI15_0_0/ABI15_0_0RCTRedBox.h>
#import <ReactABI15_0_0/ABI15_0_0RCTUtils.h>
#import <cxxReactABI15_0_0/ABI15_0_0CxxNativeModule.h>
#import <cxxReactABI15_0_0/ABI15_0_0Instance.h>
#import <cxxReactABI15_0_0/ABI15_0_0JSBundleType.h>
#import <cxxReactABI15_0_0/ABI15_0_0JSCExecutor.h>
#import <cxxReactABI15_0_0/ABI15_0_0JSIndexedRAMBundle.h>
#import <cxxReactABI15_0_0/ABI15_0_0Platform.h>
#import <ABI15_0_0jschelpers/ABI15_0_0Value.h>

#import "ABI15_0_0RCTMessageThread.h"
#import "ABI15_0_0RCTNativeModule.h"
#import "ABI15_0_0RCTObjcExecutor.h"

#define ABI15_0_0RCTAssertJSThread() \
  ABI15_0_0RCTAssert(self.executorClass || self->_jsThread == [NSThread currentThread], \
            @"This method must be called on JS thread")

NSString *const ABI15_0_0RCTJSThreadName = @"com.facebook.ReactABI15_0_0.JavaScript";

using namespace facebook::ReactABI15_0_0;

/**
 * Must be kept in sync with `MessageQueue.js`.
 */
typedef NS_ENUM(NSUInteger, ABI15_0_0RCTBridgeFields) {
  ABI15_0_0RCTBridgeFieldRequestModuleIDs = 0,
  ABI15_0_0RCTBridgeFieldMethodIDs,
  ABI15_0_0RCTBridgeFieldParams,
  ABI15_0_0RCTBridgeFieldCallID,
};

static JSValueRef nativeLoggingHook(
    JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  ABI15_0_0RCTLogLevel level = ABI15_0_0RCTLogLevelInfo;
  if (argumentCount > 1) {
    level = MAX(level, (ABI15_0_0RCTLogLevel)Value(ctx, arguments[1]).asNumber());
  }
  if (argumentCount > 0) {
    String message = Value(ctx, arguments[0]).toString();
    _ABI15_0_0RCTLogJavaScriptInternal(level, @(message.str().c_str()));
  }
  return Value::makeUndefined(ctx);
}

static JSValueRef nativePerformanceNow(
    JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  return Value::makeNumber(ctx, CACurrentMediaTime() * 1000);
}

static bool isRAMBundle(NSData *script) {
  BundleHeader header{};
  [script getBytes:&header length:sizeof(header)];
  return parseTypeFromHeader(header) == ScriptTag::RAMBundle;
}

static std::atomic_bool cxxBridgeEnabled(false);

namespace {

// ABI15_0_0RCTNativeModule arranges for native methods to be invoked on a queue which
// is not the JS thread.  C++ modules don't use ABI15_0_0RCTNativeModule, so this little
// adapter does the work.

class QueueNativeModule : public NativeModule {
public:
  QueueNativeModule(ABI15_0_0RCTCxxBridge *bridge,
                    std::unique_ptr<NativeModule> module)
    : bridge_(bridge)
    , module_(std::move(module))
    // Create new queue (store queueName, as it isn't retained by dispatch_queue)
    , queueName_("com.facebook.ReactABI15_0_0." + module_->getName() + "Queue")
    , queue_(dispatch_queue_create(queueName_.c_str(), DISPATCH_QUEUE_SERIAL)) {}

  std::string getName() override {
    return module_->getName();
  }

  std::vector<MethodDescriptor> getMethods() override {
    return module_->getMethods();
  }

  folly::dynamic getConstants() override {
    return module_->getConstants();
  }

  bool supportsWebWorkers() override {
    return module_->supportsWebWorkers();
  }

  void invoke(ExecutorToken token, unsigned int ReactABI15_0_0MethodId,
              folly::dynamic &&params) override {
    __weak ABI15_0_0RCTCxxBridge *bridge = bridge_;
    auto module = module_;
    auto cparams = std::make_shared<folly::dynamic>(std::move(params));
    dispatch_async(queue_, ^{
      if (!bridge || !bridge.valid) {
        return;
      }

      module->invoke(token, ReactABI15_0_0MethodId, std::move(*cparams));
    });
  }

  MethodCallResult callSerializableNativeHook(
      ExecutorToken token, unsigned int ReactABI15_0_0MethodId,
      folly::dynamic &&args) override {
    return module_->callSerializableNativeHook(token, ReactABI15_0_0MethodId, std::move(args));
  }

private:
  ABI15_0_0RCTCxxBridge *bridge_;
  std::shared_ptr<NativeModule> module_;
  std::string queueName_;
  dispatch_queue_t queue_;
};


// This is a temporary hack.  The cxx bridge assumes a single native
// queue handles all native method calls, but that's false on ios.  So
// this is a no-thread passthrough, and queues are handled in
// ABI15_0_0RCTNativeModule.  A similar refactoring should be done on the Java
// bridge.
class InlineMessageQueueThread : public MessageQueueThread {
public:
  void runOnQueue(std::function<void()>&& func) override { func(); }
  void runOnQueueSync(std::function<void()>&& func) override { func(); }
  void quitSynchronous() override {}
};

}

@interface ABI15_0_0RCTCxxBridge ()

@property (nonatomic, weak, readonly) ABI15_0_0RCTBridge *parentBridge;
@property (nonatomic, assign, readonly) BOOL moduleSetupComplete;

- (instancetype)initWithParentBridge:(ABI15_0_0RCTBridge *)bridge;
- (void)partialBatchDidFlush;
- (void)batchDidComplete;
- (void)handleError:(NSError *)error;

@end

struct ABI15_0_0RCTInstanceCallback : public InstanceCallback {
  __weak ABI15_0_0RCTCxxBridge *bridge_;
  ABI15_0_0RCTInstanceCallback(ABI15_0_0RCTCxxBridge *bridge): bridge_(bridge) {};
  void onBatchComplete() override {
    // There's no interface to call this per partial batch
    [bridge_ partialBatchDidFlush];
    [bridge_ batchDidComplete];
  }
  void incrementPendingJSCalls() override {}
  void decrementPendingJSCalls() override {}
  void onNativeException(const std::string &what) override {
    [bridge_ handleError:ABI15_0_0RCTErrorWithMessage(@(what.c_str()))];
  }
  ExecutorToken createExecutorToken() override {
    return ExecutorToken(std::make_shared<PlatformExecutorToken>());
  }
  void onExecutorStopped(ExecutorToken) override {}
};

@implementation ABI15_0_0RCTBridge (CxxBridge)

- (void)CXX_createBatchedBridge
{
  if (cxxBridgeEnabled) {
    self.batchedBridge = [[ABI15_0_0RCTCxxBridge alloc] initWithParentBridge:self];
  } else {
    self.batchedBridge = [[ABI15_0_0RCTBatchedBridge alloc] initWithParentBridge:self];
  }
}

@end

@implementation ABI15_0_0RCTCxxBridge
{
  BOOL _wasBatchActive;

  NSMutableArray<dispatch_block_t> *_pendingCalls;
  // This is accessed using OSAtomic... calls.
  volatile int32_t _pendingCount;

  // Native modules
  NSMutableDictionary<NSString *, ABI15_0_0RCTModuleData *> *_moduleDataByName;
  NSArray<ABI15_0_0RCTModuleData *> *_moduleDataByID;
  NSArray<Class> *_moduleClassesByID;
  NSUInteger _modulesInitializedOnMainQueue;
  ABI15_0_0RCTDisplayLink *_displayLink;

  // JS thread management
  NSThread *_jsThread;
  std::promise<std::shared_ptr<ABI15_0_0RCTMessageThread>> _jsMessageThreadPromise;
  std::shared_ptr<ABI15_0_0RCTMessageThread> _jsMessageThread;

  // This is uniquely owned, but weak_ptr is used.
  std::shared_ptr<Instance> _ReactABI15_0_0Instance;
}

@synthesize loading = _loading;
@synthesize valid = _valid;
@synthesize performanceLogger = _performanceLogger;

+ (void)initialize
{
  if (self == [ABI15_0_0RCTCxxBridge class]) {
    ReactABI15_0_0Marker::logMarker = [](const std::string&) {};
    PerfLogging::installNativeHooks = [](JSGlobalContextRef){};
    JSNativeHooks::loggingHook = nativeLoggingHook;
    JSNativeHooks::nowHook = nativePerformanceNow;
  }
}

+ (void)swizzleBridge
{
  // Swizzle ABI15_0_0RCTBridge to use this, instead of ABI15_0_0RCTBatchedBridge
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    ABI15_0_0RCTSwapInstanceMethods([ABI15_0_0RCTBridge class],
                           NSSelectorFromString(@"createBatchedBridge"),
                           @selector(CXX_createBatchedBridge));
  });
}

+ (void)enable
{
  [ABI15_0_0RCTCxxBridge swizzleBridge];
#ifdef WITH_FBSYSTRACE
  [ABI15_0_0RCTFBSystrace registerCallbacks];
#endif
  cxxBridgeEnabled = true;
}

+ (void)disable
{
  [ABI15_0_0RCTCxxBridge swizzleBridge];
#ifdef WITH_FBSYSTRACE
  [ABI15_0_0RCTFBSystrace unregisterCallbacks];
#endif
  cxxBridgeEnabled = false;
}

- (JSContext *)jsContext
{
  return contextForGlobalContextRef((JSGlobalContextRef) self->_ReactABI15_0_0Instance->getJavaScriptContext());
}

- (instancetype)initWithParentBridge:(ABI15_0_0RCTBridge *)bridge
{
  ABI15_0_0RCTAssertParam(bridge);

  if ((self = [super initWithDelegate:bridge.delegate
                            bundleURL:bridge.bundleURL
                       moduleProvider:bridge.moduleProvider
                        launchOptions:bridge.launchOptions])) {
    _parentBridge = bridge;
    _performanceLogger = [bridge performanceLogger];

    ABI15_0_0RCTLogInfo(@"Initializing %@ (parent: %@, executor: %@)", self, bridge, [self executorClass]);

    /**
     * Set Initial State
     */
    _valid = YES;
    _loading = YES;
    _pendingCalls = [NSMutableArray new];
    _displayLink = [ABI15_0_0RCTDisplayLink new];

    [ABI15_0_0RCTBridge setCurrentBridge:self];
  }
  return self;
}

- (void)runJSRunLoop
{
  @autoreleasepool {
    ABI15_0_0RCT_PROFILE_BEGIN_EVENT(ABI15_0_0RCTProfileTagAlways, @"-[ABI15_0_0RCTCxxBridge runJSRunLoop] setup", nil);

    // copy thread name to pthread name
    pthread_setname_np([NSThread currentThread].name.UTF8String);

    __typeof(self) weakSelf = self;
    _jsMessageThreadPromise.set_value(std::make_shared<ABI15_0_0RCTMessageThread>(
      [NSRunLoop currentRunLoop],
      ^(NSError *error) {
        if (error) {
          [weakSelf handleError:error];
        }
    }));

    // Set up a dummy runloop source to avoid spinning
    CFRunLoopSourceContext noSpinCtx = {0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL};
    CFRunLoopSourceRef noSpinSource = CFRunLoopSourceCreate(NULL, 0, &noSpinCtx);
    CFRunLoopAddSource(CFRunLoopGetCurrent(), noSpinSource, kCFRunLoopDefaultMode);
    CFRelease(noSpinSource);

    ABI15_0_0RCT_PROFILE_END_EVENT(ABI15_0_0RCTProfileTagAlways, @"");

    // run the run loop
    while (kCFRunLoopRunStopped != CFRunLoopRunInMode(kCFRunLoopDefaultMode, ((NSDate *)[NSDate distantFuture]).timeIntervalSinceReferenceDate, NO)) {
      ABI15_0_0RCTAssert(NO, @"not reached assertion"); // runloop spun. that's bad.
    }
  }
}

static NSError *tryAndReturnError(dispatch_block_t block) {
  // TODO #10487027: This is mostly duplicated in ABI15_0_0RCTMessageThread.
  try {
    @try {
      block();
      return nil;
    }
    @catch (NSException *exception) {
      NSString *message =
        [NSString stringWithFormat:@"Exception '%@' was thrown from JS thread", exception];
      return ABI15_0_0RCTErrorWithMessage(message);
    }
    @catch (id exception) {
      // This will catch any other ObjC exception, but no C++ exceptions
      return ABI15_0_0RCTErrorWithMessage(@"non-std ObjC Exception");
    }
  } catch (const JSException &ex) {
    // This is a special case.  We want to extract the stack
    // information and pass it to the redbox.  This will lose the C++
    // stack, but it's of limited value.
    NSDictionary *errorInfo = @{
      ABI15_0_0RCTJSRawStackTraceKey: @(ex.getStack().c_str()),
      NSLocalizedDescriptionKey: [@"Unhandled JS Exception: " stringByAppendingString:@(ex.what())]
    };
    return [NSError errorWithDomain:ABI15_0_0RCTErrorDomain code:1 userInfo:errorInfo];
  } catch (const std::exception &ex) {
    return ABI15_0_0RCTErrorWithMessage(@(ex.what()));
  } catch (...) {
    // On a 64-bit platform, this would catch ObjC exceptions, too, but not on
    // 32-bit platforms, so we catch those with id exceptions above.
    return ABI15_0_0RCTErrorWithMessage(@"non-std C++ exception");
  }
}

- (void)_tryAndHandleError:(dispatch_block_t)block
{
  NSError *error = tryAndReturnError(block);
  if (error) {
    [self handleError:error];
  }
}

- (void)executeBlockOnJavaScriptThread:(dispatch_block_t)block
{
  ABI15_0_0RCTAssert(_jsThread, @"This method must not be called before the JS thread is created");

  // This does not use _jsMessageThread because it may be called early
  // before the runloop reference is captured and _jsMessageThread is valid.

  if ([NSThread currentThread] == _jsThread) {
    [self _tryAndHandleError:block];
  } else {
    [self performSelector:@selector(_tryAndHandleError:)
          onThread:_jsThread
          withObject:block
          waitUntilDone:NO];
  }
}

- (void)start
{
  [[NSNotificationCenter defaultCenter]
    postNotificationName:ABI15_0_0RCTJavaScriptWillStartLoadingNotification
    object:_parentBridge userInfo:@{@"bridge": self}];

  // Set up the JS thread early
  _jsThread = [[NSThread alloc] initWithTarget:self
                                      selector:@selector(runJSRunLoop)
                                        object:nil];
  _jsThread.name = ABI15_0_0RCTJSThreadName;
  _jsThread.qualityOfService = NSOperationQualityOfServiceUserInteractive;
  [_jsThread start];

  dispatch_group_t initModulesAndLoadSource = dispatch_group_create();
  dispatch_queue_t bridgeQueue = dispatch_queue_create("com.facebook.ReactABI15_0_0.ABI15_0_0RCTBridgeQueue",
                                                       DISPATCH_QUEUE_SERIAL);

  // Initialize all native modules that cannot be loaded lazily
  [self _initModulesWithDispatchGroup:initModulesAndLoadSource];

  // This doesn't really do anything.  The real work happens in initializeBridge.
  _ReactABI15_0_0Instance.reset(new Instance);

  // Prepare executor factory (shared_ptr for copy into block)
  __weak ABI15_0_0RCTCxxBridge *weakSelf = self;
  std::shared_ptr<JSExecutorFactory> executorFactory;
  if (!self.executorClass) {
    BOOL useCustomJSC =
      [self.delegate respondsToSelector:@selector(shouldBridgeUseCustomJSC:)] &&
      [self.delegate shouldBridgeUseCustomJSC:self];
    // The arg is a cache dir.  It's not used with standard JSC.
    executorFactory.reset(new JSCExecutorFactory("", folly::dynamic::object
      ("UseCustomJSC", (bool)useCustomJSC)
#if ABI15_0_0RCT_PROFILE
      ("StartSamplingProfilerOnInit", (bool)self.devSettings.startSamplingProfilerOnLaunch)
#endif
    ));
  } else {
    id<ABI15_0_0RCTJavaScriptExecutor> objcExecutor = [self moduleForClass:self.executorClass];
    executorFactory.reset(new ABI15_0_0RCTObjcExecutorFactory(objcExecutor, ^(NSError *error) {
      if (error) {
        [weakSelf handleError:error];
      }
    }));
  }

  // Dispatch the instance initialization as soon as the initial module metadata has
  // been collected (see initModules)
  dispatch_group_async(initModulesAndLoadSource, bridgeQueue, ^{
    [weakSelf _initializeBridge:executorFactory];
  });

  // Optional load and execute JS source synchronously
  // TODO #10487027: should this be async on reload?
  if (!self.executorClass &&
      [self.delegate respondsToSelector:@selector(shouldBridgeLoadJavaScriptSynchronously:)] &&
      [self.delegate shouldBridgeLoadJavaScriptSynchronously:_parentBridge]) {
    NSError *error;
    const int32_t bcVersion = systemJSCWrapper()->JSBytecodeFileFormatVersion;
    NSData *sourceCode = [ABI15_0_0RCTJavaScriptLoader attemptSynchronousLoadOfBundleAtURL:self.bundleURL
                                                                 runtimeBCVersion:bcVersion
                                                                     sourceLength:NULL
                                                                            error:&error];

    if (error) {
      [self handleError:error];
    } else {
      [self executeSourceCode:sourceCode sync:YES];
    }
  } else {
    // Load the source asynchronously, then store it for later execution.
    dispatch_group_enter(initModulesAndLoadSource);
    __block NSData *sourceCode;
    [self loadSource:^(NSError *error, NSData *source, int64_t sourceLength) {
      if (error) {
        [weakSelf handleError:error];
      }

      sourceCode = source;
      dispatch_group_leave(initModulesAndLoadSource);
    } onProgress:^(ABI15_0_0RCTLoadingProgress *progressData) {
#ifdef ABI15_0_0RCT_DEV
      ABI15_0_0RCTDevLoadingView *loadingView = [weakSelf moduleForClass:[ABI15_0_0RCTDevLoadingView class]];
      [loadingView updateProgress:progressData];
#endif
    }];

    // Wait for both the modules and source code to have finished loading
    dispatch_group_notify(initModulesAndLoadSource, bridgeQueue, ^{
      ABI15_0_0RCTCxxBridge *strongSelf = weakSelf;
      if (sourceCode && strongSelf.loading) {
        [strongSelf executeSourceCode:sourceCode sync:NO];
      }
    });
  }
}

- (void)loadSource:(ABI15_0_0RCTSourceLoadBlock)_onSourceLoad onProgress:(ABI15_0_0RCTSourceLoadProgressBlock)onProgress
{
  [_performanceLogger markStartForTag:ABI15_0_0RCTPLScriptDownload];
  NSUInteger cookie = ABI15_0_0RCTProfileBeginAsyncEvent(0, @"JavaScript download", nil);

  // Suppress a warning if ABI15_0_0RCTProfileBeginAsyncEvent gets compiled out
  (void)cookie;

  ABI15_0_0RCTPerformanceLogger *performanceLogger = _performanceLogger;
  ABI15_0_0RCTSourceLoadBlock onSourceLoad = ^(NSError *error, NSData *source, int64_t sourceLength) {
    ABI15_0_0RCTProfileEndAsyncEvent(0, @"native", cookie, @"JavaScript download", @"JS async");
    [performanceLogger markStopForTag:ABI15_0_0RCTPLScriptDownload];
    [performanceLogger setValue:sourceLength forTag:ABI15_0_0RCTPLBundleSize];
    _onSourceLoad(error, source, sourceLength);
  };

  if ([self.delegate respondsToSelector:@selector(loadSourceForBridge:onProgress:onComplete:)]) {
    [self.delegate loadSourceForBridge:_parentBridge onProgress:onProgress onComplete:onSourceLoad];
  } else if ([self.delegate respondsToSelector:@selector(loadSourceForBridge:withBlock:)]) {
    [self.delegate loadSourceForBridge:_parentBridge withBlock:onSourceLoad];
  } else if (!self.bundleURL) {
    NSError *error = ABI15_0_0RCTErrorWithMessage(@"No bundle URL present.\n\nMake sure you're running a packager " \
                                         "server or have included a .jsbundle file in your application bundle.");
    onSourceLoad(error, nil, 0);
  } else {
    [ABI15_0_0RCTJavaScriptLoader loadBundleAtURL:self.bundleURL onProgress:onProgress onComplete:^(NSError *error, NSData *source, int64_t sourceLength) {
      if (error && [self.delegate respondsToSelector:@selector(fallbackSourceURLForBridge:)]) {
        NSURL *fallbackURL = [self.delegate fallbackSourceURLForBridge:self->_parentBridge];
        if (fallbackURL && ![fallbackURL isEqual:self.bundleURL]) {
          ABI15_0_0RCTLogError(@"Failed to load bundle(%@) with error:(%@)", self.bundleURL, error.localizedDescription);
          self.bundleURL = fallbackURL;
          [ABI15_0_0RCTJavaScriptLoader loadBundleAtURL:self.bundleURL onProgress:onProgress onComplete:onSourceLoad];
          return;
        }
      }
      onSourceLoad(error, source, sourceLength);
    }];
  }
}

- (NSArray<Class> *)moduleClasses
{
  if (ABI15_0_0RCT_DEBUG && _valid && _moduleClassesByID == nil) {
    ABI15_0_0RCTLogError(@"Bridge modules have not yet been initialized. You may be "
                "trying to access a module too early in the startup procedure.");
  }
  return _moduleClassesByID;
}

/**
 * Used by ABI15_0_0RCTUIManager
 */
- (ABI15_0_0RCTModuleData *)moduleDataForName:(NSString *)moduleName
{
  return _moduleDataByName[moduleName];
}

- (id)moduleForName:(NSString *)moduleName
{
  return _moduleDataByName[moduleName].instance;
}

- (BOOL)moduleIsInitialized:(Class)moduleClass
{
  return _moduleDataByName[ABI15_0_0RCTBridgeModuleNameForClass(moduleClass)].hasInstance;
}

- (std::shared_ptr<ModuleRegistry>)_createModuleRegistry
{
  if (!self.valid) {
    return {};
  }

  [_performanceLogger markStartForTag:ABI15_0_0RCTPLNativeModulePrepareConfig];
  ABI15_0_0RCT_PROFILE_BEGIN_EVENT(ABI15_0_0RCTProfileTagAlways, @"-[ABI15_0_0RCTCxxBridge createModuleRegistry]", nil);

  std::vector<std::unique_ptr<NativeModule>> modules;
  for (ABI15_0_0RCTModuleData *moduleData in _moduleDataByID) {
    // TODO mhorowitz #10487027: unwrap C++ modules and register them directly.
    if ([moduleData.moduleClass isSubclassOfClass:[ABI15_0_0RCTCxxModule class]]) {
      ABI15_0_0RCTCxxModule *cxxInstance = moduleData.instance;
      // If a module does not support automatic instantiation, and
      // wasn't provided as an extra module, it may not have an
      // instance.  If so, skip it.
      if (!cxxInstance) {
        continue;
      }
      modules.emplace_back(
        new QueueNativeModule(self, std::make_unique<CxxNativeModule>(
          _ReactABI15_0_0Instance, [cxxInstance move])));
    } else {
      modules.emplace_back(new ABI15_0_0RCTNativeModule(self, moduleData));
    }
  }

  auto registry = std::make_shared<ModuleRegistry>(std::move(modules));

  [_performanceLogger markStopForTag:ABI15_0_0RCTPLNativeModulePrepareConfig];
  ABI15_0_0RCT_PROFILE_END_EVENT(ABI15_0_0RCTProfileTagAlways, @"");

  return registry;
}

- (void)_initializeBridge:(std::shared_ptr<JSExecutorFactory>)executorFactory
{
  if (!self.valid) {
    return;
  }

  if (!_jsMessageThread) {
    _jsMessageThread = _jsMessageThreadPromise.get_future().get();
  }

  ABI15_0_0RCT_PROFILE_BEGIN_EVENT(ABI15_0_0RCTProfileTagAlways, @"-[ABI15_0_0RCTCxxBridge initializeBridge:]", nil);
  // This can only be false if the bridge was invalidated before startup completed
  if (_ReactABI15_0_0Instance) {
    // This is async, but any calls into JS are blocked by the m_syncReady CV in Instance
    _ReactABI15_0_0Instance->initializeBridge(
      std::unique_ptr<ABI15_0_0RCTInstanceCallback>(new ABI15_0_0RCTInstanceCallback(self)),
      executorFactory,
      _jsMessageThread,
      std::unique_ptr<MessageQueueThread>(new InlineMessageQueueThread),
      std::move([self _createModuleRegistry]));

#if ABI15_0_0RCT_PROFILE
    if (ABI15_0_0RCTProfileIsProfiling()) {
      _ReactABI15_0_0Instance->setGlobalVariable(
        "__ABI15_0_0RCTProfileIsProfiling",
        std::make_unique<JSBigStdString>("true"));
    }
#endif
  }

  ABI15_0_0RCT_PROFILE_END_EVENT(ABI15_0_0RCTProfileTagAlways, @"");
}

- (NSArray *)configForModuleName:(NSString *)moduleName
{
  ABI15_0_0RCTModuleData *moduleData = _moduleDataByName[moduleName];
  if (moduleData) {
#if ABI15_0_0RCT_DEV
    if ([self.delegate respondsToSelector:@selector(whitelistedModulesForBridge:)]) {
      NSArray *whitelisted = [self.delegate whitelistedModulesForBridge:self];
      ABI15_0_0RCTAssert(!whitelisted || [whitelisted containsObject:[moduleData moduleClass]],
                @"Required config for %@, which was not whitelisted", moduleName);
    }
#endif
  }
  return moduleData.config;
}

- (void)_initModulesWithDispatchGroup:(dispatch_group_t)dispatchGroup
{
  [_performanceLogger markStartForTag:ABI15_0_0RCTPLNativeModuleInit];

  ABI15_0_0RCT_PROFILE_BEGIN_EVENT(ABI15_0_0RCTProfileTagAlways,
                          @"-[ABI15_0_0RCTCxxBridge initModulesWithDispatchGroup:] extraModules", nil);
  NSArray<id<ABI15_0_0RCTBridgeModule>> *extraModules = nil;
  if (self.delegate) {
    if ([self.delegate respondsToSelector:@selector(extraModulesForBridge:)]) {
      extraModules = [self.delegate extraModulesForBridge:_parentBridge];
    }
  } else if (self.moduleProvider) {
    extraModules = self.moduleProvider();
  }
  ABI15_0_0RCT_PROFILE_END_EVENT(ABI15_0_0RCTProfileTagAlways, @"");

#if ABI15_0_0RCT_DEBUG
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    ABI15_0_0RCTVerifyAllModulesExported(extraModules);
  });
#endif

  NSMutableArray<Class> *moduleClassesByID = [NSMutableArray new];
  NSMutableArray<ABI15_0_0RCTModuleData *> *moduleDataByID = [NSMutableArray new];
  NSMutableDictionary<NSString *, ABI15_0_0RCTModuleData *> *moduleDataByName = [NSMutableDictionary new];

  ABI15_0_0RCT_PROFILE_BEGIN_EVENT(ABI15_0_0RCTProfileTagAlways,
                          @"-[ABI15_0_0RCTCxxBridge initModulesWithDispatchGroup:] preinitialized moduleData", nil);
  // Set up moduleData for pre-initialized module instances
  for (id<ABI15_0_0RCTBridgeModule> module in extraModules) {
    Class moduleClass = [module class];
    NSString *moduleName = ABI15_0_0RCTBridgeModuleNameForClass(moduleClass);

    if (ABI15_0_0RCT_DEBUG) {
      // Check for name collisions between preregistered modules
      ABI15_0_0RCTModuleData *moduleData = moduleDataByName[moduleName];
      if (moduleData) {
        ABI15_0_0RCTLogError(@"Attempted to register ABI15_0_0RCTBridgeModule class %@ for the "
                    "name '%@', but name was already registered by class %@",
                    moduleClass, moduleName, moduleData.moduleClass);
        continue;
      }
    }

    // Instantiate moduleData container
    ABI15_0_0RCTModuleData *moduleData = [[ABI15_0_0RCTModuleData alloc] initWithModuleInstance:module
                                                                       bridge:self];
    moduleDataByName[moduleName] = moduleData;
    [moduleClassesByID addObject:moduleClass];
    [moduleDataByID addObject:moduleData];
  }
  ABI15_0_0RCT_PROFILE_END_EVENT(ABI15_0_0RCTProfileTagAlways, @"");

  ABI15_0_0RCT_PROFILE_BEGIN_EVENT(ABI15_0_0RCTProfileTagAlways,
                          @"-[ABI15_0_0RCTCxxBridge initModulesWithDispatchGroup:] autoexported moduleData", nil);
  // Set up moduleData for automatically-exported modules
  for (Class moduleClass in ABI15_0_0RCTGetModuleClasses()) {
    NSString *moduleName = ABI15_0_0RCTBridgeModuleNameForClass(moduleClass);

    // Don't initialize the old executor in the new bridge.
    // TODO mhorowitz #10487027: after D3175632 lands, we won't need
    // this, because it won't be eagerly initialized.
    if ([moduleName isEqual:@"ABI15_0_0RCTJSCExecutor"]) {
      continue;
    }

    // Check for module name collisions
    ABI15_0_0RCTModuleData *moduleData = moduleDataByName[moduleName];
    if (moduleData) {
      if (moduleData.hasInstance) {
        // Existing module was preregistered, so it takes precedence
        continue;
      } else if ([moduleClass new] == nil) {
        // The new module returned nil from init, so use the old module
        continue;
      } else if ([moduleData.moduleClass new] != nil) {
        // Both modules were non-nil, so it's unclear which should take precedence
        ABI15_0_0RCTLogError(@"Attempted to register ABI15_0_0RCTBridgeModule class %@ for the "
                    "name '%@', but name was already registered by class %@",
                    moduleClass, moduleName, moduleData.moduleClass);
      }
    }

    // Instantiate moduleData
    // TODO #13258411: can we defer this until config generation?
    moduleData = [[ABI15_0_0RCTModuleData alloc] initWithModuleClass:moduleClass
                                                     bridge:self];
    moduleDataByName[moduleName] = moduleData;
    [moduleClassesByID addObject:moduleClass];
    [moduleDataByID addObject:moduleData];
  }
  ABI15_0_0RCT_PROFILE_END_EVENT(ABI15_0_0RCTProfileTagAlways, @"");

  // Store modules
  _moduleDataByID = [moduleDataByID copy];
  _moduleDataByName = [moduleDataByName copy];
  _moduleClassesByID = [moduleClassesByID copy];

  ABI15_0_0RCT_PROFILE_BEGIN_EVENT(ABI15_0_0RCTProfileTagAlways,
                          @"-[ABI15_0_0RCTCxxBridge initModulesWithDispatchGroup:] moduleData.hasInstance", nil);
  // Dispatch module init onto main thead for those modules that require it
  for (ABI15_0_0RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.hasInstance &&
        (!moduleData.requiresMainQueueSetup || ABI15_0_0RCTIsMainQueue())) {
      // Modules that were pre-initialized should ideally be set up before
      // bridge init has finished, otherwise the caller may try to access the
      // module directly rather than via `[bridge moduleForClass:]`, which won't
      // trigger the lazy initialization process. If the module cannot safely be
      // set up on the current thread, it will instead be async dispatched
      // to the main thread to be set up in the loop below.
      (void)[moduleData instance];
    }
  }
  ABI15_0_0RCT_PROFILE_END_EVENT(ABI15_0_0RCTProfileTagAlways, @"");

  // From this point on, ABI15_0_0RCTDidInitializeModuleNotification notifications will
  // be sent the first time a module is accessed.
  _moduleSetupComplete = YES;

  [self _prepareModulesWithDispatchGroup:dispatchGroup];

  [_performanceLogger markStopForTag:ABI15_0_0RCTPLNativeModuleInit];
  ABI15_0_0RCT_PROFILE_END_EVENT(ABI15_0_0RCTProfileTagAlways, @"");

#if ABI15_0_0RCT_PROFILE
  if (ABI15_0_0RCTProfileIsProfiling()) {
    // Depends on moduleDataByID being loaded
    ABI15_0_0RCTProfileHookModules(self);
  }
#endif
}

- (void)_prepareModulesWithDispatchGroup:(dispatch_group_t)dispatchGroup
{
  ABI15_0_0RCT_PROFILE_BEGIN_EVENT(0, @"-[ABI15_0_0RCTBatchedBridge prepareModulesWithDispatch]", nil);

  NSArray<Class> *whitelistedModules = nil;
  if ([self.delegate respondsToSelector:@selector(whitelistedModulesForBridge:)]) {
    whitelistedModules = [self.delegate whitelistedModulesForBridge:self];
  }

  BOOL initializeImmediately = NO;
  if (dispatchGroup == NULL) {
    // If no dispatchGroup is passed in, we must prepare everything immediately.
    // We better be on the right thread too.
    ABI15_0_0RCTAssertMainQueue();
    initializeImmediately = YES;
  } else if ([self.delegate respondsToSelector:@selector(shouldBridgeInitializeNativeModulesSynchronously:)]) {
    initializeImmediately = [self.delegate shouldBridgeInitializeNativeModulesSynchronously:self];
  }

  // Set up modules that require main thread init or constants export
  [_performanceLogger setValue:0 forTag:ABI15_0_0RCTPLNativeModuleMainThread];
  for (ABI15_0_0RCTModuleData *moduleData in _moduleDataByID) {
    if (whitelistedModules && ![whitelistedModules containsObject:[moduleData moduleClass]]) {
      continue;
    }

    if (moduleData.requiresMainQueueSetup || moduleData.hasConstantsToExport) {
      // Modules that need to be set up on the main thread cannot be initialized
      // lazily when required without doing a dispatch_sync to the main thread,
      // which can result in deadlock. To avoid this, we initialize all of these
      // modules on the main thread in parallel with loading the JS code, so
      // they will already be available before they are ever required.
      dispatch_block_t block = ^{
        if (self.valid && ![moduleData.moduleClass isSubclassOfClass:[ABI15_0_0RCTCxxModule class]]) {
          [self->_performanceLogger appendStartForTag:ABI15_0_0RCTPLNativeModuleMainThread];
          (void)[moduleData instance];
          [moduleData gatherConstants];
          [self->_performanceLogger appendStopForTag:ABI15_0_0RCTPLNativeModuleMainThread];
        }
      };

      if (initializeImmediately && ABI15_0_0RCTIsMainQueue()) {
        block();
      } else {
        // We've already checked that dispatchGroup is non-null, but this satisifies the
        // Xcode analyzer
        if (dispatchGroup) {
          dispatch_group_async(dispatchGroup, dispatch_get_main_queue(), block);
        }
      }
      _modulesInitializedOnMainQueue++;
    }
  }

  [_performanceLogger setValue:_modulesInitializedOnMainQueue forTag:ABI15_0_0RCTPLNativeModuleMainThreadUsesCount];
  ABI15_0_0RCT_PROFILE_END_EVENT(ABI15_0_0RCTProfileTagAlways, @"");
}

- (void)whitelistedModulesDidChange
{
  ABI15_0_0RCTAssertMainQueue();
  [self _prepareModulesWithDispatchGroup:NULL];
}

- (void)registerModuleForFrameUpdates:(id<ABI15_0_0RCTBridgeModule>)module
                       withModuleData:(ABI15_0_0RCTModuleData *)moduleData
{
  [_displayLink registerModuleForFrameUpdates:module withModuleData:moduleData];
}

- (void)executeSourceCode:(NSData *)sourceCode sync:(BOOL)sync
{
  // This will get called from whatever thread was actually executing JS.
  dispatch_block_t completion = ^{
    // Flush pending calls immediately so we preserve ordering
    [self _flushPendingCalls];

    // Perform the state update and notification on the main thread, so we can't run into
    // timing issues with ABI15_0_0RCTRootView
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter]
       postNotificationName:ABI15_0_0RCTJavaScriptDidLoadNotification
       object:self->_parentBridge userInfo:@{@"bridge": self}];

      // Starting the display link is not critical to startup, so do it last
      [self executeBlockOnJavaScriptThread:^{
        // Register the display link to start sending js calls after everything is setup
        [self->_displayLink addToRunLoop:[NSRunLoop currentRunLoop]];
      }];
    });
  };

  if (sync) {
    [self executeApplicationScriptSync:sourceCode url:self.bundleURL];
    completion();
  } else {
    [self enqueueApplicationScript:sourceCode url:self.bundleURL onComplete:completion];
  }

#if ABI15_0_0RCT_DEV
  if ([ABI15_0_0RCTGetURLQueryParam(self.bundleURL, @"hot") boolValue]) {
    NSString *path = [self.bundleURL.path substringFromIndex:1]; // strip initial slash
    NSString *host = self.bundleURL.host;
    NSNumber *port = self.bundleURL.port;
    [self enqueueJSCall:@"HMRClient"
                 method:@"enable"
                   args:@[@"ios", path, host, ABI15_0_0RCTNullIfNil(port)]
             completion:NULL];  }
#endif
}

- (void)handleError:(NSError *)error
{
  // This is generally called when the infrastructure throws an
  // exception while calling JS.  Most product exceptions will not go
  // through this method, but through ABI15_0_0RCTExceptionManager.

  // There are three possible states:
  // 1. initializing == _valid && _loading
  // 2. initializing/loading finished (success or failure) == _valid && !_loading
  // 3. invalidated == !_valid && !_loading

  // !_valid && _loading can't happen.

  // In state 1: on main queue, move to state 2, reset the bridge, and ABI15_0_0RCTFatal.
  // In state 2: go directly to ABI15_0_0RCTFatal.  Do not enqueue, do not collect $200.
  // In state 3: do nothing.

  if (self->_valid && !self->_loading) {
    if ([error userInfo][ABI15_0_0RCTJSRawStackTraceKey]) {
      [self.redBox showErrorMessage:[error localizedDescription]
                       withRawStack:[error userInfo][ABI15_0_0RCTJSRawStackTraceKey]];
    }

    ABI15_0_0RCTFatal(error);
    // RN will stop, but let the rest of the app keep going.
    return;
  }

  if (!_valid || !_loading) {
    return;
  }

  // Hack: once the bridge is invalidated below, it won't initialize any new native
  // modules. Initialize the redbox module now so we can still report this error.
  [self redBox];

  _loading = NO;
  _valid = NO;

  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_jsMessageThread) {
      auto thread = self->_jsMessageThread;
      self->_jsMessageThread->runOnQueue([thread] {
        thread->quitSynchronous();
      });
      self->_jsMessageThread.reset();
    }

    [[NSNotificationCenter defaultCenter]
     postNotificationName:ABI15_0_0RCTJavaScriptDidFailToLoadNotification
     object:self->_parentBridge userInfo:@{@"bridge": self, @"error": error}];

    if ([error userInfo][ABI15_0_0RCTJSRawStackTraceKey]) {
      [self.redBox showErrorMessage:[error localizedDescription]
                       withRawStack:[error userInfo][ABI15_0_0RCTJSRawStackTraceKey]];
    }

    ABI15_0_0RCTFatal(error);
  });
}

ABI15_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithBundleURL:(__unused NSURL *)bundleURL
                    moduleProvider:(__unused ABI15_0_0RCTBridgeModuleProviderBlock)block
                    launchOptions:(__unused NSDictionary *)launchOptions)

/**
 * Prevent super from calling setUp (that'd create another batchedBridge)
 */
- (void)setUp {}
- (void)bindKeys {}

- (void)reload
{
  [_parentBridge reload];
}

- (Class)executorClass
{
  return _parentBridge.executorClass;
}

- (void)setExecutorClass:(Class)executorClass
{
  ABI15_0_0RCTAssertMainQueue();

  _parentBridge.executorClass = executorClass;
}

- (NSURL *)bundleURL
{
  return _parentBridge.bundleURL;
}

- (void)setBundleURL:(NSURL *)bundleURL
{
  _parentBridge.bundleURL = bundleURL;
}

- (id<ABI15_0_0RCTBridgeDelegate>)delegate
{
  return _parentBridge.delegate;
}

- (void)dispatchBlock:(dispatch_block_t)block
                queue:(dispatch_queue_t)queue
{
  if (queue == ABI15_0_0RCTJSThread) {
    [self executeBlockOnJavaScriptThread:block];
  } else if (queue) {
    dispatch_async(queue, block);
  }
}

#pragma mark - ABI15_0_0RCTInvalidating

- (void)invalidate
{
  if (!_valid) {
    return;
  }

  ABI15_0_0RCTAssertMainQueue();
  ABI15_0_0RCTAssert(_ReactABI15_0_0Instance != nil, @"Can't complete invalidation without a ReactABI15_0_0 instance");

  _loading = NO;
  _valid = NO;
  if ([ABI15_0_0RCTBridge currentBridge] == self) {
    [ABI15_0_0RCTBridge setCurrentBridge:nil];
  }

  // Invalidate modules
  dispatch_group_t group = dispatch_group_create();
  for (ABI15_0_0RCTModuleData *moduleData in _moduleDataByID) {
    // Be careful when grabbing an instance here, we don't want to instantiate
    // any modules just to invalidate them.
    if (![moduleData hasInstance]) {
      continue;
    }

    if ([moduleData.instance respondsToSelector:@selector(invalidate)]) {
      dispatch_group_enter(group);
      [self dispatchBlock:^{
        [(id<ABI15_0_0RCTInvalidating>)moduleData.instance invalidate];
        dispatch_group_leave(group);
      } queue:moduleData.methodQueue];
    }
    [moduleData invalidate];
  }

  dispatch_group_notify(group, dispatch_get_main_queue(), ^{
    [self executeBlockOnJavaScriptThread:^{
      [self->_displayLink invalidate];
      self->_displayLink = nil;

      self->_ReactABI15_0_0Instance.reset();
      if (self->_jsMessageThread) {
        self->_jsMessageThread->quitSynchronous();
        self->_jsMessageThread.reset();
      }

      if (ABI15_0_0RCTProfileIsProfiling()) {
        ABI15_0_0RCTProfileUnhookModules(self);
      }

      self->_moduleDataByName = nil;
      self->_moduleDataByID = nil;
      self->_moduleClassesByID = nil;
      self->_pendingCalls = nil;
    }];
  });
}

- (void)logMessage:(NSString *)message level:(NSString *)level
{
  if (ABI15_0_0RCT_DEBUG && _valid) {
    [self enqueueJSCall:@"ABI15_0_0RCTLog"
                 method:@"logIfNoNativeHook"
                   args:@[level, message]
             completion:NULL];
  }
}

#pragma mark - ABI15_0_0RCTBridge methods

- (void)_runAfterLoad:(dispatch_block_t)block
{
  // Ordering here is tricky.  Ideally, the C++ bridge would provide
  // functionality to defer calls until after the app is loaded.  Until that
  // happens, we do this.  _pendingCount keeps a count of blocks which have
  // been deferred.  It is incremented using an atomic barrier call before each
  // block is added to the js queue, and decremented using an atomic barrier
  // call after the block is executed.  If _pendingCount is zero, there is no
  // work either in the js queue, or in _pendingCalls, so it is safe to add new
  // work to the JS queue directly.

  if (self.loading || _pendingCount > 0) {
    // From the callers' perspecive:

    // Phase 1: jsQueueBlocks are added to the queue; _pendingCount is
    // incremented for each.  If the first block is created after self.loading is
    // true, phase 1 will be nothing.
    OSAtomicIncrement32Barrier(&_pendingCount);
    dispatch_block_t jsQueueBlock = ^{
      // From the perspective of the JS queue:
      if (self.loading) {
        // Phase A: jsQueueBlocks are executed.  self.loading is true, so they
        // are added to _pendingCalls.
        [self->_pendingCalls addObject:block];
      } else {
        // Phase C: More jsQueueBlocks are executed.  self.loading is false, so
        // each block is executed, adding work to the queue, and _pendingCount is
        // decremented.
        block();
        OSAtomicDecrement32Barrier(&self->_pendingCount);
      }
    };
    [self executeBlockOnJavaScriptThread:jsQueueBlock];
  } else {
    // Phase 2/Phase D: blocks are executed directly, adding work to the JS queue.
    block();
  }
}

- (void)_flushPendingCalls
{
  [_performanceLogger markStopForTag:ABI15_0_0RCTPLBridgeStartup];

  ABI15_0_0RCT_PROFILE_BEGIN_EVENT(0, @"Processing pendingCalls", @{ @"count": @(_pendingCalls.count) });
  // Phase B: _flushPendingCalls happens.  Each block in _pendingCalls is
  // executed, adding work to the queue, and _pendingCount is decremented.
  // loading is set to NO.
  NSArray *pendingCalls = _pendingCalls;
  _pendingCalls = nil;
  for (dispatch_block_t call in pendingCalls) {
    call();
    OSAtomicDecrement32Barrier(&_pendingCount);
  }
  _loading = NO;
  ABI15_0_0RCT_PROFILE_END_EVENT(ABI15_0_0RCTProfileTagAlways, @"");
}

/**
 * Public. Can be invoked from any thread.
 */
- (void)enqueueJSCall:(NSString *)module method:(NSString *)method args:(NSArray *)args completion:(dispatch_block_t)completion
{
  if (!self.valid) {
    return;
  }

  /**
   * AnyThread
   */
  ABI15_0_0RCT_PROFILE_BEGIN_EVENT(ABI15_0_0RCTProfileTagAlways, @"-[ABI15_0_0RCTCxxBridge enqueueJSCall:]", nil);

  ABI15_0_0RCTProfileBeginFlowEvent();
  [self _runAfterLoad:^{
    ABI15_0_0RCTProfileEndFlowEvent();

    if (self->_ReactABI15_0_0Instance) {
      self->_ReactABI15_0_0Instance->callJSFunction(self->_ReactABI15_0_0Instance->getMainExecutorToken(),
                                           [module UTF8String], [method UTF8String],
                                           [ABI15_0_0RCTConvert folly_dynamic:args ?: @[]]);

      if (completion) {
        [self executeBlockOnJavaScriptThread:completion];
      }
    }
  }];

  ABI15_0_0RCT_PROFILE_END_EVENT(ABI15_0_0RCTProfileTagAlways, @"");
}

/**
 * Called by ABI15_0_0RCTModuleMethod from any thread.
 */
- (void)enqueueCallback:(NSNumber *)cbID args:(NSArray *)args
{
  /**
   * AnyThread
   */

  ABI15_0_0RCTProfileBeginFlowEvent();

  [self _runAfterLoad:^{
    ABI15_0_0RCTProfileEndFlowEvent();

    if (self->_ReactABI15_0_0Instance)
      self->_ReactABI15_0_0Instance->callJSCallback(
        self->_ReactABI15_0_0Instance->getMainExecutorToken(), [cbID unsignedLongLongValue],
        [ABI15_0_0RCTConvert folly_dynamic:args ?: @[]]);
  }];
}

/**
 * Private hack to support `setTimeout(fn, 0)`
 */
- (void)_immediatelyCallTimer:(NSNumber *)timer
{
  ABI15_0_0RCTAssertJSThread();

  if (_ReactABI15_0_0Instance)
    _ReactABI15_0_0Instance->callJSFunction(_ReactABI15_0_0Instance->getMainExecutorToken(),
                                   "JSTimersExecution", "callTimers",
                                   folly::dynamic::array(folly::dynamic::array([timer doubleValue])));
}

- (void)enqueueApplicationScript:(NSData *)script
                             url:(NSURL *)url
                      onComplete:(dispatch_block_t)onComplete
{
  ABI15_0_0RCTAssert(onComplete != nil, @"onComplete block passed in should be non-nil");

  ABI15_0_0RCT_PROFILE_BEGIN_EVENT(ABI15_0_0RCTProfileTagAlways,
                          @"-[ABI15_0_0RCTCxxBridge enqueueApplicationScript]", nil);

  [self _tryAndHandleError:^{
    if (isRAMBundle(script)) {
      auto ramBundle = std::make_unique<JSIndexedRAMBundle>(url.path.UTF8String);
      std::unique_ptr<const JSBigString> scriptStr = ramBundle->getStartupCode();
      if (self->_ReactABI15_0_0Instance)
        self->_ReactABI15_0_0Instance->loadUnbundle(std::move(ramBundle), std::move(scriptStr),
                                           [[url absoluteString] UTF8String]);
    } else if (self->_ReactABI15_0_0Instance) {
      auto bigbuf = std::make_unique<JSBigBufferString>([script length]);
      memcpy(bigbuf->data(), [script bytes], bigbuf->size());

      self->_ReactABI15_0_0Instance->loadScriptFromString(std::move(bigbuf),
                                                 [[url absoluteString] UTF8String]);
    }
  }];

  ABI15_0_0RCT_PROFILE_END_EVENT(ABI15_0_0RCTProfileTagAlways, @"");

  // Assumes that onComplete can be called when the next block on the JS thread is scheduled
  [self executeBlockOnJavaScriptThread:^{
    onComplete();
  }];
}

- (void)executeApplicationScriptSync:(NSData *)script url:(NSURL *)url
{
  [self _tryAndHandleError:^{
    if (isRAMBundle(script)) {
      auto ramBundle = std::make_unique<JSIndexedRAMBundle>(url.path.UTF8String);
      std::unique_ptr<const JSBigString> scriptStr = ramBundle->getStartupCode();
      if (self->_ReactABI15_0_0Instance) {
        self->_ReactABI15_0_0Instance->loadUnbundleSync(std::move(ramBundle), std::move(scriptStr),
                                               [[url absoluteString] UTF8String]);
      }
    } else if (self->_ReactABI15_0_0Instance) {
      auto bigbuf = std::make_unique<JSBigBufferString>([script length]);
      memcpy(bigbuf->data(), [script bytes], bigbuf->size());

      self->_ReactABI15_0_0Instance->loadScriptFromStringSync(std::move(bigbuf), [[url absoluteString] UTF8String]);
    } else {
      throw std::logic_error(
        "Attempt to call loadApplicationScriptSync: on uninitialized bridge");
    }
  }];
}

static JSContext *contextForGlobalContextRef(JSGlobalContextRef contextRef)
{
  static std::mutex s_mutex;
  static NSMapTable *s_contextCache;

  if (!contextRef) {
    return nil;
  }

  // Adding our own lock here, since JSC internal ones are insufficient
  std::lock_guard<std::mutex> lock(s_mutex);
  if (!s_contextCache) {
    NSPointerFunctionsOptions keyOptions = NSPointerFunctionsOpaqueMemory | NSPointerFunctionsOpaquePersonality;
    NSPointerFunctionsOptions valueOptions = NSPointerFunctionsWeakMemory | NSPointerFunctionsObjectPersonality;
    s_contextCache = [[NSMapTable alloc] initWithKeyOptions:keyOptions valueOptions:valueOptions capacity:0];
  }

  JSContext *ctx = [s_contextCache objectForKey:(__bridge id)contextRef];
  if (!ctx) {
    ctx = [JSC_JSContext(contextRef) contextWithJSGlobalContextRef:contextRef];
    [s_contextCache setObject:ctx forKey:(__bridge id)contextRef];
  }
  return ctx;
}

/*
 * The ValueEncoder<NSArray *>::toValue is used by callFunctionSync below.
 * Note: Because the NSArray * is really a NSArray * __strong the toValue is
 * accepting NSArray *const __strong instead of NSArray *&&.
 */
template <>
struct ValueEncoder<NSArray *> {
  static Value toValue(JSGlobalContextRef ctx, NSArray *const __strong array)
  {
    JSValue *value = [JSValue valueWithObject:array inContext:contextForGlobalContextRef(ctx)];
    return {ctx, [value JSValueRef]};
  }
};

- (JSValue *)callFunctionOnModule:(NSString *)module
                           method:(NSString *)method
                        arguments:(NSArray *)arguments
                            error:(NSError **)error
{
  if (!_ReactABI15_0_0Instance) {
    if (error) {
      *error = ABI15_0_0RCTErrorWithMessage(
        @"Attempt to call sync callFunctionOnModule: on uninitialized bridge");
    }
    return nil;
  } else if (self.executorClass) {
    if (error) {
      *error = ABI15_0_0RCTErrorWithMessage(
        @"sync callFunctionOnModule: can only be used with JSC executor");
    }
    return nil;
  } else if (!self.valid) {
    if (error) {
      *error = ABI15_0_0RCTErrorWithMessage(
        @"sync callFunctionOnModule: bridge is no longer valid");
    }
    return nil;
  } else if (self.loading) {
    if (error) {
      *error = ABI15_0_0RCTErrorWithMessage(
        @"sync callFunctionOnModule: bridge is still loading");
    }
    return nil;
  }

  __block JSValue *ret = nil;

  ABI15_0_0RCT_PROFILE_BEGIN_EVENT(0, @"callFunctionOnModule", (@{ @"module": module, @"method": method }));
  NSError *errorObj = tryAndReturnError(^{
    Value result = self->_ReactABI15_0_0Instance->callFunctionSync(
      [module UTF8String], [method UTF8String], arguments);
    JSContext *context = contextForGlobalContextRef(JSC_JSContextGetGlobalContext(result.context()));
    ret = [JSC_JSValue(result.context()) valueWithJSValueRef:result inContext:context];
  });
  ABI15_0_0RCT_PROFILE_END_EVENT(ABI15_0_0RCTProfileTagAlways, @"js_call");

  if (error) {
    *error = errorObj;
  }

  return ret;
}

#pragma mark - Payload Processing

- (void)partialBatchDidFlush
{
  for (ABI15_0_0RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.implementsPartialBatchDidFlush) {
      [self dispatchBlock:^{
        [moduleData.instance partialBatchDidFlush];
      } queue:moduleData.methodQueue];
    }
  }
}

- (void)batchDidComplete
{
  // TODO #12592471: batchDidComplete is only used by ABI15_0_0RCTUIManager,
  // can we eliminate this special case?
  for (ABI15_0_0RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.implementsBatchDidComplete) {
      [self dispatchBlock:^{
        [moduleData.instance batchDidComplete];
      } queue:moduleData.methodQueue];
    }
  }
}

- (void)startProfiling
{
  ABI15_0_0RCTAssertMainQueue();

  [self executeBlockOnJavaScriptThread:^{
    ABI15_0_0RCTProfileInit(self);
  }];
}

- (void)stopProfiling:(void (^)(NSData *))callback
{
  ABI15_0_0RCTAssertMainQueue();

  [self executeBlockOnJavaScriptThread:^{
    ABI15_0_0RCTProfileEnd(self, ^(NSString *log) {
      NSData *logData = [log dataUsingEncoding:NSUTF8StringEncoding];
      callback(logData);
    });
  }];
}

- (BOOL)isBatchActive
{
  return _wasBatchActive;
}

@end
