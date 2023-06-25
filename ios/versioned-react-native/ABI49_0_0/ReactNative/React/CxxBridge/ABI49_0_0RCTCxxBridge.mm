/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <atomic>
#include <future>

#import <ABI49_0_0React/ABI49_0_0RCTAssert.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridge+Private.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridgeMethod.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridgeModuleDecorator.h>
#import <ABI49_0_0React/ABI49_0_0RCTConstants.h>
#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>
#import <ABI49_0_0React/ABI49_0_0RCTCxxBridgeDelegate.h>
#import <ABI49_0_0React/ABI49_0_0RCTCxxModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTCxxUtils.h>
#import <ABI49_0_0React/ABI49_0_0RCTDevSettings.h>
#import <ABI49_0_0React/ABI49_0_0RCTDisplayLink.h>
#import <ABI49_0_0React/ABI49_0_0RCTFollyConvert.h>
#import <ABI49_0_0React/ABI49_0_0RCTJavaScriptLoader.h>
#import <ABI49_0_0React/ABI49_0_0RCTLog.h>
#import <ABI49_0_0React/ABI49_0_0RCTModuleData.h>
#import <ABI49_0_0React/ABI49_0_0RCTPerformanceLogger.h>
#import <ABI49_0_0React/ABI49_0_0RCTProfile.h>
#import <ABI49_0_0React/ABI49_0_0RCTRedBox.h>
#import <ABI49_0_0React/ABI49_0_0RCTReloadCommand.h>
#import <ABI49_0_0React/ABI49_0_0RCTTurboModuleRegistry.h>
#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>
#import <ABI49_0_0cxxreact/ABI49_0_0CxxNativeModule.h>
#import <ABI49_0_0cxxreact/ABI49_0_0Instance.h>
#import <ABI49_0_0cxxreact/ABI49_0_0JSBundleType.h>
#import <ABI49_0_0cxxreact/ABI49_0_0JSIndexedRAMBundle.h>
#import <ABI49_0_0cxxreact/ABI49_0_0ModuleRegistry.h>
#import <ABI49_0_0cxxreact/ABI49_0_0RAMBundleRegistry.h>
#import <ABI49_0_0cxxreact/ABI49_0_0ReactMarker.h>
#import <ABI49_0_0jsireact/ABI49_0_0JSIExecutor.h>
#import <ABI49_0_0Reactperflogger/ABI49_0_0BridgeNativeModulePerfLogger.h>

#ifndef ABI49_0_0RCT_USE_HERMES
#if __has_include(<ABI49_0_0Reacthermes/HermesExecutorFactory.h>)
#define ABI49_0_0RCT_USE_HERMES 1
#else
#define ABI49_0_0RCT_USE_HERMES 0
#endif
#endif

#if ABI49_0_0RCT_USE_HERMES
#import <ABI49_0_0Reacthermes/HermesExecutorFactory.h>
#else
#import "ABI49_0_0JSCExecutorFactory.h"
#endif
#import "ABI49_0_0RCTJSIExecutorRuntimeInstaller.h"

#import "ABI49_0_0NSDataBigString.h"
#import "ABI49_0_0RCTMessageThread.h"
#import "ABI49_0_0RCTObjcExecutor.h"

#ifdef WITH_FBSYSTRACE
#import <ABI49_0_0React/ABI49_0_0RCTFBSystrace.h>
#endif

#if (ABI49_0_0RCT_DEV | ABI49_0_0RCT_ENABLE_LOADING_VIEW) && __has_include(<ABI49_0_0React/ABI49_0_0RCTDevLoadingViewProtocol.h>)
#import <ABI49_0_0React/ABI49_0_0RCTDevLoadingViewProtocol.h>
#endif

static NSString *const ABI49_0_0RCTJSThreadName = @"com.facebook.ABI49_0_0React.JavaScript";

typedef void (^ABI49_0_0RCTPendingCall)();

using namespace ABI49_0_0facebook::jsi;
using namespace ABI49_0_0facebook::ABI49_0_0React;

/**
 * Must be kept in sync with `MessageQueue.js`.
 */
typedef NS_ENUM(NSInteger, ABI49_0_0RCTBridgeFields) {
  ABI49_0_0RCTBridgeFieldRequestModuleIDs = 0,
  ABI49_0_0RCTBridgeFieldMethodIDs,
  ABI49_0_0RCTBridgeFieldParams,
  ABI49_0_0RCTBridgeFieldCallID,
};

namespace {

int32_t getUniqueId()
{
  static std::atomic<int32_t> counter{0};
  return counter++;
}

class GetDescAdapter : public JSExecutorFactory {
 public:
  GetDescAdapter(ABI49_0_0RCTCxxBridge *bridge, std::shared_ptr<JSExecutorFactory> factory) : bridge_(bridge), factory_(factory)
  {
  }
  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override
  {
    auto ret = factory_->createJSExecutor(delegate, jsQueue);
    bridge_.bridgeDescription = @(ret->getDescription().c_str());
    return ret;
  }

 private:
  ABI49_0_0RCTCxxBridge *bridge_;
  std::shared_ptr<JSExecutorFactory> factory_;
};

}

static void notifyAboutModuleSetup(ABI49_0_0RCTPerformanceLogger *performanceLogger, const char *tag)
{
  NSString *moduleName = [[NSString alloc] initWithUTF8String:tag];
  if (moduleName) {
    int64_t setupTime = [performanceLogger durationForTag:ABI49_0_0RCTPLNativeModuleSetup];
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI49_0_0RCTDidSetupModuleNotification
                                                        object:nil
                                                      userInfo:@{
                                                        ABI49_0_0RCTDidSetupModuleNotificationModuleNameKey : moduleName,
                                                        ABI49_0_0RCTDidSetupModuleNotificationSetupTimeKey : @(setupTime)
                                                      }];
  }
}

static void mapABI49_0_0ReactMarkerToPerformanceLogger(
    const ABI49_0_0ReactMarker::ABI49_0_0ReactMarkerId markerId,
    ABI49_0_0RCTPerformanceLogger *performanceLogger,
    const char *tag)
{
  switch (markerId) {
    case ABI49_0_0ReactMarker::RUN_JS_BUNDLE_START:
      [performanceLogger markStartForTag:ABI49_0_0RCTPLScriptExecution];
      break;
    case ABI49_0_0ReactMarker::RUN_JS_BUNDLE_STOP:
      [performanceLogger markStopForTag:ABI49_0_0RCTPLScriptExecution];
      break;
    case ABI49_0_0ReactMarker::NATIVE_REQUIRE_START:
      [performanceLogger appendStartForTag:ABI49_0_0RCTPLRAMNativeRequires];
      break;
    case ABI49_0_0ReactMarker::NATIVE_REQUIRE_STOP:
      [performanceLogger appendStopForTag:ABI49_0_0RCTPLRAMNativeRequires];
      [performanceLogger addValue:1 forTag:ABI49_0_0RCTPLRAMNativeRequiresCount];
      break;
    case ABI49_0_0ReactMarker::NATIVE_MODULE_SETUP_START:
      [performanceLogger markStartForTag:ABI49_0_0RCTPLNativeModuleSetup];
      break;
    case ABI49_0_0ReactMarker::NATIVE_MODULE_SETUP_STOP:
      [performanceLogger markStopForTag:ABI49_0_0RCTPLNativeModuleSetup];
      notifyAboutModuleSetup(performanceLogger, tag);
      break;
      // Not needed in bridge mode.
    case ABI49_0_0ReactMarker::ABI49_0_0REACT_INSTANCE_INIT_START:
    case ABI49_0_0ReactMarker::ABI49_0_0REACT_INSTANCE_INIT_STOP:
      // Not used on iOS.
    case ABI49_0_0ReactMarker::CREATE_REACT_CONTEXT_STOP:
    case ABI49_0_0ReactMarker::JS_BUNDLE_STRING_CONVERT_START:
    case ABI49_0_0ReactMarker::JS_BUNDLE_STRING_CONVERT_STOP:
    case ABI49_0_0ReactMarker::REGISTER_JS_SEGMENT_START:
    case ABI49_0_0ReactMarker::REGISTER_JS_SEGMENT_STOP:
      break;
  }
}

static void registerPerformanceLoggerHooks(ABI49_0_0RCTPerformanceLogger *performanceLogger)
{
  __weak ABI49_0_0RCTPerformanceLogger *weakPerformanceLogger = performanceLogger;
  ABI49_0_0ReactMarker::logTaggedMarkerImpl = [weakPerformanceLogger](
                                         const ABI49_0_0ReactMarker::ABI49_0_0ReactMarkerId markerId, const char *tag) {
    mapABI49_0_0ReactMarkerToPerformanceLogger(markerId, weakPerformanceLogger, tag);
  };
}

@interface ABI49_0_0RCTCxxBridge ()

@property (nonatomic, weak, readonly) ABI49_0_0RCTBridge *parentBridge;
@property (nonatomic, assign, readonly) BOOL moduleSetupComplete;

- (instancetype)initWithParentBridge:(ABI49_0_0RCTBridge *)bridge;
- (void)partialBatchDidFlush;
- (void)batchDidComplete;

@end

struct ABI49_0_0RCTInstanceCallback : public InstanceCallback {
  __weak ABI49_0_0RCTCxxBridge *bridge_;
  ABI49_0_0RCTInstanceCallback(ABI49_0_0RCTCxxBridge *bridge) : bridge_(bridge){};
  void onBatchComplete() override
  {
    // There's no interface to call this per partial batch
    [bridge_ partialBatchDidFlush];
    [bridge_ batchDidComplete];
  }
};

@implementation ABI49_0_0RCTCxxBridge {
  BOOL _didInvalidate;
  BOOL _moduleRegistryCreated;

  NSMutableArray<ABI49_0_0RCTPendingCall> *_pendingCalls;
  std::atomic<NSInteger> _pendingCount;

  // Native modules
  NSMutableDictionary<NSString *, ABI49_0_0RCTModuleData *> *_moduleDataByName;
  NSMutableArray<ABI49_0_0RCTModuleData *> *_moduleDataByID;
  NSMutableArray<Class> *_moduleClassesByID;
  NSUInteger _modulesInitializedOnMainQueue;
  ABI49_0_0RCTDisplayLink *_displayLink;

  // JS thread management
  NSThread *_jsThread;
  std::shared_ptr<ABI49_0_0RCTMessageThread> _jsMessageThread;
  std::mutex _moduleRegistryLock;

  // This is uniquely owned, but weak_ptr is used.
  std::shared_ptr<Instance> _ABI49_0_0ReactInstance;

  // Necessary for searching in TurboModules in TurboModuleManager
  id<ABI49_0_0RCTTurboModuleRegistry> _turboModuleRegistry;

  ABI49_0_0RCTModuleRegistry *_objCModuleRegistry;
  ABI49_0_0RCTViewRegistry *_viewRegistry_DEPRECATED;
  ABI49_0_0RCTBundleManager *_bundleManager;
  ABI49_0_0RCTCallableJSModules *_callableJSModules;
}

@synthesize bridgeDescription = _bridgeDescription;
@synthesize loading = _loading;
@synthesize performanceLogger = _performanceLogger;
@synthesize valid = _valid;

- (ABI49_0_0RCTModuleRegistry *)moduleRegistry
{
  return _objCModuleRegistry;
}

- (void)setABI49_0_0RCTTurboModuleRegistry:(id<ABI49_0_0RCTTurboModuleRegistry>)turboModuleRegistry
{
  _turboModuleRegistry = turboModuleRegistry;
  [_objCModuleRegistry setTurboModuleRegistry:_turboModuleRegistry];
}

- (void)attachBridgeAPIsToTurboModule:(id<ABI49_0_0RCTTurboModule>)module
{
  ABI49_0_0RCTBridgeModuleDecorator *bridgeModuleDecorator =
      [[ABI49_0_0RCTBridgeModuleDecorator alloc] initWithViewRegistry:_viewRegistry_DEPRECATED
                                              moduleRegistry:_objCModuleRegistry
                                               bundleManager:_bundleManager
                                           callableJSModules:_callableJSModules];
  [bridgeModuleDecorator attachInteropAPIsToModule:(id<ABI49_0_0RCTBridgeModule>)module];
}

- (std::shared_ptr<MessageQueueThread>)jsMessageThread
{
  return _jsMessageThread;
}

- (BOOL)isInspectable
{
  return _ABI49_0_0ReactInstance ? _ABI49_0_0ReactInstance->isInspectable() : NO;
}

- (instancetype)initWithParentBridge:(ABI49_0_0RCTBridge *)bridge
{
  ABI49_0_0RCTAssertParam(bridge);

  if ((self = [super initWithDelegate:bridge.delegate
                            bundleURL:bridge.bundleURL
                       moduleProvider:bridge.moduleProvider
                        launchOptions:bridge.launchOptions])) {
    _parentBridge = bridge;
    _performanceLogger = [bridge performanceLogger];

    registerPerformanceLoggerHooks(_performanceLogger);

    /**
     * Set Initial State
     */
    _valid = YES;
    _loading = YES;
    _moduleRegistryCreated = NO;
    _pendingCalls = [NSMutableArray new];
    _displayLink = [ABI49_0_0RCTDisplayLink new];
    _moduleDataByName = [NSMutableDictionary new];
    _moduleClassesByID = [NSMutableArray new];
    _moduleDataByID = [NSMutableArray new];
    _objCModuleRegistry = [ABI49_0_0RCTModuleRegistry new];
    [_objCModuleRegistry setBridge:self];
    _bundleManager = [ABI49_0_0RCTBundleManager new];
    [_bundleManager setBridge:self];
    _viewRegistry_DEPRECATED = [ABI49_0_0RCTViewRegistry new];
    [_viewRegistry_DEPRECATED setBridge:self];
    _callableJSModules = [ABI49_0_0RCTCallableJSModules new];
    [_callableJSModules setBridge:self];

    [ABI49_0_0RCTBridge setCurrentBridge:self];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleMemoryWarning)
                                                 name:UIApplicationDidReceiveMemoryWarningNotification
                                               object:nil];

    ABI49_0_0RCTLogSetBridgeModuleRegistry(_objCModuleRegistry);
    ABI49_0_0RCTLogSetBridgeCallableJSModules(_callableJSModules);
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (void)runRunLoop
{
  @autoreleasepool {
    ABI49_0_0RCT_PROFILE_BEGIN_EVENT(ABI49_0_0RCTProfileTagAlways, @"-[ABI49_0_0RCTCxxBridge runJSRunLoop] setup", nil);

    // copy thread name to pthread name
    pthread_setname_np([NSThread currentThread].name.UTF8String);

    // Set up a dummy runloop source to avoid spinning
    CFRunLoopSourceContext noSpinCtx = {0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL};
    CFRunLoopSourceRef noSpinSource = CFRunLoopSourceCreate(NULL, 0, &noSpinCtx);
    CFRunLoopAddSource(CFRunLoopGetCurrent(), noSpinSource, kCFRunLoopDefaultMode);
    CFRelease(noSpinSource);

    ABI49_0_0RCT_PROFILE_END_EVENT(ABI49_0_0RCTProfileTagAlways, @"");

    // run the run loop
    while (kCFRunLoopRunStopped !=
           CFRunLoopRunInMode(
               kCFRunLoopDefaultMode, ((NSDate *)[NSDate distantFuture]).timeIntervalSinceReferenceDate, NO)) {
      ABI49_0_0RCTAssert(NO, @"not reached assertion"); // runloop spun. that's bad.
    }
  }
}

- (void)_tryAndHandleError:(dispatch_block_t)block
{
  NSError *error = tryAndReturnError(block);
  if (error) {
    [self handleError:error];
  }
}

- (void)handleMemoryWarning
{
  // We only want to run garbage collector when the loading is finished
  // and the instance is valid.
  if (!_valid || _loading) {
    return;
  }

  // We need to hold a local retaining pointer to ABI49_0_0React instance
  // in case if some other tread resets it.
  auto ABI49_0_0ReactInstance = _ABI49_0_0ReactInstance;
  if (ABI49_0_0ReactInstance) {
    int unloadLevel = ABI49_0_0RCTGetMemoryPressureUnloadLevel();
    ABI49_0_0ReactInstance->handleMemoryPressure(unloadLevel);
  }
}

/**
 * Ensure block is run on the JS thread. If we're already on the JS thread, the block will execute synchronously.
 * If we're not on the JS thread, the block is dispatched to that thread. Any errors encountered while executing
 * the block will go through handleError:
 */
- (void)ensureOnJavaScriptThread:(dispatch_block_t)block
{
  ABI49_0_0RCTAssert(_jsThread, @"This method must not be called before the JS thread is created");

  // This does not use _jsMessageThread because it may be called early before the runloop reference is captured
  // and _jsMessageThread is valid. _jsMessageThread also doesn't allow us to shortcut the dispatch if we're
  // already on the correct thread.

  if ([NSThread currentThread] == _jsThread) {
    [self _tryAndHandleError:block];
  } else {
    [self performSelector:@selector(_tryAndHandleError:) onThread:_jsThread withObject:block waitUntilDone:NO];
  }
}

- (void)start
{
  ABI49_0_0RCT_PROFILE_BEGIN_EVENT(ABI49_0_0RCTProfileTagAlways, @"-[ABI49_0_0RCTCxxBridge start]", nil);

  [[NSNotificationCenter defaultCenter] postNotificationName:ABI49_0_0RCTJavaScriptWillStartLoadingNotification
                                                      object:_parentBridge
                                                    userInfo:@{@"bridge" : self}];

  // Set up the JS thread early
  _jsThread = [[NSThread alloc] initWithTarget:[self class] selector:@selector(runRunLoop) object:nil];
  _jsThread.name = ABI49_0_0RCTJSThreadName;
  _jsThread.qualityOfService = NSOperationQualityOfServiceUserInteractive;
#if ABI49_0_0RCT_DEBUG
  _jsThread.stackSize *= 2;
#endif
  [_jsThread start];

  dispatch_group_t prepareBridge = dispatch_group_create();

  [_performanceLogger markStartForTag:ABI49_0_0RCTPLNativeModuleInit];

  [self registerExtraModules];
  // Initialize all native modules that cannot be loaded lazily
  (void)[self _initializeModules:ABI49_0_0RCTGetModuleClasses() withDispatchGroup:prepareBridge lazilyDiscovered:NO];
  [self registerExtraLazyModules];

  [_performanceLogger markStopForTag:ABI49_0_0RCTPLNativeModuleInit];

  // This doesn't really do anything.  The real work happens in initializeBridge.
  _ABI49_0_0ReactInstance.reset(new Instance);

  __weak ABI49_0_0RCTCxxBridge *weakSelf = self;

  // Prepare executor factory (shared_ptr for copy into block)
  std::shared_ptr<JSExecutorFactory> executorFactory;
  if (!self.executorClass) {
    SEL jsExecutorFactoryForBridgeSEL = @selector(jsExecutorFactoryForBridge:);
    if ([self.delegate respondsToSelector:jsExecutorFactoryForBridgeSEL]) {
      // Normally, `ABI49_0_0RCTCxxBridgeDelegate` protocol uses `std::unique_ptr` to return the js executor object.
      // However, we needed to change the signature of `jsExecutorFactoryForBridge` to return `void *` instead. See https://github.com/expo/expo/pull/9862.
      // This change works great in Expo Go because we have full control over modules initialization,
      // but if someone is using our fork in the bare app, crashes may occur (`ABI49_0_0EXC_BAD_ACCESS`).
      // To fix it, we need to get the return type of `jsExecutorFactoryForBridge` and handle two cases:
      // - method returns `void *`
      // - method returns `std::unique_ptr<JSExecutorFactory>`
      Method m = class_getInstanceMethod([self.delegate class], jsExecutorFactoryForBridgeSEL);
      char returnType[128];
      method_getReturnType(m, returnType, sizeof(returnType));
      
      if(strcmp(returnType, @encode(void *)) == 0) {
        // `jsExecutorFactoryForBridge` returns `void *`
        id<ABI49_0_0RCTCxxBridgeDelegate> cxxDelegate = (id<ABI49_0_0RCTCxxBridgeDelegate>)self.delegate;
        executorFactory.reset(reinterpret_cast<JSExecutorFactory *>([cxxDelegate jsExecutorFactoryForBridge:self]));
      } else {
        // `jsExecutorFactoryForBridge` returns `std::unique_ptr<JSExecutorFactory>`
        id<ABI49_0_0RCTCxxBridgeTurboModuleDelegate> cxxDelegate = (id<ABI49_0_0RCTCxxBridgeTurboModuleDelegate>)self.delegate;
        executorFactory = [cxxDelegate jsExecutorFactoryForBridge:self];
      }
    }
    if (!executorFactory) {
      auto installBindings = ABI49_0_0RCTJSIExecutorRuntimeInstaller(nullptr);
#if ABI49_0_0RCT_USE_HERMES
      executorFactory = std::make_shared<HermesExecutorFactory>(installBindings);
#else
      executorFactory = std::make_shared<JSCExecutorFactory>(installBindings);
#endif
    }
  } else {
    id<ABI49_0_0RCTJavaScriptExecutor> objcExecutor = [self moduleForClass:self.executorClass];
    executorFactory.reset(new ABI49_0_0RCTObjcExecutorFactory(objcExecutor, ^(NSError *error) {
      if (error) {
        [weakSelf handleError:error];
      }
    }));
  }

  /**
   * id<ABI49_0_0RCTCxxBridgeDelegate> jsExecutorFactory may create and assign an id<ABI49_0_0RCTTurboModuleRegistry> object to
   * ABI49_0_0RCTCxxBridge If id<ABI49_0_0RCTTurboModuleRegistry> is assigned by this time, eagerly initialize all TurboModules
   */
  if (_turboModuleRegistry && ABI49_0_0RCTTurboModuleEagerInitEnabled()) {
    for (NSString *moduleName in [_turboModuleRegistry eagerInitModuleNames]) {
      [_turboModuleRegistry moduleForName:[moduleName UTF8String]];
    }

    for (NSString *moduleName in [_turboModuleRegistry eagerInitMainQueueModuleNames]) {
      if (ABI49_0_0RCTIsMainQueue()) {
        [_turboModuleRegistry moduleForName:[moduleName UTF8String]];
      } else {
        id<ABI49_0_0RCTTurboModuleRegistry> turboModuleRegistry = _turboModuleRegistry;
        dispatch_group_async(prepareBridge, dispatch_get_main_queue(), ^{
          [turboModuleRegistry moduleForName:[moduleName UTF8String]];
        });
      }
    }
  }

  // Dispatch the instance initialization as soon as the initial module metadata has
  // been collected (see initModules)
  dispatch_group_enter(prepareBridge);
  [self ensureOnJavaScriptThread:^{
    [weakSelf _initializeBridge:executorFactory];
    dispatch_group_leave(prepareBridge);
  }];

  // Load the source asynchronously, then store it for later execution.
  dispatch_group_enter(prepareBridge);
  __block NSData *sourceCode;
  __block NSURL *sourceURL = self.bundleURL;

#if (ABI49_0_0RCT_DEV | ABI49_0_0RCT_ENABLE_LOADING_VIEW) && __has_include(<ABI49_0_0React/ABI49_0_0RCTDevLoadingViewProtocol.h>)
  {
    id<ABI49_0_0RCTDevLoadingViewProtocol> loadingView = [self moduleForName:@"DevLoadingView" lazilyLoadIfNecessary:YES];
    [loadingView showWithURL:self.bundleURL];
  }
#endif

  [self
      loadSource:^(NSError *error, ABI49_0_0RCTSource *source) {
        if (error) {
          [weakSelf handleError:error];
        }

        sourceCode = source.data;
        if (source.url) {
          sourceURL = source.url;
        }
        dispatch_group_leave(prepareBridge);
      }
      onProgress:^(ABI49_0_0RCTLoadingProgress *progressData) {
#if (ABI49_0_0RCT_DEV | ABI49_0_0RCT_ENABLE_LOADING_VIEW) && __has_include(<ABI49_0_0React/ABI49_0_0RCTDevLoadingViewProtocol.h>)
        id<ABI49_0_0RCTDevLoadingViewProtocol> loadingView = [weakSelf moduleForName:@"DevLoadingView"
                                                      lazilyLoadIfNecessary:YES];
        [loadingView updateProgress:progressData];
#endif
      }];

  // Wait for both the modules and source code to have finished loading
  dispatch_group_notify(prepareBridge, dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
    ABI49_0_0RCTCxxBridge *strongSelf = weakSelf;
    if (sourceCode && strongSelf.loading) {
      [strongSelf executeSourceCode:sourceCode withSourceURL:sourceURL sync:NO];
    }
  });
  ABI49_0_0RCT_PROFILE_END_EVENT(ABI49_0_0RCTProfileTagAlways, @"");
}

- (void)loadSource:(ABI49_0_0RCTSourceLoadBlock)_onSourceLoad onProgress:(ABI49_0_0RCTSourceLoadProgressBlock)onProgress
{
  NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
  [center postNotificationName:ABI49_0_0RCTBridgeWillDownloadScriptNotification object:_parentBridge];
  [_performanceLogger markStartForTag:ABI49_0_0RCTPLScriptDownload];
  NSUInteger cookie = ABI49_0_0RCTProfileBeginAsyncEvent(0, @"JavaScript download", nil);

  // Suppress a warning if ABI49_0_0RCTProfileBeginAsyncEvent gets compiled out
  (void)cookie;

  ABI49_0_0RCTPerformanceLogger *performanceLogger = _performanceLogger;
  ABI49_0_0RCTSourceLoadBlock onSourceLoad = ^(NSError *error, ABI49_0_0RCTSource *source) {
    ABI49_0_0RCTProfileEndAsyncEvent(0, @"native", cookie, @"JavaScript download", @"JS async");
    [performanceLogger markStopForTag:ABI49_0_0RCTPLScriptDownload];
    [performanceLogger setValue:source.length forTag:ABI49_0_0RCTPLBundleSize];

    NSDictionary *userInfo = @{
      ABI49_0_0RCTBridgeDidDownloadScriptNotificationSourceKey : source ?: [NSNull null],
      ABI49_0_0RCTBridgeDidDownloadScriptNotificationBridgeDescriptionKey : self->_bridgeDescription ?: [NSNull null],
    };

    [center postNotificationName:ABI49_0_0RCTBridgeDidDownloadScriptNotification object:self->_parentBridge userInfo:userInfo];

    _onSourceLoad(error, source);
  };

  if ([self.delegate respondsToSelector:@selector(loadSourceForBridge:onProgress:onComplete:)]) {
    [self.delegate loadSourceForBridge:_parentBridge onProgress:onProgress onComplete:onSourceLoad];
  } else if ([self.delegate respondsToSelector:@selector(loadSourceForBridge:withBlock:)]) {
    [self.delegate loadSourceForBridge:_parentBridge withBlock:onSourceLoad];
  } else if (!self.bundleURL) {
    NSError *error = ABI49_0_0RCTErrorWithMessage(
        @"No bundle URL present.\n\nMake sure you're running a packager "
         "server or have included a .jsbundle file in your application bundle.");
    onSourceLoad(error, nil);
  } else {
    __weak ABI49_0_0RCTCxxBridge *weakSelf = self;
    [ABI49_0_0RCTJavaScriptLoader loadBundleAtURL:self.bundleURL
                              onProgress:onProgress
                              onComplete:^(NSError *error, ABI49_0_0RCTSource *source) {
                                if (error) {
                                  [weakSelf handleError:error];
                                  return;
                                }
                                onSourceLoad(error, source);
                              }];
  }
}

- (NSArray<Class> *)moduleClasses
{
  if (ABI49_0_0RCT_DEBUG && _valid && _moduleClassesByID == nil) {
    ABI49_0_0RCTLogError(
        @"Bridge modules have not yet been initialized. You may be "
         "trying to access a module too early in the startup procedure.");
  }
  return _moduleClassesByID;
}

/**
 * Used by ABI49_0_0RCTUIManager
 */
- (ABI49_0_0RCTModuleData *)moduleDataForName:(NSString *)moduleName
{
  return _moduleDataByName[moduleName];
}

- (id)moduleForName:(NSString *)moduleName
{
  return [self moduleForName:moduleName lazilyLoadIfNecessary:NO];
}

- (id)moduleForName:(NSString *)moduleName lazilyLoadIfNecessary:(BOOL)lazilyLoad
{
  if (ABI49_0_0RCTTurboModuleEnabled() && _turboModuleRegistry) {
    const char *moduleNameCStr = [moduleName UTF8String];
    if (lazilyLoad || [_turboModuleRegistry moduleIsInitialized:moduleNameCStr]) {
      id<ABI49_0_0RCTTurboModule> module = [_turboModuleRegistry moduleForName:moduleNameCStr warnOnLookupFailure:NO];
      if (module != nil) {
        return module;
      }
    }
  }

  if (!lazilyLoad) {
    return _moduleDataByName[moduleName].instance;
  }

  ABI49_0_0RCTModuleData *moduleData = _moduleDataByName[moduleName];
  if (moduleData) {
    if (![moduleData isKindOfClass:[ABI49_0_0RCTModuleData class]]) {
      // There is rare race condition where the data stored in the dictionary
      // may have been deallocated, which means the module instance is no longer
      // usable.
      return nil;
    }
    return moduleData.instance;
  }

  // Module may not be loaded yet, so attempt to force load it here.
  // Do this only if the bridge is still valid.
  if (_didInvalidate) {
    return nil;
  }

  const BOOL result = [self.delegate respondsToSelector:@selector(bridge:didNotFindModule:)] &&
      [self.delegate bridge:self didNotFindModule:moduleName];
  if (result) {
    // Try again.
    moduleData = _moduleDataByName[moduleName];
#if ABI49_0_0RCT_DEV
    // If the `_moduleDataByName` is nil, it must have been cleared by the reload.
  } else if (_moduleDataByName != nil) {
    ABI49_0_0RCTLogError(@"Unable to find module for %@", moduleName);
  }
#else
  } else {
    ABI49_0_0RCTLogError(@"Unable to find module for %@", moduleName);
  }
#endif

  return moduleData.instance;
}

- (BOOL)moduleIsInitialized:(Class)moduleClass
{
  NSString *moduleName = ABI49_0_0RCTBridgeModuleNameForClass(moduleClass);
  if (_moduleDataByName[moduleName].hasInstance) {
    return YES;
  }

  if (_turboModuleRegistry) {
    return [_turboModuleRegistry moduleIsInitialized:[moduleName UTF8String]];
  }

  return NO;
}

- (id)moduleForClass:(Class)moduleClass
{
  return [self moduleForName:ABI49_0_0RCTBridgeModuleNameForClass(moduleClass) lazilyLoadIfNecessary:YES];
}

- (std::shared_ptr<ModuleRegistry>)_buildModuleRegistryUnlocked
{
  if (!self.valid) {
    return {};
  }

  [_performanceLogger markStartForTag:ABI49_0_0RCTPLNativeModulePrepareConfig];
  ABI49_0_0RCT_PROFILE_BEGIN_EVENT(ABI49_0_0RCTProfileTagAlways, @"-[ABI49_0_0RCTCxxBridge buildModuleRegistry]", nil);

  __weak __typeof(self) weakSelf = self;
  ModuleRegistry::ModuleNotFoundCallback moduleNotFoundCallback = ^bool(const std::string &name) {
    __strong __typeof(weakSelf) strongSelf = weakSelf;
    return [strongSelf.delegate respondsToSelector:@selector(bridge:didNotFindModule:)] &&
        [strongSelf.delegate bridge:strongSelf didNotFindModule:@(name.c_str())];
  };

  auto registry = std::make_shared<ModuleRegistry>(
      createNativeModules(_moduleDataByID, self, _ABI49_0_0ReactInstance), moduleNotFoundCallback);

  [_performanceLogger markStopForTag:ABI49_0_0RCTPLNativeModulePrepareConfig];
  ABI49_0_0RCT_PROFILE_END_EVENT(ABI49_0_0RCTProfileTagAlways, @"");

  return registry;
}

- (void)_initializeBridge:(std::shared_ptr<JSExecutorFactory>)executorFactory
{
  if (!self.valid) {
    return;
  }

  __weak ABI49_0_0RCTCxxBridge *weakSelf = self;
  _jsMessageThread = std::make_shared<ABI49_0_0RCTMessageThread>([NSRunLoop currentRunLoop], ^(NSError *error) {
    if (error) {
      [weakSelf handleError:error];
    }
  });

  ABI49_0_0RCT_PROFILE_BEGIN_EVENT(ABI49_0_0RCTProfileTagAlways, @"-[ABI49_0_0RCTCxxBridge initializeBridge:]", nil);
  // This can only be false if the bridge was invalidated before startup completed
  if (_ABI49_0_0ReactInstance) {
#if ABI49_0_0RCT_DEV
    executorFactory = std::make_shared<GetDescAdapter>(self, executorFactory);
#endif

    [self _initializeBridgeLocked:executorFactory];

#if ABI49_0_0RCT_PROFILE
    if (ABI49_0_0RCTProfileIsProfiling()) {
      _ABI49_0_0ReactInstance->setGlobalVariable("__ABI49_0_0RCTProfileIsProfiling", std::make_unique<JSBigStdString>("true"));
    }
#endif
  }

  ABI49_0_0RCT_PROFILE_END_EVENT(ABI49_0_0RCTProfileTagAlways, @"");
}

- (void)_initializeBridgeLocked:(std::shared_ptr<JSExecutorFactory>)executorFactory
{
  std::lock_guard<std::mutex> guard(_moduleRegistryLock);

  // This is async, but any calls into JS are blocked by the m_syncReady CV in Instance
  _ABI49_0_0ReactInstance->initializeBridge(
      std::make_unique<ABI49_0_0RCTInstanceCallback>(self),
      executorFactory,
      _jsMessageThread,
      [self _buildModuleRegistryUnlocked]);
  _moduleRegistryCreated = YES;
}

- (void)updateModuleWithInstance:(id<ABI49_0_0RCTBridgeModule>)instance
{
  NSString *const moduleName = ABI49_0_0RCTBridgeModuleNameForClass([instance class]);
  if (moduleName) {
    ABI49_0_0RCTModuleData *const moduleData = _moduleDataByName[moduleName];
    if (moduleData) {
      moduleData.instance = instance;
    }
  }
}

- (NSArray<ABI49_0_0RCTModuleData *> *)registerModulesForClasses:(NSArray<Class> *)moduleClasses
{
  return [self _registerModulesForClasses:moduleClasses lazilyDiscovered:NO];
}

- (NSArray<ABI49_0_0RCTModuleData *> *)_registerModulesForClasses:(NSArray<Class> *)moduleClasses
                                        lazilyDiscovered:(BOOL)lazilyDiscovered
{
  ABI49_0_0RCT_PROFILE_BEGIN_EVENT(
      ABI49_0_0RCTProfileTagAlways, @"-[ABI49_0_0RCTCxxBridge initModulesWithDispatchGroup:] autoexported moduleData", nil);

  NSArray *moduleClassesCopy = [moduleClasses copy];
  NSMutableArray<ABI49_0_0RCTModuleData *> *moduleDataByID = [NSMutableArray arrayWithCapacity:moduleClassesCopy.count];
  for (Class moduleClass in moduleClassesCopy) {
    if (ABI49_0_0RCTTurboModuleEnabled() && [moduleClass conformsToProtocol:@protocol(ABI49_0_0RCTTurboModule)]) {
      continue;
    }
    NSString *moduleName = ABI49_0_0RCTBridgeModuleNameForClass(moduleClass);

    // Check for module name collisions
    ABI49_0_0RCTModuleData *moduleData = _moduleDataByName[moduleName];
    if (moduleData) {
      if (moduleData.hasInstance || lazilyDiscovered) {
        // Existing module was preregistered, so it takes precedence
        continue;
      } else if ([moduleClass new] == nil) {
        // The new module returned nil from init, so use the old module
        continue;
      } else if ([moduleData.moduleClass new] != nil) {
        // Both modules were non-nil, so it's unclear which should take precedence
        ABI49_0_0RCTLogWarn(
            @"Attempted to register ABI49_0_0RCTBridgeModule class %@ for the "
             "name '%@', but name was already registered by class %@",
            moduleClass,
            moduleName,
            moduleData.moduleClass);
      }
    }

    // Instantiate moduleData
    // TODO #13258411: can we defer this until config generation?
    int32_t moduleDataId = getUniqueId();
    BridgeNativeModulePerfLogger::moduleDataCreateStart([moduleName UTF8String], moduleDataId);
    moduleData = [[ABI49_0_0RCTModuleData alloc] initWithModuleClass:moduleClass
                                                     bridge:self
                                             moduleRegistry:_objCModuleRegistry
                                    viewRegistry_DEPRECATED:_viewRegistry_DEPRECATED
                                              bundleManager:_bundleManager
                                          callableJSModules:_callableJSModules];
    BridgeNativeModulePerfLogger::moduleDataCreateEnd([moduleName UTF8String], moduleDataId);

    _moduleDataByName[moduleName] = moduleData;
    [_moduleClassesByID addObject:moduleClass];
    [moduleDataByID addObject:moduleData];
  }
  [_moduleDataByID addObjectsFromArray:moduleDataByID];

  ABI49_0_0RCT_PROFILE_END_EVENT(ABI49_0_0RCTProfileTagAlways, @"");

  return moduleDataByID;
}

- (void)registerExtraModules
{
  ABI49_0_0RCT_PROFILE_BEGIN_EVENT(ABI49_0_0RCTProfileTagAlways, @"-[ABI49_0_0RCTCxxBridge initModulesWithDispatchGroup:] extraModules", nil);

  NSArray<id<ABI49_0_0RCTBridgeModule>> *appExtraModules = nil;
  if ([self.delegate respondsToSelector:@selector(extraModulesForBridge:)]) {
    appExtraModules = [self.delegate extraModulesForBridge:_parentBridge];
  } else if (self.moduleProvider) {
    appExtraModules = self.moduleProvider();
  }

  NSMutableArray<id<ABI49_0_0RCTBridgeModule>> *extraModules = [NSMutableArray new];

  // Prevent TurboModules from appearing the NativeModule system
  for (id<ABI49_0_0RCTBridgeModule> module in appExtraModules) {
    if (!(ABI49_0_0RCTTurboModuleEnabled() && [module conformsToProtocol:@protocol(ABI49_0_0RCTTurboModule)])) {
      [extraModules addObject:module];
    }
  }

  ABI49_0_0RCT_PROFILE_END_EVENT(ABI49_0_0RCTProfileTagAlways, @"");

  ABI49_0_0RCT_PROFILE_BEGIN_EVENT(
      ABI49_0_0RCTProfileTagAlways, @"-[ABI49_0_0RCTCxxBridge initModulesWithDispatchGroup:] preinitialized moduleData", nil);
  // Set up moduleData for pre-initialized module instances
  for (id<ABI49_0_0RCTBridgeModule> module in extraModules) {
    Class moduleClass = [module class];
    NSString *moduleName = ABI49_0_0RCTBridgeModuleNameForClass(moduleClass);

    if (ABI49_0_0RCT_DEBUG) {
      // Check for name collisions between preregistered modules
      ABI49_0_0RCTModuleData *moduleData = _moduleDataByName[moduleName];
      if (moduleData) {
        ABI49_0_0RCTLogError(
            @"Attempted to register ABI49_0_0RCTBridgeModule class %@ for the "
             "name '%@', but name was already registered by class %@",
            moduleClass,
            moduleName,
            moduleData.moduleClass);
        continue;
      }
    }

    if (ABI49_0_0RCTTurboModuleEnabled() && [module conformsToProtocol:@protocol(ABI49_0_0RCTTurboModule)]) {
#if ABI49_0_0RCT_DEBUG
      // TODO: don't ask for extra module for when TurboModule is enabled.
      ABI49_0_0RCTLogError(
          @"NativeModule '%@' was marked as TurboModule, but provided as an extra NativeModule "
           "by the class '%@', ignoring.",
          moduleName,
          moduleClass);
#endif
      continue;
    }

    // Instantiate moduleData container
    int32_t moduleDataId = getUniqueId();
    BridgeNativeModulePerfLogger::moduleDataCreateStart([moduleName UTF8String], moduleDataId);
    ABI49_0_0RCTModuleData *moduleData = [[ABI49_0_0RCTModuleData alloc] initWithModuleInstance:module
                                                                       bridge:self
                                                               moduleRegistry:_objCModuleRegistry
                                                      viewRegistry_DEPRECATED:_viewRegistry_DEPRECATED
                                                                bundleManager:_bundleManager
                                                            callableJSModules:_callableJSModules];
    BridgeNativeModulePerfLogger::moduleDataCreateEnd([moduleName UTF8String], moduleDataId);

    _moduleDataByName[moduleName] = moduleData;
    [_moduleClassesByID addObject:moduleClass];
    [_moduleDataByID addObject:moduleData];
  }
  ABI49_0_0RCT_PROFILE_END_EVENT(ABI49_0_0RCTProfileTagAlways, @"");
}

- (void)registerExtraLazyModules
{
#if ABI49_0_0RCT_DEBUG
  // This is debug-only and only when Chrome is attached, since it expects all modules to be already
  // available on start up. Otherwise, we can let the lazy module discovery to load them on demand.
  Class executorClass = [_parentBridge executorClass];
  if (executorClass && [NSStringFromClass(executorClass) isEqualToString:@"ABI49_0_0RCTWebSocketExecutor"]) {
    NSDictionary<NSString *, Class> *moduleClasses = nil;
    if ([self.delegate respondsToSelector:@selector(extraLazyModuleClassesForBridge:)]) {
      moduleClasses = [self.delegate extraLazyModuleClassesForBridge:_parentBridge];
    }

    if (!moduleClasses) {
      return;
    }

    // This logic is mostly copied from `registerModulesForClasses:`, but with one difference:
    // we must use the names provided by the delegate method here.
    for (NSString *moduleName in moduleClasses) {
      Class moduleClass = moduleClasses[moduleName];
      if (ABI49_0_0RCTTurboModuleEnabled() && [moduleClass conformsToProtocol:@protocol(ABI49_0_0RCTTurboModule)]) {
        continue;
      }

      // Check for module name collisions
      ABI49_0_0RCTModuleData *moduleData = _moduleDataByName[moduleName];
      if (moduleData) {
        if (moduleData.hasInstance) {
          // Existing module was preregistered, so it takes precedence
          continue;
        } else if ([moduleClass new] == nil) {
          // The new module returned nil from init, so use the old module
          continue;
        } else if ([moduleData.moduleClass new] != nil) {
          // Use existing module since it was already loaded but not yet instantiated.
          continue;
        }
      }

      int32_t moduleDataId = getUniqueId();
      BridgeNativeModulePerfLogger::moduleDataCreateStart([moduleName UTF8String], moduleDataId);
      moduleData = [[ABI49_0_0RCTModuleData alloc] initWithModuleClass:moduleClass
                                                       bridge:self
                                               moduleRegistry:_objCModuleRegistry
                                      viewRegistry_DEPRECATED:_viewRegistry_DEPRECATED
                                                bundleManager:_bundleManager
                                            callableJSModules:_callableJSModules];
      BridgeNativeModulePerfLogger::moduleDataCreateEnd([moduleName UTF8String], moduleDataId);

      _moduleDataByName[moduleName] = moduleData;
      [_moduleClassesByID addObject:moduleClass];
      [_moduleDataByID addObject:moduleData];
    }
  }
#endif
}

- (NSArray<ABI49_0_0RCTModuleData *> *)_initializeModules:(NSArray<Class> *)modules
                               withDispatchGroup:(dispatch_group_t)dispatchGroup
                                lazilyDiscovered:(BOOL)lazilyDiscovered
{
  // Set up moduleData for automatically-exported modules
  NSArray<ABI49_0_0RCTModuleData *> *moduleDataById = [self _registerModulesForClasses:modules
                                                             lazilyDiscovered:lazilyDiscovered];

  if (lazilyDiscovered) {
#if ABI49_0_0RCT_DEBUG
    // Lazily discovered modules do not require instantiation here,
    // as they are not allowed to have pre-instantiated instance
    // and must not require the main queue.
    for (ABI49_0_0RCTModuleData *moduleData in moduleDataById) {
      ABI49_0_0RCTAssert(
          !(moduleData.requiresMainQueueSetup || moduleData.hasInstance),
          @"Module \'%@\' requires initialization on the Main Queue or has pre-instantiated, which is not supported for the lazily discovered modules.",
          moduleData.name);
    }
#endif
  } else {
    ABI49_0_0RCT_PROFILE_BEGIN_EVENT(
        ABI49_0_0RCTProfileTagAlways, @"-[ABI49_0_0RCTCxxBridge initModulesWithDispatchGroup:] moduleData.hasInstance", nil);
    // Dispatch module init onto main thread for those modules that require it
    // For non-lazily discovered modules we run through the entire set of modules
    // that we have, otherwise some modules coming from the delegate
    // or module provider block, will not be properly instantiated.
    for (ABI49_0_0RCTModuleData *moduleData in _moduleDataByID) {
      if (moduleData.hasInstance && (!moduleData.requiresMainQueueSetup || ABI49_0_0RCTIsMainQueue())) {
        // Modules that were pre-initialized should ideally be set up before
        // bridge init has finished, otherwise the caller may try to access the
        // module directly rather than via `[bridge moduleForClass:]`, which won't
        // trigger the lazy initialization process. If the module cannot safely be
        // set up on the current thread, it will instead be async dispatched
        // to the main thread to be set up in _prepareModulesWithDispatchGroup:.
        (void)[moduleData instance];
      }
    }
    ABI49_0_0RCT_PROFILE_END_EVENT(ABI49_0_0RCTProfileTagAlways, @"");

    // From this point on, ABI49_0_0RCTDidInitializeModuleNotification notifications will
    // be sent the first time a module is accessed.
    _moduleSetupComplete = YES;
    [self _prepareModulesWithDispatchGroup:dispatchGroup];
  }

#if ABI49_0_0RCT_PROFILE
  if (ABI49_0_0RCTProfileIsProfiling()) {
    // Depends on moduleDataByID being loaded
    ABI49_0_0RCTProfileHookModules(self);
  }
#endif
  return moduleDataById;
}

- (void)registerAdditionalModuleClasses:(NSArray<Class> *)modules
{
  std::lock_guard<std::mutex> guard(_moduleRegistryLock);
  if (_moduleRegistryCreated) {
    NSArray<ABI49_0_0RCTModuleData *> *newModules = [self _initializeModules:modules
                                                  withDispatchGroup:NULL
                                                   lazilyDiscovered:YES];
    assert(_ABI49_0_0ReactInstance); // at this point you must have ABI49_0_0ReactInstance as you already called
                            // ABI49_0_0ReactInstance->initializeBridge
    _ABI49_0_0ReactInstance->getModuleRegistry().registerModules(createNativeModules(newModules, self, _ABI49_0_0ReactInstance));
  } else {
    [self registerModulesForClasses:modules];
  }
}

- (void)_prepareModulesWithDispatchGroup:(dispatch_group_t)dispatchGroup
{
  ABI49_0_0RCT_PROFILE_BEGIN_EVENT(0, @"-[ABI49_0_0RCTCxxBridge _prepareModulesWithDispatchGroup]", nil);

  BOOL initializeImmediately = NO;
  if (dispatchGroup == NULL) {
    // If no dispatchGroup is passed in, we must prepare everything immediately.
    // We better be on the right thread too.
    ABI49_0_0RCTAssertMainQueue();
    initializeImmediately = YES;
  }

  // Set up modules that require main thread init or constants export
  [_performanceLogger setValue:0 forTag:ABI49_0_0RCTPLNativeModuleMainThread];

  for (ABI49_0_0RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.requiresMainQueueSetup) {
      // Modules that need to be set up on the main thread cannot be initialized
      // lazily when required without doing a dispatch_sync to the main thread,
      // which can result in deadlock. To avoid this, we initialize all of these
      // modules on the main thread in parallel with loading the JS code, so
      // they will already be available before they are ever required.
      dispatch_block_t block = ^{
        if (self.valid && ![moduleData.moduleClass isSubclassOfClass:[ABI49_0_0RCTCxxModule class]]) {
          [self->_performanceLogger appendStartForTag:ABI49_0_0RCTPLNativeModuleMainThread];
          (void)[moduleData instance];
          if (!ABI49_0_0RCTIsMainQueueExecutionOfConstantsToExportDisabled()) {
            [moduleData gatherConstants];
          }
          [self->_performanceLogger appendStopForTag:ABI49_0_0RCTPLNativeModuleMainThread];
        }
      };

      if (initializeImmediately && ABI49_0_0RCTIsMainQueue()) {
        block();
      } else {
        // We've already checked that dispatchGroup is non-null, but this satisfies the
        // Xcode analyzer
        if (dispatchGroup) {
          dispatch_group_async(dispatchGroup, dispatch_get_main_queue(), block);
        }
      }
      _modulesInitializedOnMainQueue++;
    }
  }
  [_performanceLogger setValue:_modulesInitializedOnMainQueue forTag:ABI49_0_0RCTPLNativeModuleMainThreadUsesCount];
  ABI49_0_0RCT_PROFILE_END_EVENT(ABI49_0_0RCTProfileTagAlways, @"");
}

- (void)registerModuleForFrameUpdates:(id<ABI49_0_0RCTBridgeModule>)module withModuleData:(ABI49_0_0RCTModuleData *)moduleData
{
  [_displayLink registerModuleForFrameUpdates:module withModuleData:moduleData];
}

- (void)executeSourceCode:(NSData *)sourceCode withSourceURL:(NSURL *)url sync:(BOOL)sync
{
  // This will get called from whatever thread was actually executing JS.
  dispatch_block_t completion = ^{
    // Log start up metrics early before processing any other js calls
    [self logStartupFinish];
    // Flush pending calls immediately so we preserve ordering
    [self _flushPendingCalls];

    // Perform the state update and notification on the main thread, so we can't run into
    // timing issues with ABI49_0_0RCTRootView
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter] postNotificationName:ABI49_0_0RCTJavaScriptDidLoadNotification
                                                          object:self->_parentBridge
                                                        userInfo:@{@"bridge" : self}];

      // Starting the display link is not critical to startup, so do it last
      [self ensureOnJavaScriptThread:^{
        // Register the display link to start sending js calls after everything is setup
        [self->_displayLink addToRunLoop:[NSRunLoop currentRunLoop]];
      }];
    });
  };

  if (sync) {
    [self executeApplicationScriptSync:sourceCode url:url];
    completion();
  } else {
    [self enqueueApplicationScript:sourceCode url:url onComplete:completion];
  }

  // Use the original request URL here - HMRClient uses this to derive the /hot URL and entry point.
  [self.devSettings setupHMRClientWithBundleURL:self.bundleURL];
}

#if ABI49_0_0RCT_DEV_MENU | ABI49_0_0RCT_PACKAGER_LOADING_FUNCTIONALITY
- (void)loadAndExecuteSplitBundleURL:(NSURL *)bundleURL
                             onError:(ABI49_0_0RCTLoadAndExecuteErrorBlock)onError
                          onComplete:(dispatch_block_t)onComplete
{
  __weak __typeof(self) weakSelf = self;
  [ABI49_0_0RCTJavaScriptLoader loadBundleAtURL:bundleURL
      onProgress:^(ABI49_0_0RCTLoadingProgress *progressData) {
#if (ABI49_0_0RCT_DEV_MENU | ABI49_0_0RCT_ENABLE_LOADING_VIEW) && __has_include(<ABI49_0_0React/ABI49_0_0RCTDevLoadingViewProtocol.h>)
        id<ABI49_0_0RCTDevLoadingViewProtocol> loadingView = [weakSelf moduleForName:@"DevLoadingView"
                                                      lazilyLoadIfNecessary:YES];
        [loadingView updateProgress:progressData];
#endif
      }
      onComplete:^(NSError *error, ABI49_0_0RCTSource *source) {
        if (error) {
          onError(error);
          return;
        }

        [self enqueueApplicationScript:source.data
                                   url:source.url
                            onComplete:^{
                              [self.devSettings setupHMRClientWithAdditionalBundleURL:source.url];
                              onComplete();
                            }];
      }];
}
#else
- (void)loadAndExecuteSplitBundleURL:(NSURL *)bundleURL
                             onError:(ABI49_0_0RCTLoadAndExecuteErrorBlock)onError
                          onComplete:(dispatch_block_t)onComplete
{
}
#endif

- (void)handleError:(NSError *)error
{
  // This is generally called when the infrastructure throws an
  // exception while calling JS.  Most product exceptions will not go
  // through this method, but through ABI49_0_0RCTExceptionManager.

  // There are three possible states:
  // 1. initializing == _valid && _loading
  // 2. initializing/loading finished (success or failure) == _valid && !_loading
  // 3. invalidated == !_valid && !_loading

  // !_valid && _loading can't happen.

  // In state 1: on main queue, move to state 2, reset the bridge, and ABI49_0_0RCTFatal.
  // In state 2: go directly to ABI49_0_0RCTFatal.  Do not enqueue, do not collect $200.
  // In state 3: do nothing.

  if (self->_valid && !self->_loading) {
    if ([error userInfo][ABI49_0_0RCTJSRawStackTraceKey]) {
      [self.redBox showErrorMessage:[error localizedDescription] withRawStack:[error userInfo][ABI49_0_0RCTJSRawStackTraceKey]];
    }

    ABI49_0_0RCTFatal(error);

    // ABI49_0_0RN will stop, but let the rest of the app keep going.
    return;
  }

  if (!_valid || !_loading) {
    return;
  }

  // Hack: once the bridge is invalidated below, it won't initialize any new native
  // modules. Initialize the redbox module now so we can still report this error.
  ABI49_0_0RCTRedBox *redBox = [self redBox];

  _loading = NO;
  _valid = NO;
  _moduleRegistryCreated = NO;

  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_jsMessageThread) {
      // Make sure initializeBridge completed
      self->_jsMessageThread->runOnQueueSync([] {});
    }

    self->_ABI49_0_0ReactInstance.reset();
    self->_jsMessageThread.reset();

    [[NSNotificationCenter defaultCenter] postNotificationName:ABI49_0_0RCTJavaScriptDidFailToLoadNotification
                                                        object:self->_parentBridge
                                                      userInfo:@{@"bridge" : self, @"error" : error}];

    if ([error userInfo][ABI49_0_0RCTJSRawStackTraceKey]) {
      [redBox showErrorMessage:[error localizedDescription] withRawStack:[error userInfo][ABI49_0_0RCTJSRawStackTraceKey]];
    }

    ABI49_0_0RCTFatal(error);
  });
}

ABI49_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithDelegate
                    : (__unused id<ABI49_0_0RCTBridgeDelegate>)delegate bundleURL
                    : (__unused NSURL *)bundleURL moduleProvider
                    : (__unused ABI49_0_0RCTBridgeModuleListProvider)block launchOptions
                    : (__unused NSDictionary *)launchOptions)

ABI49_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithBundleURL
                    : (__unused NSURL *)bundleURL moduleProvider
                    : (__unused ABI49_0_0RCTBridgeModuleListProvider)block launchOptions
                    : (__unused NSDictionary *)launchOptions)

/**
 * Prevent super from calling setUp (that'd create another batchedBridge)
 */
- (void)setUp
{
}

- (Class)executorClass
{
  return _parentBridge.executorClass;
}

- (void)setExecutorClass:(Class)executorClass
{
  ABI49_0_0RCTAssertMainQueue();

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

- (id<ABI49_0_0RCTBridgeDelegate>)delegate
{
  return _parentBridge.delegate;
}

- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue
{
  if (queue == ABI49_0_0RCTJSThread) {
    [self ensureOnJavaScriptThread:block];
  } else if (queue) {
    dispatch_async(queue, block);
  }
}

#pragma mark - ABI49_0_0RCTInvalidating

- (void)invalidate
{
  if (_didInvalidate) {
    return;
  }

  ABI49_0_0RCTAssertMainQueue();
  ABI49_0_0RCTLogInfo(@"Invalidating %@ (parent: %@, executor: %@)", self, _parentBridge, [self executorClass]);

  _loading = NO;
  _valid = NO;
  _didInvalidate = YES;
  _moduleRegistryCreated = NO;

  if ([ABI49_0_0RCTBridge currentBridge] == self) {
    [ABI49_0_0RCTBridge setCurrentBridge:nil];
  }

  // Stop JS instance and message thread
  [self ensureOnJavaScriptThread:^{
    [self->_displayLink invalidate];
    self->_displayLink = nil;

    if (ABI49_0_0RCTProfileIsProfiling()) {
      ABI49_0_0RCTProfileUnhookModules(self);
    }

    // Invalidate modules

    [[NSNotificationCenter defaultCenter] postNotificationName:ABI49_0_0RCTBridgeWillInvalidateModulesNotification
                                                        object:self->_parentBridge
                                                      userInfo:@{@"bridge" : self}];

    // We're on the JS thread (which we'll be suspending soon), so no new calls will be made to native modules after
    // this completes. We must ensure all previous calls were dispatched before deallocating the instance (and module
    // wrappers) or we may have invalid pointers still in flight.
    dispatch_group_t moduleInvalidation = dispatch_group_create();
    for (ABI49_0_0RCTModuleData *moduleData in self->_moduleDataByID) {
      // Be careful when grabbing an instance here, we don't want to instantiate
      // any modules just to invalidate them.
      if (![moduleData hasInstance]) {
        continue;
      }

      if ([moduleData.instance respondsToSelector:@selector(invalidate)]) {
        dispatch_group_enter(moduleInvalidation);
        [self
            dispatchBlock:^{
              [(id<ABI49_0_0RCTInvalidating>)moduleData.instance invalidate];
              dispatch_group_leave(moduleInvalidation);
            }
                    queue:moduleData.methodQueue];
      }
      [moduleData invalidate];
    }

    if (dispatch_group_wait(moduleInvalidation, dispatch_time(DISPATCH_TIME_NOW, 10 * NSEC_PER_SEC))) {
      ABI49_0_0RCTLogError(@"Timed out waiting for modules to be invalidated");
    }

    [[NSNotificationCenter defaultCenter] postNotificationName:ABI49_0_0RCTBridgeDidInvalidateModulesNotification
                                                        object:self->_parentBridge
                                                      userInfo:@{@"bridge" : self}];

    self->_ABI49_0_0ReactInstance.reset();
    self->_jsMessageThread.reset();

    self->_moduleDataByName = nil;
    self->_moduleDataByID = nil;
    self->_moduleClassesByID = nil;
    self->_pendingCalls = nil;

    [self->_jsThread cancel];
    self->_jsThread = nil;
    CFRunLoopStop(CFRunLoopGetCurrent());
  }];
}

- (void)logMessage:(NSString *)message level:(NSString *)level
{
  if (ABI49_0_0RCT_DEBUG && _valid) {
    [self enqueueJSCall:@"ABI49_0_0RCTLog" method:@"logIfNoNativeHook" args:@[ level, message ] completion:NULL];
  }
}

#pragma mark - ABI49_0_0RCTBridge methods

- (void)_runAfterLoad:(ABI49_0_0RCTPendingCall)block
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
    // From the callers' perspective:

    // Phase 1: jsQueueBlocks are added to the queue; _pendingCount is
    // incremented for each.  If the first block is created after self.loading is
    // true, phase 1 will be nothing.
    _pendingCount++;
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
        self->_pendingCount--;
      }
    };
    [self ensureOnJavaScriptThread:jsQueueBlock];
  } else {
    // Phase 2/Phase D: blocks are executed directly, adding work to the JS queue.
    block();
  }
}

- (void)logStartupFinish
{
  // Log metrics about native requires during the bridge startup.
  uint64_t nativeRequiresCount = [_performanceLogger valueForTag:ABI49_0_0RCTPLRAMNativeRequiresCount];
  [_performanceLogger setValue:nativeRequiresCount forTag:ABI49_0_0RCTPLRAMStartupNativeRequiresCount];
  uint64_t nativeRequires = [_performanceLogger valueForTag:ABI49_0_0RCTPLRAMNativeRequires];
  [_performanceLogger setValue:nativeRequires forTag:ABI49_0_0RCTPLRAMStartupNativeRequires];

  [_performanceLogger markStopForTag:ABI49_0_0RCTPLBridgeStartup];
}

- (void)_flushPendingCalls
{
  ABI49_0_0RCT_PROFILE_BEGIN_EVENT(0, @"Processing pendingCalls", @{@"count" : [@(_pendingCalls.count) stringValue]});
  // Phase B: _flushPendingCalls happens.  Each block in _pendingCalls is
  // executed, adding work to the queue, and _pendingCount is decremented.
  // loading is set to NO.
  NSArray<ABI49_0_0RCTPendingCall> *pendingCalls = _pendingCalls;
  _pendingCalls = nil;
  for (ABI49_0_0RCTPendingCall call in pendingCalls) {
    call();
    _pendingCount--;
  }
  _loading = NO;
  ABI49_0_0RCT_PROFILE_END_EVENT(ABI49_0_0RCTProfileTagAlways, @"");
}

/**
 * Public. Can be invoked from any thread.
 */
- (void)enqueueJSCall:(NSString *)module
               method:(NSString *)method
                 args:(NSArray *)args
           completion:(dispatch_block_t)completion
{
  if (!self.valid) {
    return;
  }

  /**
   * AnyThread
   */
  ABI49_0_0RCT_PROFILE_BEGIN_EVENT(ABI49_0_0RCTProfileTagAlways, @"-[ABI49_0_0RCTCxxBridge enqueueJSCall:]", nil);

  ABI49_0_0RCTProfileBeginFlowEvent();
  __weak __typeof(self) weakSelf = self;
  [self _runAfterLoad:^() {
    ABI49_0_0RCTProfileEndFlowEvent();
    __strong __typeof(weakSelf) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }

    if (strongSelf->_ABI49_0_0ReactInstance) {
      strongSelf->_ABI49_0_0ReactInstance->callJSFunction(
          [ABI49_0_0EX_REMOVE_VERSION(module) UTF8String], [method UTF8String], convertIdToFollyDynamic(args ?: @[]));

      // ensureOnJavaScriptThread may execute immediately, so use jsMessageThread, to make sure
      // the block is invoked after callJSFunction
      if (completion) {
        if (strongSelf->_jsMessageThread) {
          strongSelf->_jsMessageThread->runOnQueue(completion);
        } else {
          ABI49_0_0RCTLogWarn(@"Can't invoke completion without messageThread");
        }
      }
    }
  }];

  ABI49_0_0RCT_PROFILE_END_EVENT(ABI49_0_0RCTProfileTagAlways, @"");
}

/**
 * Called by ABI49_0_0RCTModuleMethod from any thread.
 */
- (void)enqueueCallback:(NSNumber *)cbID args:(NSArray *)args
{
  if (!self.valid) {
    return;
  }

  /**
   * AnyThread
   */

  ABI49_0_0RCTProfileBeginFlowEvent();
  __weak __typeof(self) weakSelf = self;
  [self _runAfterLoad:^() {
    ABI49_0_0RCTProfileEndFlowEvent();
    __strong __typeof(weakSelf) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }

    if (strongSelf->_ABI49_0_0ReactInstance) {
      strongSelf->_ABI49_0_0ReactInstance->callJSCallback([cbID unsignedLongLongValue], convertIdToFollyDynamic(args ?: @[]));
    }
  }];
}

/**
 * Private hack to support `setTimeout(fn, 0)`
 */
- (void)_immediatelyCallTimer:(NSNumber *)timer
{
  if (_ABI49_0_0ReactInstance) {
    _ABI49_0_0ReactInstance->callJSFunction(
        "JSTimers", "callTimers", folly::dynamic::array(folly::dynamic::array([timer doubleValue])));
  }
}

- (void)enqueueApplicationScript:(NSData *)script url:(NSURL *)url onComplete:(dispatch_block_t)onComplete
{
  ABI49_0_0RCT_PROFILE_BEGIN_EVENT(ABI49_0_0RCTProfileTagAlways, @"-[ABI49_0_0RCTCxxBridge enqueueApplicationScript]", nil);

  [self executeApplicationScript:script url:url async:YES];

  ABI49_0_0RCT_PROFILE_END_EVENT(ABI49_0_0RCTProfileTagAlways, @"");

  // Assumes that onComplete can be called when the next block on the JS thread is scheduled
  if (onComplete) {
    ABI49_0_0RCTAssert(_jsMessageThread != nullptr, @"Cannot invoke completion without jsMessageThread");
    _jsMessageThread->runOnQueue(onComplete);
  }
}

- (void)executeApplicationScriptSync:(NSData *)script url:(NSURL *)url
{
  [self executeApplicationScript:script url:url async:NO];
}

static uint32_t ABI49_0_0RCTReadUInt32LE(NSData *script, uint32_t offset)
{
  return [script length] < offset + 4 ? 0 : CFSwapInt32LittleToHost(*(((uint32_t *)[script bytes]) + offset / 4));
}

- (void)executeApplicationScript:(NSData *)script url:(NSURL *)url async:(BOOL)async
{
  [self _tryAndHandleError:^{
    NSString *sourceUrlStr = deriveSourceURL(url);
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI49_0_0RCTJavaScriptWillStartExecutingNotification
                                                        object:self->_parentBridge
                                                      userInfo:@{@"bridge" : self}];

    BundleHeader header;
    [script getBytes:&header length:sizeof(header)];
    ScriptTag scriptType = parseTypeFromHeader(header);

    // hold a local reference to ABI49_0_0ReactInstance in case a parallel thread
    // resets it between null check and usage
    auto ABI49_0_0ReactInstance = self->_ABI49_0_0ReactInstance;
    if (ABI49_0_0ReactInstance && scriptType == ScriptTag::MetroHBCBundle) {
      uint32_t offset = 8;
      while (offset < script.length) {
        uint32_t fileLength = ABI49_0_0RCTReadUInt32LE(script, offset);
        NSData *unit = [script subdataWithRange:NSMakeRange(offset + 4, fileLength)];
        ABI49_0_0ReactInstance->loadScriptFromString(std::make_unique<NSDataBigString>(unit), sourceUrlStr.UTF8String, false);
        offset += ((fileLength + ABI49_0_0RCT_BYTECODE_ALIGNMENT - 1) & ~(ABI49_0_0RCT_BYTECODE_ALIGNMENT - 1)) + 4;
      }
    } else if (scriptType == ScriptTag::RAMBundle) {
      [self->_performanceLogger markStartForTag:ABI49_0_0RCTPLRAMBundleLoad];
      auto ramBundle = std::make_unique<JSIndexedRAMBundle>(sourceUrlStr.UTF8String);
      std::unique_ptr<const JSBigString> scriptStr = ramBundle->getStartupCode();
      [self->_performanceLogger markStopForTag:ABI49_0_0RCTPLRAMBundleLoad];
      [self->_performanceLogger setValue:scriptStr->size() forTag:ABI49_0_0RCTPLRAMStartupCodeSize];
      if (ABI49_0_0ReactInstance) {
        auto registry =
            RAMBundleRegistry::multipleBundlesRegistry(std::move(ramBundle), JSIndexedRAMBundle::buildFactory());
        ABI49_0_0ReactInstance->loadRAMBundle(std::move(registry), std::move(scriptStr), sourceUrlStr.UTF8String, !async);
      }
    } else if (ABI49_0_0ReactInstance) {
      ABI49_0_0ReactInstance->loadScriptFromString(std::make_unique<NSDataBigString>(script), sourceUrlStr.UTF8String, !async);
    } else {
      std::string methodName = async ? "loadBundle" : "loadBundleSync";
      throw std::logic_error("Attempt to call " + methodName + ": on uninitialized bridge");
    }
  }];
}

- (void)registerSegmentWithId:(NSUInteger)segmentId path:(NSString *)path
{
  if (_ABI49_0_0ReactInstance) {
    _ABI49_0_0ReactInstance->registerBundle(static_cast<uint32_t>(segmentId), path.UTF8String);
  }
}

#pragma mark - Payload Processing

- (void)partialBatchDidFlush
{
  for (ABI49_0_0RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.implementsPartialBatchDidFlush) {
      [self
          dispatchBlock:^{
            [moduleData.instance partialBatchDidFlush];
          }
                  queue:moduleData.methodQueue];
    }
  }
}

- (void)batchDidComplete
{
  // TODO #12592471: batchDidComplete is only used by ABI49_0_0RCTUIManager,
  // can we eliminate this special case?
  for (ABI49_0_0RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.implementsBatchDidComplete) {
      [self
          dispatchBlock:^{
            [moduleData.instance batchDidComplete];
          }
                  queue:moduleData.methodQueue];
    }
  }
}

- (void)startProfiling
{
  ABI49_0_0RCTAssertMainQueue();

  [self ensureOnJavaScriptThread:^{
#if WITH_FBSYSTRACE
    [ABI49_0_0RCTFBSystrace registerCallbacks];
#endif
    ABI49_0_0RCTProfileInit(self);

    [self enqueueJSCall:@"Systrace" method:@"setEnabled" args:@[ @YES ] completion:NULL];
  }];
}

- (void)stopProfiling:(void (^)(NSData *))callback
{
  ABI49_0_0RCTAssertMainQueue();

  [self ensureOnJavaScriptThread:^{
    [self enqueueJSCall:@"Systrace" method:@"setEnabled" args:@[ @NO ] completion:NULL];
    ABI49_0_0RCTProfileEnd(self, ^(NSString *log) {
      NSData *logData = [log dataUsingEncoding:NSUTF8StringEncoding];
      callback(logData);
#if WITH_FBSYSTRACE
      if (![ABI49_0_0RCTFBSystrace verifyTraceSize:logData.length]) {
        ABI49_0_0RCTLogWarn(
            @"Your FBSystrace trace might be truncated, try to bump up the buffer size"
             " in ABI49_0_0RCTFBSystrace.m or capture a shorter trace");
      }
      [ABI49_0_0RCTFBSystrace unregisterCallbacks];
#endif
    });
  }];
}

- (BOOL)isBatchActive
{
  return _ABI49_0_0ReactInstance ? _ABI49_0_0ReactInstance->isBatchActive() : NO;
}

- (void *)runtime
{
  if (!_ABI49_0_0ReactInstance) {
    return nullptr;
  }

  return _ABI49_0_0ReactInstance->getJavaScriptContext();
}

- (void)invokeAsync:(std::function<void()> &&)func
{
  __block auto retainedFunc = std::move(func);
  __weak __typeof(self) weakSelf = self;
  [self _runAfterLoad:^{
    __strong __typeof(self) strongSelf = weakSelf;

    if (std::shared_ptr<CallInvoker> jsInvoker = strongSelf.jsCallInvoker) {
      jsInvoker->invokeAsync(std::move(retainedFunc));
    }
  }];
}

#pragma mark - ABI49_0_0RCTBridge (ABI49_0_0RCTTurboModule)

- (std::shared_ptr<CallInvoker>)jsCallInvoker
{
  return _ABI49_0_0ReactInstance ? _ABI49_0_0ReactInstance->getJSCallInvoker() : nullptr;
}

- (std::shared_ptr<CallInvoker>)decorateNativeCallInvoker:(std::shared_ptr<CallInvoker>)nativeInvoker
{
  return _ABI49_0_0ReactInstance ? _ABI49_0_0ReactInstance->getDecoratedNativeCallInvoker(nativeInvoker) : nullptr;
}

@end
