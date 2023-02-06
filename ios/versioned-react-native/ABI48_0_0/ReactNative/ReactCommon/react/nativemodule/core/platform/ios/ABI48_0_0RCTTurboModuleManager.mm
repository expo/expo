/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTTurboModuleManager.h"

#import <atomic>
#import <cassert>
#import <condition_variable>
#import <mutex>
#import <shared_mutex>

#import <objc/runtime.h>

#import <ABI48_0_0React/ABI48_0_0RCTBridge+Private.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>
#import <ABI48_0_0React/ABI48_0_0RCTConstants.h>
#import <ABI48_0_0React/ABI48_0_0RCTCxxModule.h>
#import <ABI48_0_0React/ABI48_0_0RCTInitializing.h>
#import <ABI48_0_0React/ABI48_0_0RCTLog.h>
#import <ABI48_0_0React/ABI48_0_0RCTModuleData.h>
#import <ABI48_0_0React/ABI48_0_0RCTPerformanceLogger.h>
#import <ABI48_0_0React/ABI48_0_0RCTUtils.h>
#import <ABI48_0_0ReactCommon/ABI48_0_0RuntimeExecutor.h>
#import <ABI48_0_0ReactCommon/ABI48_0_0TurboCxxModule.h>
#import <ABI48_0_0ReactCommon/ABI48_0_0TurboModuleBinding.h>
#import <ABI48_0_0ReactCommon/ABI48_0_0TurboModulePerfLogger.h>
#import <ABI48_0_0ReactCommon/ABI48_0_0TurboModuleUtils.h>

using namespace ABI48_0_0facebook;
using namespace ABI48_0_0facebook::ABI48_0_0React;

/**
 * A global variable whose address we use to associate method queues to id<ABI48_0_0RCTTurboModule> objects.
 */
static char kAssociatedMethodQueueKey;

namespace {
int32_t getUniqueId()
{
  static std::atomic<int32_t> counter{0};
  return counter++;
}

class TurboModuleHolder {
 private:
  const int32_t moduleId_;
  id<ABI48_0_0RCTTurboModule> module_;
  bool isTryingToCreateModule_;
  bool isDoneCreatingModule_;
  std::mutex mutex_;
  std::condition_variable cv_;

 public:
  TurboModuleHolder()
      : moduleId_(getUniqueId()), module_(nil), isTryingToCreateModule_(false), isDoneCreatingModule_(false)
  {
  }

  int32_t getModuleId() const
  {
    return moduleId_;
  }

  void setModule(id<ABI48_0_0RCTTurboModule> module)
  {
    module_ = module;
  }

  id<ABI48_0_0RCTTurboModule> getModule() const
  {
    return module_;
  }

  void startCreatingModule()
  {
    isTryingToCreateModule_ = true;
  }

  void endCreatingModule()
  {
    isTryingToCreateModule_ = false;
    isDoneCreatingModule_ = true;
  }

  bool isDoneCreatingModule() const
  {
    return isDoneCreatingModule_;
  }

  bool isCreatingModule() const
  {
    return isTryingToCreateModule_;
  }

  std::mutex &mutex()
  {
    return mutex_;
  }

  std::condition_variable &cv()
  {
    return cv_;
  }
};

class MethodQueueNativeCallInvoker : public CallInvoker {
 private:
  dispatch_queue_t methodQueue_;

 public:
  MethodQueueNativeCallInvoker(dispatch_queue_t methodQueue) : methodQueue_(methodQueue) {}
  void invokeAsync(std::function<void()> &&work) override
  {
    if (methodQueue_ == ABI48_0_0RCTJSThread) {
      work();
      return;
    }

    __block auto retainedWork = std::move(work);
    dispatch_async(methodQueue_, ^{
      retainedWork();
    });
  }

  void invokeSync(std::function<void()> &&work) override
  {
    if (methodQueue_ == ABI48_0_0RCTJSThread) {
      work();
      return;
    }

    __block auto retainedWork = std::move(work);
    dispatch_sync(methodQueue_, ^{
      retainedWork();
    });
  }
};
}

// Fallback lookup since ABI48_0_0RCT class prefix is sometimes stripped in the existing NativeModule system.
// This will be removed in the future.
static Class getFallbackClassFromName(const char *name)
{
  Class moduleClass = NSClassFromString([NSString stringWithUTF8String:name]);
  if (!moduleClass) {
    moduleClass = NSClassFromString([NSString stringWithFormat:@"ABI48_0_0RCT%s", name]);
  }
  return moduleClass;
}

@implementation ABI48_0_0RCTTurboModuleManager {
  std::shared_ptr<CallInvoker> _jsInvoker;
  __weak id<ABI48_0_0RCTTurboModuleManagerDelegate> _delegate;
  __weak ABI48_0_0RCTBridge *_bridge;

  /**
   * TODO(T48018690):
   * All modules are currently long-lived.
   * We need to come up with a mechanism to allow modules to specify whether
   * they want to be long-lived or short-lived.
   *
   * All instances of TurboModuleHolder are owned by the _turboModuleHolders map.
   * We only reference TurboModuleHolders via pointers to entries in the _turboModuleHolders map.
   */
  std::unordered_map<std::string, TurboModuleHolder> _turboModuleHolders;
  std::unordered_map<std::string, std::shared_ptr<TurboModule>> _turboModuleCache;

  // Enforce synchronous access into _delegate
  std::mutex _turboModuleManagerDelegateMutex;

  // Enforce synchronous access to _invalidating and _turboModuleHolders
  std::shared_timed_mutex _turboModuleHoldersSharedMutex;
  std::mutex _turboModuleHoldersMutex;
  std::atomic<bool> _invalidating;

  ABI48_0_0RCTRetainJSCallback _retainJSCallback;
  std::shared_ptr<LongLivedObjectCollection> _longLivedObjectCollection;
}

- (instancetype)initWithBridge:(ABI48_0_0RCTBridge *)bridge
                      delegate:(id<ABI48_0_0RCTTurboModuleManagerDelegate>)delegate
                     jsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
{
  if (self = [super init]) {
    _jsInvoker = jsInvoker;
    _delegate = delegate;
    _bridge = bridge;
    _invalidating = false;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeWillInvalidateModules:)
                                                 name:ABI48_0_0RCTBridgeWillInvalidateModulesNotification
                                               object:_bridge.parentBridge];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeDidInvalidateModules:)
                                                 name:ABI48_0_0RCTBridgeDidInvalidateModulesNotification
                                               object:_bridge.parentBridge];

    if (ABI48_0_0RCTGetTurboModuleCleanupMode() == kABI48_0_0RCTGlobalScope) {
      // Use LongLivedObjectCollection singleton regularly
      _retainJSCallback = nil;
    } else if (ABI48_0_0RCTGetTurboModuleCleanupMode() == kABI48_0_0RCTGlobalScopeUsingRetainJSCallback) {
      // Use LongLivedObjectCollection singleton via the _retainJSCallback
      _retainJSCallback = ^(jsi::Function &&callback, jsi::Runtime &runtime, std::shared_ptr<CallInvoker> jsInvoker2) {
        return CallbackWrapper::createWeak(std::move(callback), runtime, jsInvoker2);
      };
    } else if (ABI48_0_0RCTGetTurboModuleCleanupMode() == kABI48_0_0RCTTurboModuleManagerScope) {
      // Use a LongLivedObjectCollection scoped to the TurboModuleManager
      _longLivedObjectCollection = std::make_shared<LongLivedObjectCollection>();
      __block std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection = _longLivedObjectCollection;
      _retainJSCallback = ^(jsi::Function &&callback, jsi::Runtime &runtime, std::shared_ptr<CallInvoker> jsInvoker2) {
        return CallbackWrapper::createWeak(longLivedObjectCollection, std::move(callback), runtime, jsInvoker2);
      };
    }
  }
  return self;
}

- (void)notifyAboutTurboModuleSetup:(const char *)name
{
  NSString *moduleName = [[NSString alloc] initWithUTF8String:name];
  if (moduleName) {
    int64_t setupTime = [self->_bridge.performanceLogger durationForTag:ABI48_0_0RCTPLTurboModuleSetup];
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI48_0_0RCTDidSetupModuleNotification
                                                        object:nil
                                                      userInfo:@{
                                                        ABI48_0_0RCTDidSetupModuleNotificationModuleNameKey : moduleName,
                                                        ABI48_0_0RCTDidSetupModuleNotificationSetupTimeKey : @(setupTime)
                                                      }];
  }
}

/**
 * Given a name for a TurboModule, return a C++ object which is the instance
 * of that TurboModule C++ class. This class wraps the TurboModule's ObjC instance.
 * If no TurboModule ObjC class exist with the provided name, abort program.
 *
 * Note: All TurboModule instances are cached, which means they're all long-lived
 * (for now).
 */

- (std::shared_ptr<TurboModule>)provideTurboModule:(const char *)moduleName
{
  auto turboModuleLookup = _turboModuleCache.find(moduleName);
  if (turboModuleLookup != _turboModuleCache.end()) {
    TurboModulePerfLogger::moduleJSRequireBeginningCacheHit(moduleName);
    TurboModulePerfLogger::moduleJSRequireBeginningEnd(moduleName);
    return turboModuleLookup->second;
  }

  TurboModulePerfLogger::moduleJSRequireBeginningEnd(moduleName);

  /**
   * Step 1: Look for pure C++ modules.
   * Pure C++ modules get priority.
   */
  if ([_delegate respondsToSelector:@selector(getTurboModule:jsInvoker:)]) {
    int32_t moduleId = getUniqueId();
    TurboModulePerfLogger::moduleCreateStart(moduleName, moduleId);
    auto turboModule = [_delegate getTurboModule:moduleName jsInvoker:_jsInvoker];
    if (turboModule != nullptr) {
      _turboModuleCache.insert({moduleName, turboModule});
      TurboModulePerfLogger::moduleCreateEnd(moduleName, moduleId);
      return turboModule;
    }

    TurboModulePerfLogger::moduleCreateFail(moduleName, moduleId);
  }

  /**
   * Step 2: Look for platform-specific modules.
   */
  id<ABI48_0_0RCTTurboModule> module = [self provideABI48_0_0RCTTurboModule:moduleName];

  TurboModulePerfLogger::moduleJSRequireEndingStart(moduleName);

  // If we request that a TurboModule be created, its respective ObjC class must exist
  // If the class doesn't exist, then provideABI48_0_0RCTTurboModule returns nil
  if (!module) {
    return nullptr;
  }

  Class moduleClass = [module class];

  dispatch_queue_t methodQueue = (dispatch_queue_t)objc_getAssociatedObject(module, &kAssociatedMethodQueueKey);
  if (methodQueue == nil) {
    ABI48_0_0RCTLogError(@"TurboModule \"%@\" was not associated with a method queue.", moduleClass);
  }

  /**
   * Step 2c: Create and native CallInvoker from the TurboModule's method queue.
   */
  std::shared_ptr<CallInvoker> nativeInvoker = std::make_shared<MethodQueueNativeCallInvoker>(methodQueue);

  /**
   * Have ABI48_0_0RCTCxxBridge decorate native CallInvoker, so that it's aware of TurboModule async method calls.
   * This helps the bridge fire onBatchComplete as readily as it should.
   */
  if ([_bridge respondsToSelector:@selector(decorateNativeCallInvoker:)]) {
    nativeInvoker = [_bridge decorateNativeCallInvoker:nativeInvoker];
  }

  /**
   * Step 2d: If the moduleClass is a legacy CxxModule, return a TurboCxxModule instance that
   * wraps CxxModule.
   */
  if ([moduleClass isSubclassOfClass:ABI48_0_0RCTCxxModule.class]) {
    // Use TurboCxxModule compat class to wrap the CxxModule instance.
    // This is only for migration convenience, despite less performant.
    auto turboModule = std::make_shared<TurboCxxModule>([((ABI48_0_0RCTCxxModule *)module) createModule], _jsInvoker);
    _turboModuleCache.insert({moduleName, turboModule});
    return turboModule;
  }

  ObjCTurboModule::InitParams params = {
      .moduleName = moduleName,
      .instance = module,
      .jsInvoker = _jsInvoker,
      .nativeInvoker = nativeInvoker,
      .isSyncModule = methodQueue == ABI48_0_0RCTJSThread,
      .retainJSCallback = _retainJSCallback,
  };

  /**
   * Step 2e: Return an exact sub-class of ObjC TurboModule
   */
  auto turboModule = [module getTurboModule:params];
  if (turboModule == nullptr) {
    ABI48_0_0RCTLogError(@"TurboModule \"%@\"'s getTurboModule: method returned nil.", moduleClass);
  }
  _turboModuleCache.insert({moduleName, turboModule});
  return turboModule;
}

- (TurboModuleHolder *)_getOrCreateTurboModuleHolder:(const char *)moduleName
{
  if (ABI48_0_0RCTTurboModuleSharedMutexInitEnabled()) {
    {
      std::shared_lock<std::shared_timed_mutex> guard(_turboModuleHoldersSharedMutex);
      if (_invalidating) {
        return nullptr;
      }

      auto it = _turboModuleHolders.find(moduleName);
      if (it != _turboModuleHolders.end()) {
        return &it->second;
      }
    }

    std::unique_lock<std::shared_timed_mutex> guard(_turboModuleHoldersSharedMutex);
    return &_turboModuleHolders[moduleName];
  }

  std::lock_guard<std::mutex> guard(_turboModuleHoldersMutex);
  if (_invalidating) {
    return nullptr;
  }

  return &_turboModuleHolders[moduleName];
}

/**
 * Given a name for a TurboModule, return an ObjC object which is the instance
 * of that TurboModule ObjC class. If no TurboModule exist with the provided name,
 * return nil.
 *
 * Note: All TurboModule instances are cached, which means they're all long-lived
 * (for now).
 */
- (id<ABI48_0_0RCTTurboModule>)provideABI48_0_0RCTTurboModule:(const char *)moduleName
{
  if (strncmp("ABI48_0_0RCT", moduleName, 3) == 0) {
    moduleName = [[[NSString stringWithUTF8String:moduleName] substringFromIndex:3] UTF8String];
  }

  TurboModuleHolder *moduleHolder = [self _getOrCreateTurboModuleHolder:moduleName];

  if (!moduleHolder) {
    return nil;
  }

  TurboModulePerfLogger::moduleCreateStart(moduleName, moduleHolder->getModuleId());
  id<ABI48_0_0RCTTurboModule> module = [self _provideABI48_0_0RCTTurboModule:moduleName moduleHolder:moduleHolder shouldPerfLog:YES];

  if (module) {
    TurboModulePerfLogger::moduleCreateEnd(moduleName, moduleHolder->getModuleId());
  } else {
    TurboModulePerfLogger::moduleCreateFail(moduleName, moduleHolder->getModuleId());
  }

  return module;
}

- (id<ABI48_0_0RCTTurboModule>)_provideABI48_0_0RCTTurboModule:(const char *)moduleName
                                moduleHolder:(TurboModuleHolder *)moduleHolder
                               shouldPerfLog:(BOOL)shouldPerfLog
{
  bool shouldCreateModule = false;

  {
    std::lock_guard<std::mutex> guard(moduleHolder->mutex());

    if (moduleHolder->isDoneCreatingModule()) {
      if (shouldPerfLog) {
        TurboModulePerfLogger::moduleCreateCacheHit(moduleName, moduleHolder->getModuleId());
      }
      return moduleHolder->getModule();
    }

    if (!moduleHolder->isCreatingModule()) {
      shouldCreateModule = true;
      moduleHolder->startCreatingModule();
    }
  }

  if (shouldCreateModule) {
    Class moduleClass;

    /**
     * Step 2a: Resolve platform-specific class.
     */

    if ([_delegate respondsToSelector:@selector(getModuleClassFromName:)]) {
      if (ABI48_0_0RCTTurboModuleManagerDelegateLockingDisabled()) {
        moduleClass = [_delegate getModuleClassFromName:moduleName];
      } else {
        std::lock_guard<std::mutex> delegateGuard(_turboModuleManagerDelegateMutex);
        moduleClass = [_delegate getModuleClassFromName:moduleName];
      }
    }

    if (!moduleClass) {
      moduleClass = getFallbackClassFromName(moduleName);
    }

    __block id<ABI48_0_0RCTTurboModule> module = nil;

    if ([moduleClass conformsToProtocol:@protocol(ABI48_0_0RCTTurboModule)]) {
      __weak __typeof(self) weakSelf = self;
      dispatch_block_t work = ^{
        auto strongSelf = weakSelf;
        if (!strongSelf) {
          return;
        }
        module = [strongSelf _createAndSetUpABI48_0_0RCTTurboModule:moduleClass
                                                moduleName:moduleName
                                                  moduleId:moduleHolder->getModuleId()];
      };

      if ([self _requiresMainQueueSetup:moduleClass]) {
        /**
         * When TurboModule eager initialization is enabled, there shouldn't be any TurboModule initializations on the
         * main queue.
         * TODO(T69449176) Roll out TurboModule eager initialization, and remove this check.
         */
        if (ABI48_0_0RCTTurboModuleEagerInitEnabled() && !ABI48_0_0RCTIsMainQueue()) {
          ABI48_0_0RCTLogWarn(
              @"TurboModule \"%@\" requires synchronous dispatch onto the main queue to be initialized. This may lead to deadlock.",
              moduleClass);
        }

        ABI48_0_0RCTUnsafeExecuteOnMainQueueSync(work);
      } else {
        work();
      }
    }

    {
      std::lock_guard<std::mutex> guard(moduleHolder->mutex());

      moduleHolder->setModule(module);
      moduleHolder->endCreatingModule();
    }

    moduleHolder->cv().notify_all();

    return module;
  }

  std::unique_lock<std::mutex> guard(moduleHolder->mutex());

  while (moduleHolder->isCreatingModule()) {
    /**
     * TODO(T65905574):
     * If the thread responsible for creating and initializing the NativeModule stalls, we'll wait here indefinitely.
     * This is the behaviour in legacy NativeModuels. Changing this now could lead to more crashes/problems in
     * TurboModules than in NativeModules, which'll make it more difficult to test the TurboModules infra. Therefore,
     * we should consider making it post TurboModule 100% rollout.
     */
    moduleHolder->cv().wait(guard);
  }

  return moduleHolder->getModule();
}

/**
 * Given a TurboModule class, and its name, create and initialize it synchronously.
 *
 * This method can be called synchronously from two different contexts:
 *  - The thread that calls provideABI48_0_0RCTTurboModule:
 *  - The main thread (if the TurboModule requires main queue init), blocking the thread that calls
 * provideABI48_0_0RCTTurboModule:.
 */
- (id<ABI48_0_0RCTTurboModule>)_createAndSetUpABI48_0_0RCTTurboModule:(Class)moduleClass
                                         moduleName:(const char *)moduleName
                                           moduleId:(int32_t)moduleId
{
  id<ABI48_0_0RCTTurboModule> module = nil;

  /**
   * Step 2b: Ask hosting application/delegate to instantiate this class
   */

  TurboModulePerfLogger::moduleCreateConstructStart(moduleName, moduleId);
  if ([_delegate respondsToSelector:@selector(getModuleInstanceFromClass:)]) {
    if (ABI48_0_0RCTTurboModuleManagerDelegateLockingDisabled()) {
      module = [_delegate getModuleInstanceFromClass:moduleClass];
    } else {
      std::lock_guard<std::mutex> delegateGuard(_turboModuleManagerDelegateMutex);
      module = [_delegate getModuleInstanceFromClass:moduleClass];
    }

    /**
     * If the application is unable to create the TurboModule object from its class:
     * abort TurboModule creation, and early return nil.
     */
    if (!module) {
      ABI48_0_0RCTLogError(
          @"TurboModuleManager delegate %@ returned nil TurboModule object for module with name=\"%s\" and class=%@",
          NSStringFromClass([_delegate class]),
          moduleName,
          NSStringFromClass(moduleClass));
      return nil;
    }
  } else {
    module = [moduleClass new];
  }
  TurboModulePerfLogger::moduleCreateConstructEnd(moduleName, moduleId);

  TurboModulePerfLogger::moduleCreateSetUpStart(moduleName, moduleId);

  /**
   * It is reasonable for NativeModules to not want/need the bridge.
   * In such cases, they won't have `@synthesize bridge = _bridge` in their
   * implementation, and a `- (ABI48_0_0RCTBridge *) bridge { ... }` method won't be
   * generated by the ObjC runtime. The property will also not be backed
   * by an ivar, which makes writing to it unsafe. Therefore, we check if
   * this method exists to know if we can safely set the bridge to the
   * NativeModule.
   */
  if ([module respondsToSelector:@selector(bridge)] && _bridge) {
    /**
     * Just because a NativeModule has the `bridge` method, it doesn't mean
     * that it has synthesized the bridge in its implementation. Therefore,
     * we need to surround the code that sets the bridge to the NativeModule
     * inside a try/catch. This catches the cases where the NativeModule
     * author specifies a `bridge` method manually.
     */
    @try {
      /**
       * ABI48_0_0RCTBridgeModule declares the bridge property as readonly.
       * Therefore, when authors of NativeModules synthesize the bridge
       * via @synthesize bridge = bridge;, the ObjC runtime generates
       * only a - (ABI48_0_0RCTBridge *) bridge: { ... } method. No setter is
       * generated, so we have have to rely on the KVC API of ObjC to set
       * the bridge property of these NativeModules.
       */
      [(id)module setValue:_bridge forKey:@"bridge"];
    } @catch (NSException *exception) {
      ABI48_0_0RCTLogError(
          @"%@ has no setter or ivar for its bridge, which is not "
           "permitted. You must either @synthesize the bridge property, "
           "or provide your own setter method.",
          ABI48_0_0RCTBridgeModuleNameForClass([module class]));
    }
  }

  /**
   * Some modules need their own queues, but don't provide any, so we need to create it for them.
   * These modules typically have the following:
   *   `@synthesize methodQueue = _methodQueue`
   */

  dispatch_queue_t methodQueue = nil;
  BOOL moduleHasMethodQueueGetter = [module respondsToSelector:@selector(methodQueue)];

  if (moduleHasMethodQueueGetter) {
    methodQueue = [(id<ABI48_0_0RCTBridgeModule>)module methodQueue];
  }

  /**
   * Note: ABI48_0_0RCTJSThread, which is a valid method queue, is defined as (id)kCFNull. It should rightfully not enter the
   * following if condition's block.
   */
  if (!methodQueue) {
    NSString *methodQueueName = [NSString stringWithFormat:@"com.facebook.ABI48_0_0React.%sQueue", moduleName];
    methodQueue = dispatch_queue_create(methodQueueName.UTF8String, DISPATCH_QUEUE_SERIAL);

    if (moduleHasMethodQueueGetter) {
      /**
       * If the module has a method queue getter, two cases are possible:
       *  - We @synthesized the method queue. In this case, the getter will initially return nil.
       *  - We had a custom methodQueue function on the NativeModule. If we got this far, then that getter returned
       *    nil.
       *
       * Therefore, we do a try/catch and use ObjC's KVC API and try to assign the method queue to the NativeModule.
       * In case 1, we'll succeed. In case 2, an exception will be thrown, which we'll ignore.
       */

      @try {
        [(id)module setValue:methodQueue forKey:@"methodQueue"];
      } @catch (NSException *exception) {
        ABI48_0_0RCTLogError(
            @"%@ has no setter or ivar for its methodQueue, which is not "
             "permitted. You must either @synthesize the methodQueue property, "
             "or provide your own setter method.",
            ABI48_0_0RCTBridgeModuleNameForClass([module class]));
      }
    }
  }

  /**
   * Decorate TurboModules with bridgeless-compatible APIs that call into the bridge.
   */
  if (_bridge) {
    [_bridge attachBridgeAPIsToTurboModule:module];
  }

  /**
   * If the TurboModule conforms to ABI48_0_0RCTInitializing, invoke its initialize method.
   */
  if ([module respondsToSelector:@selector(initialize)]) {
    [(id<ABI48_0_0RCTInitializing>)module initialize];
  }

  /**
   * Attach method queue to id<ABI48_0_0RCTTurboModule> object.
   * This is necessary because the id<ABI48_0_0RCTTurboModule> object can be eagerly created/initialized before the method
   * queue is required. The method queue is required for an id<ABI48_0_0RCTTurboModule> for JS -> Native calls. So, we need it
   * before we create the id<ABI48_0_0RCTTurboModule>'s TurboModule jsi::HostObject in provideTurboModule:.
   */
  objc_setAssociatedObject(module, &kAssociatedMethodQueueKey, methodQueue, OBJC_ASSOCIATION_RETAIN);

  /**
   * NativeModules that implement the ABI48_0_0RCTFrameUpdateObserver protocol
   * require registration with ABI48_0_0RCTDisplayLink.
   *
   * TODO(T55504345): Investigate whether we can improve this after TM
   * rollout.
   */
  if (_bridge) {
    ABI48_0_0RCTModuleData *data = [[ABI48_0_0RCTModuleData alloc] initWithModuleInstance:(id<ABI48_0_0RCTBridgeModule>)module
                                                                 bridge:_bridge
                                                         moduleRegistry:_bridge.moduleRegistry
                                                viewRegistry_DEPRECATED:nil
                                                          bundleManager:nil
                                                      callableJSModules:nil];
    [_bridge registerModuleForFrameUpdates:(id<ABI48_0_0RCTBridgeModule>)module withModuleData:data];
  }

  /**
   * Broadcast that this TurboModule was created.
   *
   * TODO(T41180176): Investigate whether we can delete this after TM
   * rollout.
   */
  [[NSNotificationCenter defaultCenter]
      postNotificationName:ABI48_0_0RCTDidInitializeModuleNotification
                    object:_bridge
                  userInfo:@{@"module" : module, @"bridge" : ABI48_0_0RCTNullIfNil([_bridge parentBridge])}];

  TurboModulePerfLogger::moduleCreateSetUpEnd(moduleName, moduleId);

  return module;
}

/**
 * Should this TurboModule be created and initialized on the main queue?
 *
 * For TurboModule ObjC classes that implement requiresMainQueueInit, return the result of this method.
 * For TurboModule ObjC classes that don't. Return true if they have a custom init or constantsToExport method.
 */
- (BOOL)_requiresMainQueueSetup:(Class)moduleClass
{
  const BOOL implementsRequireMainQueueSetup = [moduleClass respondsToSelector:@selector(requiresMainQueueSetup)];
  if (implementsRequireMainQueueSetup) {
    return [moduleClass requiresMainQueueSetup];
  }

  /**
   * WARNING!
   * This following logic exists for backwards compatibility with the legacy NativeModule system.
   *
   * TODO(T65864302) Remove the following logic after TM 100% rollout
   */

  /**
   * If a module overrides `constantsToExport` and doesn't implement `requiresMainQueueSetup`, then we must assume
   * that it must be called on the main thread, because it may need to access UIKit.
   */
  BOOL hasConstantsToExport = [moduleClass instancesRespondToSelector:@selector(constantsToExport)];

  static IMP objectInitMethod;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    objectInitMethod = [NSObject instanceMethodForSelector:@selector(init)];
  });

  /**
   * If a module overrides `init` then we must assume that it expects to be initialized on the main thread, because it
   * may need to access UIKit.
   */
  const BOOL hasCustomInit = [moduleClass instanceMethodForSelector:@selector(init)] != objectInitMethod;

  BOOL requiresMainQueueSetup = hasConstantsToExport || hasCustomInit;
  if (requiresMainQueueSetup) {
    ABI48_0_0RCTLogWarn(
        @"Module %@ requires main queue setup since it overrides `%s` but doesn't implement "
         "`requiresMainQueueSetup`. In a future release ABI48_0_0React Native will default to initializing all native modules "
         "on a background thread unless explicitly opted-out of.",
        moduleClass,
        hasConstantsToExport ? "constantsToExport"
            : hasCustomInit  ? "init"
                             : "");
  }

  return requiresMainQueueSetup;
}

- (void)installJSBindingWithRuntimeExecutor:(ABI48_0_0facebook::ABI48_0_0React::RuntimeExecutor)runtimeExecutor
{
  if (!runtimeExecutor) {
    // jsi::Runtime doesn't exist when attached to Chrome debugger.
    return;
  }

  /**
   * We keep TurboModuleManager alive until the JS VM is deleted.
   * It is perfectly valid to only use/create TurboModules from JS.
   * In such a case, we shouldn't dealloc TurboModuleManager if there
   * aren't any strong references to it in ObjC. Hence, we give
   * __turboModuleProxy a strong reference to TurboModuleManager.
   */
  auto turboModuleProvider = [self](const std::string &name) -> std::shared_ptr<ABI48_0_0React::TurboModule> {
    auto moduleName = name.c_str();

    TurboModulePerfLogger::moduleJSRequireBeginningStart(moduleName);
    auto moduleWasNotInitialized = ![self moduleIsInitialized:moduleName];
    if (moduleWasNotInitialized) {
      [self->_bridge.performanceLogger markStartForTag:ABI48_0_0RCTPLTurboModuleSetup];
    }

    /**
     * By default, all TurboModules are long-lived.
     * Additionally, if a TurboModule with the name `name` isn't found, then we
     * trigger an assertion failure.
     */
    auto turboModule = [self provideTurboModule:moduleName];

    if (moduleWasNotInitialized && [self moduleIsInitialized:moduleName]) {
      [self->_bridge.performanceLogger markStopForTag:ABI48_0_0RCTPLTurboModuleSetup];
      [self notifyAboutTurboModuleSetup:moduleName];
    }

    if (turboModule) {
      TurboModulePerfLogger::moduleJSRequireEndingEnd(moduleName);
    } else {
      TurboModulePerfLogger::moduleJSRequireEndingFail(moduleName);
    }

    return turboModule;
  };

  if (ABI48_0_0RCTGetTurboModuleCleanupMode() == kABI48_0_0RCTGlobalScope ||
      ABI48_0_0RCTGetTurboModuleCleanupMode() == kABI48_0_0RCTGlobalScopeUsingRetainJSCallback) {
    runtimeExecutor([turboModuleProvider = std::move(turboModuleProvider)](jsi::Runtime &runtime) {
      ABI48_0_0React::TurboModuleBinding::install(
          runtime, std::move(turboModuleProvider), TurboModuleBindingMode::HostObject, nullptr);
    });
  } else if (ABI48_0_0RCTGetTurboModuleCleanupMode() == kABI48_0_0RCTTurboModuleManagerScope) {
    runtimeExecutor([turboModuleProvider = std::move(turboModuleProvider),
                     longLivedObjectCollection = _longLivedObjectCollection](jsi::Runtime &runtime) {
      ABI48_0_0React::TurboModuleBinding::install(
          runtime, std::move(turboModuleProvider), TurboModuleBindingMode::HostObject, longLivedObjectCollection);
    });
  }
}

#pragma mark ABI48_0_0RCTTurboModuleRegistry

- (id)moduleForName:(const char *)moduleName
{
  return [self moduleForName:moduleName warnOnLookupFailure:YES];
}

- (id)moduleForName:(const char *)moduleName warnOnLookupFailure:(BOOL)warnOnLookupFailure
{
  // When the bridge is invalidating, TurboModules will be nil.
  // Therefore, don't (1) do the lookup, and (2) warn on lookup.
  if (_invalidating) {
    return nil;
  }

  id<ABI48_0_0RCTTurboModule> module = [self provideABI48_0_0RCTTurboModule:moduleName];

  if (warnOnLookupFailure && !module) {
    ABI48_0_0RCTLogError(@"Unable to find module for %@", [NSString stringWithUTF8String:moduleName]);
  }

  return module;
}

- (BOOL)moduleIsInitialized:(const char *)moduleName
{
  if (ABI48_0_0RCTTurboModuleSharedMutexInitEnabled()) {
    std::shared_lock<std::shared_timed_mutex> guard(_turboModuleHoldersSharedMutex);
    return _turboModuleHolders.find(moduleName) != _turboModuleHolders.end();
  }

  std::unique_lock<std::mutex> guard(_turboModuleHoldersMutex);
  return _turboModuleHolders.find(moduleName) != _turboModuleHolders.end();
}

- (NSArray<NSString *> *)eagerInitModuleNames
{
  if ([_delegate respondsToSelector:@selector(getEagerInitModuleNames)]) {
    return [_delegate getEagerInitModuleNames];
  }

  return @[];
}

- (NSArray<NSString *> *)eagerInitMainQueueModuleNames
{
  if ([_delegate respondsToSelector:@selector(getEagerInitMainQueueModuleNames)]) {
    return [_delegate getEagerInitMainQueueModuleNames];
  }

  return @[];
}

#pragma mark Invalidation logic

- (void)bridgeWillInvalidateModules:(NSNotification *)notification
{
  ABI48_0_0RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _bridge) {
    return;
  }

  [self _enterInvalidatingState];
}

- (void)bridgeDidInvalidateModules:(NSNotification *)notification
{
  ABI48_0_0RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _bridge) {
    return;
  }

  [self _invalidateModules];
}

- (void)invalidate
{
  [self _enterInvalidatingState];
  [self _invalidateModules];
}

- (void)_enterInvalidatingState
{
  // This should halt all insertions into _turboModuleHolders
  if (ABI48_0_0RCTTurboModuleSharedMutexInitEnabled()) {
    std::unique_lock<std::shared_timed_mutex> guard(_turboModuleHoldersSharedMutex);
    _invalidating = true;
  } else {
    std::lock_guard<std::mutex> guard(_turboModuleHoldersMutex);
    _invalidating = true;
  }
}

- (void)_invalidateModules
{
  // Backward-compatibility: ABI48_0_0RCTInvalidating handling.
  dispatch_group_t moduleInvalidationGroup = dispatch_group_create();

  for (auto &pair : _turboModuleHolders) {
    std::string moduleName = pair.first;
    TurboModuleHolder *moduleHolder = &pair.second;

    /**
     * We could start tearing down ABI48_0_0ReactNative before a TurboModule is fully initialized. In this case, we should wait
     * for TurboModule init to finish before calling invalidate on it. So, we call _provideABI48_0_0RCTTurboModule:moduleHolder,
     * because it's guaranteed to return a fully initialized NativeModule.
     */
    id<ABI48_0_0RCTTurboModule> module = [self _provideABI48_0_0RCTTurboModule:moduleName.c_str()
                                                moduleHolder:moduleHolder
                                               shouldPerfLog:NO];

    if ([module respondsToSelector:@selector(invalidate)]) {
      dispatch_queue_t methodQueue = (dispatch_queue_t)objc_getAssociatedObject(module, &kAssociatedMethodQueueKey);

      if (methodQueue == nil) {
        ABI48_0_0RCTLogError(
            @"TurboModuleManager: Couldn't invalidate TurboModule \"%@\", because its method queue is nil.",
            [module class]);
        continue;
      }

      dispatch_group_enter(moduleInvalidationGroup);
      dispatch_block_t invalidateModule = ^{
        [((id<ABI48_0_0RCTInvalidating>)module) invalidate];
        dispatch_group_leave(moduleInvalidationGroup);
      };

      if (_bridge) {
        [_bridge dispatchBlock:invalidateModule queue:methodQueue];
      } else {
        // Bridgeless mode
        if (methodQueue == ABI48_0_0RCTJSThread) {
          invalidateModule();
        } else {
          dispatch_async(methodQueue, invalidateModule);
        }
      }
    }
  }

  if (dispatch_group_wait(moduleInvalidationGroup, dispatch_time(DISPATCH_TIME_NOW, 10 * NSEC_PER_SEC))) {
    ABI48_0_0RCTLogError(@"TurboModuleManager: Timed out waiting for modules to be invalidated");
  }

  _turboModuleHolders.clear();
  _turboModuleCache.clear();
}

@end
