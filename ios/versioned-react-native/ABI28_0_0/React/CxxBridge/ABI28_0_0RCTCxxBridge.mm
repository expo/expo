// Copyright 2004-present Facebook. All Rights Reserved.

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <atomic>
#include <future>

#import <ReactABI28_0_0/ABI28_0_0RCTAssert.h>
#import <ReactABI28_0_0/ABI28_0_0RCTBridge+Private.h>
#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import <ReactABI28_0_0/ABI28_0_0RCTBridgeMethod.h>
#import <ReactABI28_0_0/ABI28_0_0RCTConvert.h>
#import <ReactABI28_0_0/ABI28_0_0RCTCxxBridgeDelegate.h>
#import <ReactABI28_0_0/ABI28_0_0RCTCxxModule.h>
#import <ReactABI28_0_0/ABI28_0_0RCTCxxUtils.h>
#import <ReactABI28_0_0/ABI28_0_0RCTDevSettings.h>
#import <ReactABI28_0_0/ABI28_0_0RCTDisplayLink.h>
#import <ReactABI28_0_0/ABI28_0_0RCTJavaScriptLoader.h>
#import <ReactABI28_0_0/ABI28_0_0RCTLog.h>
#import <ReactABI28_0_0/ABI28_0_0RCTModuleData.h>
#import <ReactABI28_0_0/ABI28_0_0RCTPerformanceLogger.h>
#import <ReactABI28_0_0/ABI28_0_0RCTProfile.h>
#import <ReactABI28_0_0/ABI28_0_0RCTRedBox.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUtils.h>
#import <ReactABI28_0_0/ABI28_0_0RCTFollyConvert.h>
#import <cxxReactABI28_0_0/ABI28_0_0CxxNativeModule.h>
#import <cxxReactABI28_0_0/ABI28_0_0Instance.h>
#import <cxxReactABI28_0_0/ABI28_0_0JSBundleType.h>
#import <cxxReactABI28_0_0/ABI28_0_0JSCExecutor.h>
#import <cxxReactABI28_0_0/ABI28_0_0JSIndexedRAMBundle.h>
#import <cxxReactABI28_0_0/ABI28_0_0Platform.h>
#import <cxxReactABI28_0_0/ABI28_0_0RAMBundleRegistry.h>
#import <ABI28_0_0jschelpers/ABI28_0_0Value.h>

#import "ABI28_0_0NSDataBigString.h"
#import "ABI28_0_0RCTJSCHelpers.h"
#import "ABI28_0_0RCTMessageThread.h"
#import "ABI28_0_0RCTObjcExecutor.h"

#ifdef WITH_FBSYSTRACE
#import <ReactABI28_0_0/ABI28_0_0RCTFBSystrace.h>
#endif

#if ABI28_0_0RCT_DEV && __has_include("ABI28_0_0RCTDevLoadingView.h")
#import "ABI28_0_0RCTDevLoadingView.h"
#endif

#define ABI28_0_0RCTAssertJSThread() \
  ABI28_0_0RCTAssert(self.executorClass || self->_jsThread == [NSThread currentThread], \
            @"This method must be called on JS thread")

static NSString *const ABI28_0_0RCTJSThreadName = @"com.facebook.ReactABI28_0_0.JavaScript";

typedef void (^ABI28_0_0RCTPendingCall)();

using namespace facebook::ReactABI28_0_0;

/**
 * Must be kept in sync with `MessageQueue.js`.
 */
typedef NS_ENUM(NSUInteger, ABI28_0_0RCTBridgeFields) {
  ABI28_0_0RCTBridgeFieldRequestModuleIDs = 0,
  ABI28_0_0RCTBridgeFieldMethodIDs,
  ABI28_0_0RCTBridgeFieldParams,
  ABI28_0_0RCTBridgeFieldCallID,
};

namespace {

class GetDescAdapter : public JSExecutorFactory {
public:
  GetDescAdapter(ABI28_0_0RCTCxxBridge *bridge, std::shared_ptr<JSExecutorFactory> factory)
    : bridge_(bridge)
    , factory_(factory) {}
  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override {
    auto ret = factory_->createJSExecutor(delegate, jsQueue);
    bridge_.bridgeDescription =
      [NSString stringWithFormat:@"ABI28_0_0RCTCxxBridge %s",
                ret->getDescription().c_str()];
    return std::move(ret);
  }

private:
  ABI28_0_0RCTCxxBridge *bridge_;
  std::shared_ptr<JSExecutorFactory> factory_;
};

}

static bool isRAMBundle(NSData *script) {
  BundleHeader header;
  [script getBytes:&header length:sizeof(header)];
  return parseTypeFromHeader(header) == ScriptTag::RAMBundle;
}

static void registerPerformanceLoggerHooks(ABI28_0_0RCTPerformanceLogger *performanceLogger) {
  __weak ABI28_0_0RCTPerformanceLogger *weakPerformanceLogger = performanceLogger;
  ReactABI28_0_0Marker::logTaggedMarker = [weakPerformanceLogger](const ReactABI28_0_0Marker::ReactABI28_0_0MarkerId markerId, const char *tag) {
    switch (markerId) {
      case ReactABI28_0_0Marker::RUN_JS_BUNDLE_START:
        [weakPerformanceLogger markStartForTag:ABI28_0_0RCTPLScriptExecution];
        break;
      case ReactABI28_0_0Marker::RUN_JS_BUNDLE_STOP:
        [weakPerformanceLogger markStopForTag:ABI28_0_0RCTPLScriptExecution];
        break;
      case ReactABI28_0_0Marker::NATIVE_REQUIRE_START:
        [weakPerformanceLogger appendStartForTag:ABI28_0_0RCTPLRAMNativeRequires];
        break;
      case ReactABI28_0_0Marker::NATIVE_REQUIRE_STOP:
        [weakPerformanceLogger appendStopForTag:ABI28_0_0RCTPLRAMNativeRequires];
        [weakPerformanceLogger addValue:1 forTag:ABI28_0_0RCTPLRAMNativeRequiresCount];
        break;
      case ReactABI28_0_0Marker::CREATE_REACT_CONTEXT_STOP:
      case ReactABI28_0_0Marker::JS_BUNDLE_STRING_CONVERT_START:
      case ReactABI28_0_0Marker::JS_BUNDLE_STRING_CONVERT_STOP:
      case ReactABI28_0_0Marker::NATIVE_MODULE_SETUP_START:
      case ReactABI28_0_0Marker::NATIVE_MODULE_SETUP_STOP:
        // These are not used on iOS.
        break;
    }
  };
}

@interface ABI28_0_0RCTCxxBridge ()

@property (nonatomic, weak, readonly) ABI28_0_0RCTBridge *parentBridge;
@property (nonatomic, assign, readonly) BOOL moduleSetupComplete;

- (instancetype)initWithParentBridge:(ABI28_0_0RCTBridge *)bridge;
- (void)partialBatchDidFlush;
- (void)batchDidComplete;

@end

struct ABI28_0_0RCTInstanceCallback : public InstanceCallback {
  __weak ABI28_0_0RCTCxxBridge *bridge_;
  ABI28_0_0RCTInstanceCallback(ABI28_0_0RCTCxxBridge *bridge): bridge_(bridge) {};
  void onBatchComplete() override {
    // There's no interface to call this per partial batch
    [bridge_ partialBatchDidFlush];
    [bridge_ batchDidComplete];
  }
};

@implementation ABI28_0_0RCTCxxBridge
{
  BOOL _wasBatchActive;
  BOOL _didInvalidate;

  NSMutableArray<ABI28_0_0RCTPendingCall> *_pendingCalls;
  std::atomic<NSInteger> _pendingCount;

  // Native modules
  NSMutableDictionary<NSString *, ABI28_0_0RCTModuleData *> *_moduleDataByName;
  NSMutableArray<ABI28_0_0RCTModuleData *> *_moduleDataByID;
  NSMutableArray<Class> *_moduleClassesByID;
  NSUInteger _modulesInitializedOnMainQueue;
  ABI28_0_0RCTDisplayLink *_displayLink;

  // JS thread management
  NSThread *_jsThread;
  std::shared_ptr<ABI28_0_0RCTMessageThread> _jsMessageThread;

  // This is uniquely owned, but weak_ptr is used.
  std::shared_ptr<Instance> _ReactABI28_0_0Instance;
}

@synthesize bridgeDescription = _bridgeDescription;
@synthesize loading = _loading;
@synthesize performanceLogger = _performanceLogger;
@synthesize valid = _valid;

+ (void)initialize
{
  if (self == [ABI28_0_0RCTCxxBridge class]) {
    ABI28_0_0RCTPrepareJSCExecutor();
  }
}

- (JSGlobalContextRef)jsContextRef
{
  return (JSGlobalContextRef)(_ReactABI28_0_0Instance ? _ReactABI28_0_0Instance->getJavaScriptContext() : nullptr);
}

- (BOOL)isInspectable
{
  return _ReactABI28_0_0Instance ? _ReactABI28_0_0Instance->isInspectable() : NO;
}

- (instancetype)initWithParentBridge:(ABI28_0_0RCTBridge *)bridge
{
  ABI28_0_0RCTAssertParam(bridge);

  if ((self = [super initWithDelegate:bridge.delegate
                            bundleURL:bridge.bundleURL
                       moduleProvider:bridge.moduleProvider
                        launchOptions:bridge.launchOptions])) {
    _parentBridge = bridge;
    _performanceLogger = [bridge performanceLogger];

    registerPerformanceLoggerHooks(_performanceLogger);

    ABI28_0_0RCTLogInfo(@"Initializing %@ (parent: %@, executor: %@)", self, bridge, [self executorClass]);

    /**
     * Set Initial State
     */
    _valid = YES;
    _loading = YES;
    _pendingCalls = [NSMutableArray new];
    _displayLink = [ABI28_0_0RCTDisplayLink new];

    _moduleDataByName = [NSMutableDictionary new];
    _moduleClassesByID = [NSMutableArray new];
    _moduleDataByID = [NSMutableArray new];

    [ABI28_0_0RCTBridge setCurrentBridge:self];
  }
  return self;
}

+ (void)runRunLoop
{
  @autoreleasepool {
    ABI28_0_0RCT_PROFILE_BEGIN_EVENT(ABI28_0_0RCTProfileTagAlways, @"-[ABI28_0_0RCTCxxBridge runJSRunLoop] setup", nil);

    // copy thread name to pthread name
    pthread_setname_np([NSThread currentThread].name.UTF8String);

    // Set up a dummy runloop source to avoid spinning
    CFRunLoopSourceContext noSpinCtx = {0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL};
    CFRunLoopSourceRef noSpinSource = CFRunLoopSourceCreate(NULL, 0, &noSpinCtx);
    CFRunLoopAddSource(CFRunLoopGetCurrent(), noSpinSource, kCFRunLoopDefaultMode);
    CFRelease(noSpinSource);

    ABI28_0_0RCT_PROFILE_END_EVENT(ABI28_0_0RCTProfileTagAlways, @"");

    // run the run loop
    while (kCFRunLoopRunStopped != CFRunLoopRunInMode(kCFRunLoopDefaultMode, ((NSDate *)[NSDate distantFuture]).timeIntervalSinceReferenceDate, NO)) {
      ABI28_0_0RCTAssert(NO, @"not reached assertion"); // runloop spun. that's bad.
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

/**
 * Ensure block is run on the JS thread. If we're already on the JS thread, the block will execute synchronously.
 * If we're not on the JS thread, the block is dispatched to that thread. Any errors encountered while executing
 * the block will go through handleError:
 */
- (void)ensureOnJavaScriptThread:(dispatch_block_t)block
{
  ABI28_0_0RCTAssert(_jsThread, @"This method must not be called before the JS thread is created");

  // This does not use _jsMessageThread because it may be called early before the runloop reference is captured
  // and _jsMessageThread is valid. _jsMessageThread also doesn't allow us to shortcut the dispatch if we're
  // already on the correct thread.

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
  ABI28_0_0RCT_PROFILE_BEGIN_EVENT(ABI28_0_0RCTProfileTagAlways, @"-[ABI28_0_0RCTCxxBridge start]", nil);

  [[NSNotificationCenter defaultCenter]
    postNotificationName:ABI28_0_0RCTJavaScriptWillStartLoadingNotification
    object:_parentBridge userInfo:@{@"bridge": self}];

  // Set up the JS thread early
  _jsThread = [[NSThread alloc] initWithTarget:[self class]
                                      selector:@selector(runRunLoop)
                                        object:nil];
  _jsThread.name = ABI28_0_0RCTJSThreadName;
  _jsThread.qualityOfService = NSOperationQualityOfServiceUserInteractive;
#if ABI28_0_0RCT_DEBUG
  _jsThread.stackSize *= 2;
#endif
  [_jsThread start];

  dispatch_group_t prepareBridge = dispatch_group_create();

  [_performanceLogger markStartForTag:ABI28_0_0RCTPLNativeModuleInit];

  [self registerExtraModules];
  // Initialize all native modules that cannot be loaded lazily
  [self _initModules:ABI28_0_0RCTGetModuleClasses() withDispatchGroup:prepareBridge lazilyDiscovered:NO];

  [_performanceLogger markStopForTag:ABI28_0_0RCTPLNativeModuleInit];

  // This doesn't really do anything.  The real work happens in initializeBridge.
  _ReactABI28_0_0Instance.reset(new Instance);

  __weak ABI28_0_0RCTCxxBridge *weakSelf = self;

  // Prepare executor factory (shared_ptr for copy into block)
  std::shared_ptr<JSExecutorFactory> executorFactory;
  if (!self.executorClass) {
    if ([self.delegate conformsToProtocol:@protocol(ABI28_0_0RCTCxxBridgeDelegate)]) {
      id<ABI28_0_0RCTCxxBridgeDelegate> cxxDelegate = (id<ABI28_0_0RCTCxxBridgeDelegate>) self.delegate;
      executorFactory = [cxxDelegate jsExecutorFactoryForBridge:self];
    }
    if (!executorFactory) {
      BOOL useCustomJSC =
        [self.delegate respondsToSelector:@selector(shouldBridgeUseCustomJSC:)] &&
        [self.delegate shouldBridgeUseCustomJSC:self];
      // We use the name of the device and the app for debugging & metrics
      NSString *deviceName = [[UIDevice currentDevice] name];
      NSString *appName = [[NSBundle mainBundle] bundleIdentifier];
      // The arg is a cache dir.  It's not used with standard JSC.
      executorFactory.reset(new JSCExecutorFactory(folly::dynamic::object
        ("OwnerIdentity", "ReactABI28_0_0Native")
        ("AppIdentity", [(appName ?: @"unknown") UTF8String])
        ("DeviceIdentity", [(deviceName ?: @"unknown") UTF8String])
        ("UseCustomJSC", (bool)useCustomJSC)
  #if ABI28_0_0RCT_PROFILE
        ("StartSamplingProfilerOnInit", (bool)self.devSettings.startSamplingProfilerOnLaunch)
  #endif
         , nullptr
      ));
    }
  } else {
    id<ABI28_0_0RCTJavaScriptExecutor> objcExecutor = [self moduleForClass:self.executorClass];
    executorFactory.reset(new ABI28_0_0RCTObjcExecutorFactory(objcExecutor, ^(NSError *error) {
      if (error) {
        [weakSelf handleError:error];
      }
    }));
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
  [self loadSource:^(NSError *error, ABI28_0_0RCTSource *source) {
    if (error) {
      [weakSelf handleError:error];
    }

    sourceCode = source.data;
    dispatch_group_leave(prepareBridge);
  } onProgress:^(ABI28_0_0RCTLoadingProgress *progressData) {
#if ABI28_0_0RCT_DEV && __has_include("ABI28_0_0RCTDevLoadingView.h")
    ABI28_0_0RCTDevLoadingView *loadingView = [weakSelf moduleForClass:[ABI28_0_0RCTDevLoadingView class]];
    [loadingView updateProgress:progressData];
#endif
  }];

  // Wait for both the modules and source code to have finished loading
  dispatch_group_notify(prepareBridge, dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
    ABI28_0_0RCTCxxBridge *strongSelf = weakSelf;
    if (sourceCode && strongSelf.loading) {
      [strongSelf executeSourceCode:sourceCode sync:NO];
    }
  });
  ABI28_0_0RCT_PROFILE_END_EVENT(ABI28_0_0RCTProfileTagAlways, @"");
}

- (void)loadSource:(ABI28_0_0RCTSourceLoadBlock)_onSourceLoad onProgress:(ABI28_0_0RCTSourceLoadProgressBlock)onProgress
{
  NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
  [center postNotificationName:ABI28_0_0RCTBridgeWillDownloadScriptNotification object:_parentBridge];
  [_performanceLogger markStartForTag:ABI28_0_0RCTPLScriptDownload];
  NSUInteger cookie = ABI28_0_0RCTProfileBeginAsyncEvent(0, @"JavaScript download", nil);

  // Suppress a warning if ABI28_0_0RCTProfileBeginAsyncEvent gets compiled out
  (void)cookie;

  ABI28_0_0RCTPerformanceLogger *performanceLogger = _performanceLogger;
  ABI28_0_0RCTSourceLoadBlock onSourceLoad = ^(NSError *error, ABI28_0_0RCTSource *source) {
    ABI28_0_0RCTProfileEndAsyncEvent(0, @"native", cookie, @"JavaScript download", @"JS async");
    [performanceLogger markStopForTag:ABI28_0_0RCTPLScriptDownload];
    [performanceLogger setValue:source.length forTag:ABI28_0_0RCTPLBundleSize];

    NSDictionary *userInfo = source ? @{ ABI28_0_0RCTBridgeDidDownloadScriptNotificationSourceKey: source } : nil;
    [center postNotificationName:ABI28_0_0RCTBridgeDidDownloadScriptNotification object:self->_parentBridge userInfo:userInfo];

    _onSourceLoad(error, source);
  };

  if ([self.delegate respondsToSelector:@selector(loadSourceForBridge:onProgress:onComplete:)]) {
    [self.delegate loadSourceForBridge:_parentBridge onProgress:onProgress onComplete:onSourceLoad];
  } else if ([self.delegate respondsToSelector:@selector(loadSourceForBridge:withBlock:)]) {
    [self.delegate loadSourceForBridge:_parentBridge withBlock:onSourceLoad];
  } else if (!self.bundleURL) {
    NSError *error = ABI28_0_0RCTErrorWithMessage(@"No bundle URL present.\n\nMake sure you're running a packager " \
                                         "server or have included a .jsbundle file in your application bundle.");
    onSourceLoad(error, nil);
  } else {
    [ABI28_0_0RCTJavaScriptLoader loadBundleAtURL:self.bundleURL onProgress:onProgress onComplete:^(NSError *error, ABI28_0_0RCTSource *source) {
      if (error) {
        ABI28_0_0RCTLogError(@"Failed to load bundle(%@) with error:(%@ %@)", self.bundleURL, error.localizedDescription, error.localizedFailureReason);
        return;
      }
      onSourceLoad(error, source);
    }];
  }
}

- (NSArray<Class> *)moduleClasses
{
  if (ABI28_0_0RCT_DEBUG && _valid && _moduleClassesByID == nil) {
    ABI28_0_0RCTLogError(@"Bridge modules have not yet been initialized. You may be "
                "trying to access a module too early in the startup procedure.");
  }
  return _moduleClassesByID;
}

/**
 * Used by ABI28_0_0RCTUIManager
 */
- (ABI28_0_0RCTModuleData *)moduleDataForName:(NSString *)moduleName
{
  return _moduleDataByName[moduleName];
}

- (id)moduleForName:(NSString *)moduleName
{
  return _moduleDataByName[moduleName].instance;
}

- (BOOL)moduleIsInitialized:(Class)moduleClass
{
  return _moduleDataByName[ABI28_0_0RCTBridgeModuleNameForClass(moduleClass)].hasInstance;
}

- (id)jsBoundExtraModuleForClass:(Class)moduleClass
{
  if ([self.delegate conformsToProtocol:@protocol(ABI28_0_0RCTCxxBridgeDelegate)]) {
    id<ABI28_0_0RCTCxxBridgeDelegate> cxxDelegate = (id<ABI28_0_0RCTCxxBridgeDelegate>) self.delegate;
    if ([cxxDelegate respondsToSelector:@selector(jsBoundExtraModuleForClass:)]) {
      return [cxxDelegate jsBoundExtraModuleForClass:moduleClass];
    }
  }

  return nil;
}

- (std::shared_ptr<ModuleRegistry>)_buildModuleRegistry
{
  if (!self.valid) {
    return {};
  }

  [_performanceLogger markStartForTag:ABI28_0_0RCTPLNativeModulePrepareConfig];
  ABI28_0_0RCT_PROFILE_BEGIN_EVENT(ABI28_0_0RCTProfileTagAlways, @"-[ABI28_0_0RCTCxxBridge buildModuleRegistry]", nil);

  __weak __typeof(self) weakSelf = self;
  ModuleRegistry::ModuleNotFoundCallback moduleNotFoundCallback = ^bool(const std::string &name) {
    __strong __typeof(weakSelf) strongSelf = weakSelf;
    return [strongSelf.delegate respondsToSelector:@selector(bridge:didNotFindModule:)] &&
           [strongSelf.delegate bridge:strongSelf didNotFindModule:@(name.c_str())];
  };

  auto registry = std::make_shared<ModuleRegistry>(
         createNativeModules(_moduleDataByID, self, _ReactABI28_0_0Instance),
         moduleNotFoundCallback);

  [_performanceLogger markStopForTag:ABI28_0_0RCTPLNativeModulePrepareConfig];
  ABI28_0_0RCT_PROFILE_END_EVENT(ABI28_0_0RCTProfileTagAlways, @"");

  return registry;
}

- (void)_initializeBridge:(std::shared_ptr<JSExecutorFactory>)executorFactory
{
  if (!self.valid) {
    return;
  }

  ABI28_0_0RCTAssertJSThread();
  __weak ABI28_0_0RCTCxxBridge *weakSelf = self;
  _jsMessageThread = std::make_shared<ABI28_0_0RCTMessageThread>([NSRunLoop currentRunLoop], ^(NSError *error) {
    if (error) {
      [weakSelf handleError:error];
    }
  });

  ABI28_0_0RCT_PROFILE_BEGIN_EVENT(ABI28_0_0RCTProfileTagAlways, @"-[ABI28_0_0RCTCxxBridge initializeBridge:]", nil);
  // This can only be false if the bridge was invalidated before startup completed
  if (_ReactABI28_0_0Instance) {
#if ABI28_0_0RCT_DEV
    executorFactory = std::make_shared<GetDescAdapter>(self, executorFactory);
#endif

    // This is async, but any calls into JS are blocked by the m_syncReady CV in Instance
    _ReactABI28_0_0Instance->initializeBridge(
      std::make_unique<ABI28_0_0RCTInstanceCallback>(self),
      executorFactory,
      _jsMessageThread,
      [self _buildModuleRegistry]);

#if ABI28_0_0RCT_PROFILE
    if (ABI28_0_0RCTProfileIsProfiling()) {
      _ReactABI28_0_0Instance->setGlobalVariable(
        "__ABI28_0_0RCTProfileIsProfiling",
        std::make_unique<JSBigStdString>("true"));
    }
#endif

    [self installExtraJSBinding];
  }

  ABI28_0_0RCT_PROFILE_END_EVENT(ABI28_0_0RCTProfileTagAlways, @"");
}

- (NSArray<ABI28_0_0RCTModuleData *> *)registerModulesForClasses:(NSArray<Class> *)moduleClasses
{
  ABI28_0_0RCT_PROFILE_BEGIN_EVENT(ABI28_0_0RCTProfileTagAlways,
                          @"-[ABI28_0_0RCTCxxBridge initModulesWithDispatchGroup:] autoexported moduleData", nil);

  NSMutableArray<ABI28_0_0RCTModuleData *> *moduleDataByID = [NSMutableArray arrayWithCapacity:moduleClasses.count];
  for (Class moduleClass in moduleClasses) {
    NSString *moduleName = ABI28_0_0RCTBridgeModuleNameForClass(moduleClass);

    // Check for module name collisions
    ABI28_0_0RCTModuleData *moduleData = _moduleDataByName[moduleName];
    if (moduleData) {
      if (moduleData.hasInstance) {
        // Existing module was preregistered, so it takes precedence
        continue;
      } else if ([moduleClass new] == nil) {
        // The new module returned nil from init, so use the old module
        continue;
      } else if ([moduleData.moduleClass new] != nil) {
        // Both modules were non-nil, so it's unclear which should take precedence
        ABI28_0_0RCTLogError(@"Attempted to register ABI28_0_0RCTBridgeModule class %@ for the "
                    "name '%@', but name was already registered by class %@",
                    moduleClass, moduleName, moduleData.moduleClass);
      }
    }

    // Instantiate moduleData
    // TODO #13258411: can we defer this until config generation?
    moduleData = [[ABI28_0_0RCTModuleData alloc] initWithModuleClass:moduleClass bridge:self];

    _moduleDataByName[moduleName] = moduleData;
    [_moduleClassesByID addObject:moduleClass];
    [moduleDataByID addObject:moduleData];
  }
  [_moduleDataByID addObjectsFromArray:moduleDataByID];

  ABI28_0_0RCT_PROFILE_END_EVENT(ABI28_0_0RCTProfileTagAlways, @"");

  return moduleDataByID;
}

- (void)registerExtraModules
{
  ABI28_0_0RCT_PROFILE_BEGIN_EVENT(ABI28_0_0RCTProfileTagAlways,
                          @"-[ABI28_0_0RCTCxxBridge initModulesWithDispatchGroup:] extraModules", nil);

  NSArray<id<ABI28_0_0RCTBridgeModule>> *extraModules = nil;
  if ([self.delegate respondsToSelector:@selector(extraModulesForBridge:)]) {
    extraModules = [self.delegate extraModulesForBridge:_parentBridge];
  } else if (self.moduleProvider) {
    extraModules = self.moduleProvider();
  }

  ABI28_0_0RCT_PROFILE_END_EVENT(ABI28_0_0RCTProfileTagAlways, @"");

#if ABI28_0_0RCT_DEBUG
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    ABI28_0_0RCTVerifyAllModulesExported(extraModules);
  });
#endif

  ABI28_0_0RCT_PROFILE_BEGIN_EVENT(ABI28_0_0RCTProfileTagAlways,
                          @"-[ABI28_0_0RCTCxxBridge initModulesWithDispatchGroup:] preinitialized moduleData", nil);
  // Set up moduleData for pre-initialized module instances
  for (id<ABI28_0_0RCTBridgeModule> module in extraModules) {
    Class moduleClass = [module class];
    NSString *moduleName = ABI28_0_0RCTBridgeModuleNameForClass(moduleClass);

    if (ABI28_0_0RCT_DEBUG) {
      // Check for name collisions between preregistered modules
      ABI28_0_0RCTModuleData *moduleData = _moduleDataByName[moduleName];
      if (moduleData) {
        ABI28_0_0RCTLogError(@"Attempted to register ABI28_0_0RCTBridgeModule class %@ for the "
                    "name '%@', but name was already registered by class %@",
                    moduleClass, moduleName, moduleData.moduleClass);
        continue;
      }
    }

    // Instantiate moduleData container
    ABI28_0_0RCTModuleData *moduleData = [[ABI28_0_0RCTModuleData alloc] initWithModuleInstance:module bridge:self];
    _moduleDataByName[moduleName] = moduleData;
    [_moduleClassesByID addObject:moduleClass];
    [_moduleDataByID addObject:moduleData];
  }
  ABI28_0_0RCT_PROFILE_END_EVENT(ABI28_0_0RCTProfileTagAlways, @"");
}

- (void)installExtraJSBinding
{
  if ([self.delegate conformsToProtocol:@protocol(ABI28_0_0RCTCxxBridgeDelegate)]) {
    id<ABI28_0_0RCTCxxBridgeDelegate> cxxDelegate = (id<ABI28_0_0RCTCxxBridgeDelegate>) self.delegate;
    if ([cxxDelegate respondsToSelector:@selector(installExtraJSBinding:)]) {
      [cxxDelegate installExtraJSBinding:self.jsContextRef];
    }
  }
}

- (void)_initModules:(NSArray<id<ABI28_0_0RCTBridgeModule>> *)modules
   withDispatchGroup:(dispatch_group_t)dispatchGroup
    lazilyDiscovered:(BOOL)lazilyDiscovered
{
  ABI28_0_0RCTAssert(!(ABI28_0_0RCTIsMainQueue() && lazilyDiscovered), @"Lazy discovery can only happen off the Main Queue");

  // Set up moduleData for automatically-exported modules
  NSArray<ABI28_0_0RCTModuleData *> *moduleDataById = [self registerModulesForClasses:modules];

#ifdef ABI28_0_0RCT_DEBUG
  if (lazilyDiscovered) {
    // Lazily discovered modules do not require instantiation here,
    // as they are not allowed to have pre-instantiated instance
    // and must not require the main queue.
    for (ABI28_0_0RCTModuleData *moduleData in moduleDataById) {
      ABI28_0_0RCTAssert(!(moduleData.requiresMainQueueSetup || moduleData.hasInstance),
        @"Module \'%@\' requires initialization on the Main Queue or has pre-instantiated, which is not supported for the lazily discovered modules.", moduleData.name);
    }
  }
  else
#endif
  {
    ABI28_0_0RCT_PROFILE_BEGIN_EVENT(ABI28_0_0RCTProfileTagAlways,
                            @"-[ABI28_0_0RCTCxxBridge initModulesWithDispatchGroup:] moduleData.hasInstance", nil);
    // Dispatch module init onto main thread for those modules that require it
    // For non-lazily discovered modules we run through the entire set of modules
    // that we have, otherwise some modules coming from the delegate
    // or module provider block, will not be properly instantiated.
    for (ABI28_0_0RCTModuleData *moduleData in _moduleDataByID) {
      if (moduleData.hasInstance && (!moduleData.requiresMainQueueSetup || ABI28_0_0RCTIsMainQueue())) {
        // Modules that were pre-initialized should ideally be set up before
        // bridge init has finished, otherwise the caller may try to access the
        // module directly rather than via `[bridge moduleForClass:]`, which won't
        // trigger the lazy initialization process. If the module cannot safely be
        // set up on the current thread, it will instead be async dispatched
        // to the main thread to be set up in _prepareModulesWithDispatchGroup:.
        (void)[moduleData instance];
      }
    }
    ABI28_0_0RCT_PROFILE_END_EVENT(ABI28_0_0RCTProfileTagAlways, @"");

    // From this point on, ABI28_0_0RCTDidInitializeModuleNotification notifications will
    // be sent the first time a module is accessed.
    _moduleSetupComplete = YES;
    [self _prepareModulesWithDispatchGroup:dispatchGroup];
  }

#if ABI28_0_0RCT_PROFILE
  if (ABI28_0_0RCTProfileIsProfiling()) {
    // Depends on moduleDataByID being loaded
    ABI28_0_0RCTProfileHookModules(self);
  }
#endif
}

- (void)registerAdditionalModuleClasses:(NSArray<Class> *)modules
{
  [self _initModules:modules withDispatchGroup:NULL lazilyDiscovered:YES];
}

- (void)_prepareModulesWithDispatchGroup:(dispatch_group_t)dispatchGroup
{
  ABI28_0_0RCT_PROFILE_BEGIN_EVENT(0, @"-[ABI28_0_0RCTCxxBridge _prepareModulesWithDispatchGroup]", nil);

  BOOL initializeImmediately = NO;
  if (dispatchGroup == NULL) {
    // If no dispatchGroup is passed in, we must prepare everything immediately.
    // We better be on the right thread too.
    ABI28_0_0RCTAssertMainQueue();
    initializeImmediately = YES;
  }

  // Set up modules that require main thread init or constants export
  [_performanceLogger setValue:0 forTag:ABI28_0_0RCTPLNativeModuleMainThread];

  for (ABI28_0_0RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.requiresMainQueueSetup) {
      // Modules that need to be set up on the main thread cannot be initialized
      // lazily when required without doing a dispatch_sync to the main thread,
      // which can result in deadlock. To avoid this, we initialize all of these
      // modules on the main thread in parallel with loading the JS code, so
      // they will already be available before they are ever required.
      dispatch_block_t block = ^{
        if (self.valid && ![moduleData.moduleClass isSubclassOfClass:[ABI28_0_0RCTCxxModule class]]) {
          [self->_performanceLogger appendStartForTag:ABI28_0_0RCTPLNativeModuleMainThread];
          (void)[moduleData instance];
          [moduleData gatherConstants];
          [self->_performanceLogger appendStopForTag:ABI28_0_0RCTPLNativeModuleMainThread];
        }
      };

      if (initializeImmediately && ABI28_0_0RCTIsMainQueue()) {
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
  [_performanceLogger setValue:_modulesInitializedOnMainQueue forTag:ABI28_0_0RCTPLNativeModuleMainThreadUsesCount];
  ABI28_0_0RCT_PROFILE_END_EVENT(ABI28_0_0RCTProfileTagAlways, @"");
}

- (void)registerModuleForFrameUpdates:(id<ABI28_0_0RCTBridgeModule>)module
                       withModuleData:(ABI28_0_0RCTModuleData *)moduleData
{
  [_displayLink registerModuleForFrameUpdates:module withModuleData:moduleData];
}

- (void)executeSourceCode:(NSData *)sourceCode sync:(BOOL)sync
{
  // This will get called from whatever thread was actually executing JS.
  dispatch_block_t completion = ^{
    // Log start up metrics early before processing any other js calls
    [self logStartupFinish];
    // Flush pending calls immediately so we preserve ordering
    [self _flushPendingCalls];

    // Perform the state update and notification on the main thread, so we can't run into
    // timing issues with ABI28_0_0RCTRootView
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter]
       postNotificationName:ABI28_0_0RCTJavaScriptDidLoadNotification
       object:self->_parentBridge userInfo:@{@"bridge": self}];

      // Starting the display link is not critical to startup, so do it last
      [self ensureOnJavaScriptThread:^{
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

#if ABI28_0_0RCT_DEV
  if (self.devSettings.isHotLoadingAvailable && self.devSettings.isHotLoadingEnabled) {
    NSString *path = [self.bundleURL.path substringFromIndex:1]; // strip initial slash
    NSString *host = self.bundleURL.host;
    NSNumber *port = self.bundleURL.port;
    [self enqueueJSCall:@"HMRClient"
                 method:@"enable"
                   args:@[@"ios", path, host, ABI28_0_0RCTNullIfNil(port)]
             completion:NULL];  }
#endif
}

- (void)handleError:(NSError *)error
{
  // This is generally called when the infrastructure throws an
  // exception while calling JS.  Most product exceptions will not go
  // through this method, but through ABI28_0_0RCTExceptionManager.

  // There are three possible states:
  // 1. initializing == _valid && _loading
  // 2. initializing/loading finished (success or failure) == _valid && !_loading
  // 3. invalidated == !_valid && !_loading

  // !_valid && _loading can't happen.

  // In state 1: on main queue, move to state 2, reset the bridge, and ABI28_0_0RCTFatal.
  // In state 2: go directly to ABI28_0_0RCTFatal.  Do not enqueue, do not collect $200.
  // In state 3: do nothing.

  if (self->_valid && !self->_loading) {
    if ([error userInfo][ABI28_0_0RCTJSRawStackTraceKey]) {
      [self.redBox showErrorMessage:[error localizedDescription]
                       withRawStack:[error userInfo][ABI28_0_0RCTJSRawStackTraceKey]];
    }

    ABI28_0_0RCTFatal(error);

    // RN will stop, but let the rest of the app keep going.
    return;
  }

  if (!_valid || !_loading) {
    return;
  }

  // Hack: once the bridge is invalidated below, it won't initialize any new native
  // modules. Initialize the redbox module now so we can still report this error.
  ABI28_0_0RCTRedBox *redBox = [self redBox];

  _loading = NO;
  _valid = NO;

  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_jsMessageThread) {
      // Make sure initializeBridge completed
      self->_jsMessageThread->runOnQueueSync([] {});
    }

    self->_ReactABI28_0_0Instance.reset();
    self->_jsMessageThread.reset();

    [[NSNotificationCenter defaultCenter]
     postNotificationName:ABI28_0_0RCTJavaScriptDidFailToLoadNotification
     object:self->_parentBridge userInfo:@{@"bridge": self, @"error": error}];

    if ([error userInfo][ABI28_0_0RCTJSRawStackTraceKey]) {
      [redBox showErrorMessage:[error localizedDescription]
                  withRawStack:[error userInfo][ABI28_0_0RCTJSRawStackTraceKey]];
    }

    ABI28_0_0RCTFatal(error);
  });
}

ABI28_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithDelegate:(__unused id<ABI28_0_0RCTBridgeDelegate>)delegate
                                           bundleURL:(__unused NSURL *)bundleURL
                                      moduleProvider:(__unused ABI28_0_0RCTBridgeModuleListProvider)block
                                       launchOptions:(__unused NSDictionary *)launchOptions)

ABI28_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithBundleURL:(__unused NSURL *)bundleURL
                                       moduleProvider:(__unused ABI28_0_0RCTBridgeModuleListProvider)block
                                        launchOptions:(__unused NSDictionary *)launchOptions)

/**
 * Prevent super from calling setUp (that'd create another batchedBridge)
 */
- (void)setUp {}

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
  ABI28_0_0RCTAssertMainQueue();

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

- (id<ABI28_0_0RCTBridgeDelegate>)delegate
{
  return _parentBridge.delegate;
}

- (void)dispatchBlock:(dispatch_block_t)block
                queue:(dispatch_queue_t)queue
{
  if (queue == ABI28_0_0RCTJSThread) {
    [self ensureOnJavaScriptThread:block];
  } else if (queue) {
    dispatch_async(queue, block);
  }
}

#pragma mark - ABI28_0_0RCTInvalidating

- (void)invalidate
{
  if (_didInvalidate) {
    return;
  }

  ABI28_0_0RCTAssertMainQueue();
  ABI28_0_0RCTLogInfo(@"Invalidating %@ (parent: %@, executor: %@)", self, _parentBridge, [self executorClass]);

  _loading = NO;
  _valid = NO;
  _didInvalidate = YES;

  if ([ABI28_0_0RCTBridge currentBridge] == self) {
    [ABI28_0_0RCTBridge setCurrentBridge:nil];
  }

  // Stop JS instance and message thread
  [self ensureOnJavaScriptThread:^{
    [self->_displayLink invalidate];
    self->_displayLink = nil;

    if (ABI28_0_0RCTProfileIsProfiling()) {
      ABI28_0_0RCTProfileUnhookModules(self);
    }

    // Invalidate modules
    // We're on the JS thread (which we'll be suspending soon), so no new calls will be made to native modules after
    // this completes. We must ensure all previous calls were dispatched before deallocating the instance (and module
    // wrappers) or we may have invalid pointers still in flight.
    dispatch_group_t moduleInvalidation = dispatch_group_create();
    for (ABI28_0_0RCTModuleData *moduleData in self->_moduleDataByID) {
      // Be careful when grabbing an instance here, we don't want to instantiate
      // any modules just to invalidate them.
      if (![moduleData hasInstance]) {
        continue;
      }

      if ([moduleData.instance respondsToSelector:@selector(invalidate)]) {
        dispatch_group_enter(moduleInvalidation);
        [self dispatchBlock:^{
          [(id<ABI28_0_0RCTInvalidating>)moduleData.instance invalidate];
          dispatch_group_leave(moduleInvalidation);
        } queue:moduleData.methodQueue];
      }
      [moduleData invalidate];
    }

    if (dispatch_group_wait(moduleInvalidation, dispatch_time(DISPATCH_TIME_NOW, 10 * NSEC_PER_SEC))) {
      ABI28_0_0RCTLogError(@"Timed out waiting for modules to be invalidated");
    }

    self->_ReactABI28_0_0Instance.reset();
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
  if (ABI28_0_0RCT_DEBUG && _valid) {
    [self enqueueJSCall:@"ABI28_0_0RCTLog"
                 method:@"logIfNoNativeHook"
                   args:@[level, message]
             completion:NULL];
  }
}

#pragma mark - ABI28_0_0RCTBridge methods

- (void)_runAfterLoad:(ABI28_0_0RCTPendingCall)block
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
  uint64_t nativeRequiresCount = [_performanceLogger valueForTag:ABI28_0_0RCTPLRAMNativeRequiresCount];
  [_performanceLogger setValue:nativeRequiresCount forTag:ABI28_0_0RCTPLRAMStartupNativeRequiresCount];
  uint64_t nativeRequires = [_performanceLogger valueForTag:ABI28_0_0RCTPLRAMNativeRequires];
  [_performanceLogger setValue:nativeRequires forTag:ABI28_0_0RCTPLRAMStartupNativeRequires];

  [_performanceLogger markStopForTag:ABI28_0_0RCTPLBridgeStartup];
}

- (void)_flushPendingCalls
{
  ABI28_0_0RCT_PROFILE_BEGIN_EVENT(0, @"Processing pendingCalls", @{ @"count": [@(_pendingCalls.count) stringValue] });
  // Phase B: _flushPendingCalls happens.  Each block in _pendingCalls is
  // executed, adding work to the queue, and _pendingCount is decremented.
  // loading is set to NO.
  NSArray<ABI28_0_0RCTPendingCall> *pendingCalls = _pendingCalls;
  _pendingCalls = nil;
  for (ABI28_0_0RCTPendingCall call in pendingCalls) {
    call();
    _pendingCount--;
  }
  _loading = NO;
  ABI28_0_0RCT_PROFILE_END_EVENT(ABI28_0_0RCTProfileTagAlways, @"");
}

/**
 * Public. Can be invoked from any thread.
 */
- (void)enqueueJSCall:(NSString *)module method:(NSString *)method args:(NSArray *)args completion:(dispatch_block_t)completion
{
  if (!self.valid) {
    return;
  }
  module = ABI28_0_0EX_REMOVE_VERSION(module);

  /**
   * AnyThread
   */
  ABI28_0_0RCT_PROFILE_BEGIN_EVENT(ABI28_0_0RCTProfileTagAlways, @"-[ABI28_0_0RCTCxxBridge enqueueJSCall:]", nil);

  ABI28_0_0RCTProfileBeginFlowEvent();
  __weak __typeof(self) weakSelf = self;
  [self _runAfterLoad:^(){
    ABI28_0_0RCTProfileEndFlowEvent();
    __strong __typeof(weakSelf) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }

    if (strongSelf->_ReactABI28_0_0Instance) {
      strongSelf->_ReactABI28_0_0Instance->callJSFunction([module UTF8String], [method UTF8String],
                                             convertIdToFollyDynamic(args ?: @[]));

      // ensureOnJavaScriptThread may execute immediately, so use jsMessageThread, to make sure
      // the block is invoked after callJSFunction
      if (completion) {
        if (strongSelf->_jsMessageThread) {
          strongSelf->_jsMessageThread->runOnQueue(completion);
        } else {
          ABI28_0_0RCTLogWarn(@"Can't invoke completion without messageThread");
        }
      }
    }
  }];

  ABI28_0_0RCT_PROFILE_END_EVENT(ABI28_0_0RCTProfileTagAlways, @"");
}

/**
 * Called by ABI28_0_0RCTModuleMethod from any thread.
 */
- (void)enqueueCallback:(NSNumber *)cbID args:(NSArray *)args
{
  if (!self.valid) {
    return;
  }

  /**
   * AnyThread
   */

  ABI28_0_0RCTProfileBeginFlowEvent();
  __weak __typeof(self) weakSelf = self;
  [self _runAfterLoad:^(){
    ABI28_0_0RCTProfileEndFlowEvent();
    __strong __typeof(weakSelf) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }

    if (strongSelf->_ReactABI28_0_0Instance) {
      strongSelf->_ReactABI28_0_0Instance->callJSCallback([cbID unsignedLongLongValue], convertIdToFollyDynamic(args ?: @[]));
    }
  }];
}

/**
 * Private hack to support `setTimeout(fn, 0)`
 */
- (void)_immediatelyCallTimer:(NSNumber *)timer
{
  ABI28_0_0RCTAssertJSThread();

  if (_ReactABI28_0_0Instance) {
    _ReactABI28_0_0Instance->callJSFunction("JSTimers", "callTimers",
                                   folly::dynamic::array(folly::dynamic::array([timer doubleValue])));
  }
}

- (void)enqueueApplicationScript:(NSData *)script
                             url:(NSURL *)url
                      onComplete:(dispatch_block_t)onComplete
{
  ABI28_0_0RCT_PROFILE_BEGIN_EVENT(ABI28_0_0RCTProfileTagAlways, @"-[ABI28_0_0RCTCxxBridge enqueueApplicationScript]", nil);

  [self executeApplicationScript:script url:url async:YES];

  ABI28_0_0RCT_PROFILE_END_EVENT(ABI28_0_0RCTProfileTagAlways, @"");

  // Assumes that onComplete can be called when the next block on the JS thread is scheduled
  if (onComplete) {
    ABI28_0_0RCTAssert(_jsMessageThread != nullptr, @"Cannot invoke completion without jsMessageThread");
    _jsMessageThread->runOnQueue(onComplete);
  }
}

- (void)executeApplicationScriptSync:(NSData *)script url:(NSURL *)url
{
  [self executeApplicationScript:script url:url async:NO];
}

- (void)executeApplicationScript:(NSData *)script
                             url:(NSURL *)url
                           async:(BOOL)async
{
  [self _tryAndHandleError:^{
    NSString *sourceUrlStr = deriveSourceURL(url);
    [[NSNotificationCenter defaultCenter]
      postNotificationName:ABI28_0_0RCTJavaScriptWillStartExecutingNotification
      object:self->_parentBridge userInfo:@{@"bridge": self}];
    if (isRAMBundle(script)) {
      [self->_performanceLogger markStartForTag:ABI28_0_0RCTPLRAMBundleLoad];
      auto ramBundle = std::make_unique<JSIndexedRAMBundle>(sourceUrlStr.UTF8String);
      std::unique_ptr<const JSBigString> scriptStr = ramBundle->getStartupCode();
      [self->_performanceLogger markStopForTag:ABI28_0_0RCTPLRAMBundleLoad];
      [self->_performanceLogger setValue:scriptStr->size() forTag:ABI28_0_0RCTPLRAMStartupCodeSize];
      if (self->_ReactABI28_0_0Instance) {
        auto registry = RAMBundleRegistry::multipleBundlesRegistry(std::move(ramBundle), JSIndexedRAMBundle::buildFactory());
        self->_ReactABI28_0_0Instance->loadRAMBundle(std::move(registry), std::move(scriptStr),
                                            sourceUrlStr.UTF8String, !async);
      }
    } else if (self->_ReactABI28_0_0Instance) {
      self->_ReactABI28_0_0Instance->loadScriptFromString(std::make_unique<NSDataBigString>(script),
                                                 sourceUrlStr.UTF8String, !async);
    } else {
      std::string methodName = async ? "loadApplicationScript" : "loadApplicationScriptSync";
      throw std::logic_error("Attempt to call " + methodName + ": on uninitialized bridge");
    }
  }];
}

- (void)registerSegmentWithId:(NSUInteger)segmentId path:(NSString *)path
{
  if (_ReactABI28_0_0Instance) {
    _ReactABI28_0_0Instance->registerBundle(static_cast<uint32_t>(segmentId), path.UTF8String);
  }
}

#pragma mark - Payload Processing

- (void)partialBatchDidFlush
{
  for (ABI28_0_0RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.implementsPartialBatchDidFlush) {
      [self dispatchBlock:^{
        [moduleData.instance partialBatchDidFlush];
      } queue:moduleData.methodQueue];
    }
  }
}

- (void)batchDidComplete
{
  // TODO #12592471: batchDidComplete is only used by ABI28_0_0RCTUIManager,
  // can we eliminate this special case?
  for (ABI28_0_0RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.implementsBatchDidComplete) {
      [self dispatchBlock:^{
        [moduleData.instance batchDidComplete];
      } queue:moduleData.methodQueue];
    }
  }
}

- (void)startProfiling
{
  ABI28_0_0RCTAssertMainQueue();

  [self ensureOnJavaScriptThread:^{
    #if WITH_FBSYSTRACE
    [ABI28_0_0RCTFBSystrace registerCallbacks];
    #endif
    ABI28_0_0RCTProfileInit(self);

    [self enqueueJSCall:@"Systrace" method:@"setEnabled" args:@[@YES] completion:NULL];
  }];
}

- (void)stopProfiling:(void (^)(NSData *))callback
{
  ABI28_0_0RCTAssertMainQueue();

  [self ensureOnJavaScriptThread:^{
    [self enqueueJSCall:@"Systrace" method:@"setEnabled" args:@[@NO] completion:NULL];
    ABI28_0_0RCTProfileEnd(self, ^(NSString *log) {
      NSData *logData = [log dataUsingEncoding:NSUTF8StringEncoding];
      callback(logData);
      #if WITH_FBSYSTRACE
      [ABI28_0_0RCTFBSystrace unregisterCallbacks];
      #endif
    });
  }];
}

- (BOOL)isBatchActive
{
  return _wasBatchActive;
}

@end
