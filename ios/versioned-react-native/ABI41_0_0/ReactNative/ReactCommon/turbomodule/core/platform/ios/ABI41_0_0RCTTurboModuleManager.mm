/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTTurboModuleManager.h"

#import <atomic>
#import <cassert>
#import <mutex>

#import <objc/runtime.h>

#import <ABI41_0_0React/ABI41_0_0RCTBridge+Private.h>
#import <ABI41_0_0React/ABI41_0_0RCTBridgeModule.h>
#import <ABI41_0_0React/ABI41_0_0RCTCxxModule.h>
#import <ABI41_0_0React/ABI41_0_0RCTLog.h>
#import <ABI41_0_0React/ABI41_0_0RCTModuleData.h>
#import <ABI41_0_0React/ABI41_0_0RCTPerformanceLogger.h>
#import <ABI41_0_0React/ABI41_0_0RCTUtils.h>
#import <ABI41_0_0ReactCommon/ABI41_0_0TurboCxxModule.h>
#import <ABI41_0_0ReactCommon/ABI41_0_0TurboModuleBinding.h>

using namespace ABI41_0_0facebook;

/**
 * A global variable whose address we use to associate method queues to id<ABI41_0_0RCTTurboModule> objects.
 */
static char kAssociatedMethodQueueKey;

namespace {
class MethodQueueNativeCallInvoker : public ABI41_0_0facebook::ABI41_0_0React::CallInvoker {
 private:
  dispatch_queue_t methodQueue_;

 public:
  MethodQueueNativeCallInvoker(dispatch_queue_t methodQueue) : methodQueue_(methodQueue) {}
  void invokeAsync(std::function<void()> &&work) override
  {
    if (methodQueue_ == ABI41_0_0RCTJSThread) {
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
    if (methodQueue_ == ABI41_0_0RCTJSThread) {
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

// Fallback lookup since ABI41_0_0RCT class prefix is sometimes stripped in the existing NativeModule system.
// This will be removed in the future.
static Class getFallbackClassFromName(const char *name)
{
  Class moduleClass = NSClassFromString([NSString stringWithUTF8String:name]);
  if (!moduleClass) {
    moduleClass = NSClassFromString([NSString stringWithFormat:@"ABI41_0_0RCT%s", name]);
  }
  return moduleClass;
}

@implementation ABI41_0_0RCTTurboModuleManager {
  jsi::Runtime *_runtime;
  std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker> _jsInvoker;
  id<ABI41_0_0RCTTurboModulePerformanceLogger> _performanceLogger;
  __weak id<ABI41_0_0RCTTurboModuleManagerDelegate> _delegate;
  __weak ABI41_0_0RCTBridge *_bridge;
  /**
   * TODO(T48018690):
   * All modules are currently long-lived.
   * We need to come up with a mechanism to allow modules to specify whether
   * they want to be long-lived or short-lived.
   */
  std::unordered_map<std::string, id<ABI41_0_0RCTTurboModule>> _rctTurboModuleCache;
  std::unordered_map<std::string, std::shared_ptr<ABI41_0_0React::TurboModule>> _turboModuleCache;

  /**
   * _rctTurboModuleCache can be accessed by multiple threads at once via
   * the provideABI41_0_0RCTTurboModule method. This can lead to races. Therefore, we
   * need to protect access to this unordered_map.
   *
   * Note:
   * There's no need to protect access to _turboModuleCache because that cache
   * is only accessed within provideTurboModule, which is only invoked by the
   * JS thread.
   */
  std::mutex _rctTurboModuleCacheLock;
  std::atomic<bool> _invalidating;
}

- (instancetype)initWithBridge:(ABI41_0_0RCTBridge *)bridge
                      delegate:(id<ABI41_0_0RCTTurboModuleManagerDelegate>)delegate
                     jsInvoker:(std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker>)jsInvoker
{
  return [self initWithBridge:bridge delegate:delegate jsInvoker:jsInvoker performanceLogger:nil];
}

- (instancetype)initWithBridge:(ABI41_0_0RCTBridge *)bridge
                      delegate:(id<ABI41_0_0RCTTurboModuleManagerDelegate>)delegate
                     jsInvoker:(std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker>)jsInvoker
             performanceLogger:(id<ABI41_0_0RCTTurboModulePerformanceLogger>)performanceLogger
{
  if (self = [super init]) {
    _jsInvoker = jsInvoker;
    _delegate = delegate;
    _bridge = bridge;
    _invalidating = false;
    _performanceLogger = performanceLogger;

    // Necessary to allow NativeModules to lookup TurboModules
    [bridge setABI41_0_0RCTTurboModuleLookupDelegate:self];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeWillInvalidateModules:)
                                                 name:ABI41_0_0RCTBridgeWillInvalidateModulesNotification
                                               object:_bridge.parentBridge];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeDidInvalidateModules:)
                                                 name:ABI41_0_0RCTBridgeDidInvalidateModulesNotification
                                               object:_bridge.parentBridge];
  }
  return self;
}

- (void)notifyAboutTurboModuleSetup:(const char *)name
{
  NSString *moduleName = [[NSString alloc] initWithUTF8String:name];
  if (moduleName) {
    int64_t setupTime = [self->_bridge.performanceLogger durationForTag:ABI41_0_0RCTPLTurboModuleSetup];
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI41_0_0RCTDidSetupModuleNotification
                                                        object:nil
                                                      userInfo:@{
                                                        ABI41_0_0RCTDidSetupModuleNotificationModuleNameKey : moduleName,
                                                        ABI41_0_0RCTDidSetupModuleNotificationSetupTimeKey : @(setupTime)
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

- (std::shared_ptr<ABI41_0_0React::TurboModule>)provideTurboModule:(const char *)moduleName
{
  auto turboModuleLookup = _turboModuleCache.find(moduleName);
  if (turboModuleLookup != _turboModuleCache.end()) {
    [_performanceLogger createTurboModuleCacheHit:moduleName];
    return turboModuleLookup->second;
  }

  /**
   * Step 1: Look for pure C++ modules.
   * Pure C++ modules get priority.
   */
  if ([_delegate respondsToSelector:@selector(getTurboModule:jsInvoker:)]) {
    [_performanceLogger getCppTurboModuleFromTMMDelegateStart:moduleName];
    auto turboModule = [_delegate getTurboModule:moduleName jsInvoker:_jsInvoker];
    [_performanceLogger getCppTurboModuleFromTMMDelegateEnd:moduleName];
    if (turboModule != nullptr) {
      _turboModuleCache.insert({moduleName, turboModule});
      return turboModule;
    }
  }

  /**
   * Step 2: Look for platform-specific modules.
   */
  [_performanceLogger createABI41_0_0RCTTurboModuleStart:moduleName];
  id<ABI41_0_0RCTTurboModule> module = [self provideABI41_0_0RCTTurboModule:moduleName];
  [_performanceLogger createABI41_0_0RCTTurboModuleEnd:moduleName];

  // If we request that a TurboModule be created, its respective ObjC class must exist
  // If the class doesn't exist, then provideABI41_0_0RCTTurboModule returns nil
  if (!module) {
    return nullptr;
  }

  Class moduleClass = [module class];

  dispatch_queue_t methodQueue = (dispatch_queue_t)objc_getAssociatedObject(module, &kAssociatedMethodQueueKey);

  /**
   * Step 2c: Create and native CallInvoker from the TurboModule's method queue.
   */
  std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker> nativeInvoker =
      std::make_shared<MethodQueueNativeCallInvoker>(methodQueue);

  /**
   * Have ABI41_0_0RCTCxxBridge decorate native CallInvoker, so that it's aware of TurboModule async method calls.
   * This helps the bridge fire onBatchComplete as readily as it should.
   */
  if ([_bridge respondsToSelector:@selector(decorateNativeCallInvoker:)]) {
    nativeInvoker = [_bridge decorateNativeCallInvoker:nativeInvoker];
  }

  // If ABI41_0_0RCTTurboModule supports creating its own C++ TurboModule object,
  // allow it to do so.
  if ([module respondsToSelector:@selector(getTurboModuleWithJsInvoker:nativeInvoker:perfLogger:)]) {
    [_performanceLogger getTurboModuleFromABI41_0_0RCTTurboModuleStart:moduleName];
    auto turboModule = [module getTurboModuleWithJsInvoker:_jsInvoker
                                             nativeInvoker:nativeInvoker
                                                perfLogger:_performanceLogger];
    [_performanceLogger getTurboModuleFromABI41_0_0RCTTurboModuleEnd:moduleName];
    assert(turboModule != nullptr);
    _turboModuleCache.insert({moduleName, turboModule});
    return turboModule;
  }

  /**
   * Step 2d: If the moduleClass is a legacy CxxModule, return a TurboCxxModule instance that
   * wraps CxxModule.
   */
  if ([moduleClass isSubclassOfClass:ABI41_0_0RCTCxxModule.class]) {
    // Use TurboCxxModule compat class to wrap the CxxModule instance.
    // This is only for migration convenience, despite less performant.
    [_performanceLogger getTurboModuleFromABI41_0_0RCTCxxModuleStart:moduleName];
    auto turboModule = std::make_shared<ABI41_0_0React::TurboCxxModule>([((ABI41_0_0RCTCxxModule *)module) createModule], _jsInvoker);
    [_performanceLogger getTurboModuleFromABI41_0_0RCTCxxModuleEnd:moduleName];
    _turboModuleCache.insert({moduleName, turboModule});
    return turboModule;
  }

  /**
   * Step 2e: Return an exact sub-class of ObjC TurboModule
   */
  [_performanceLogger getTurboModuleFromTMMDelegateStart:moduleName];
  auto turboModule = [_delegate getTurboModule:moduleName
                                      instance:module
                                     jsInvoker:_jsInvoker
                                 nativeInvoker:nativeInvoker
                                    perfLogger:_performanceLogger];
  [_performanceLogger getTurboModuleFromTMMDelegateEnd:moduleName];
  if (turboModule != nullptr) {
    _turboModuleCache.insert({moduleName, turboModule});
  }
  return turboModule;
}

/**
 * Given a name for a TurboModule, return an ObjC object which is the instance
 * of that TurboModule ObjC class. If no TurboModule exist with the provided name,
 * return nil.
 *
 * Note: All TurboModule instances are cached, which means they're all long-lived
 * (for now).
 */
- (id<ABI41_0_0RCTTurboModule>)provideABI41_0_0RCTTurboModule:(const char *)moduleName
{
  Class moduleClass;
  id<ABI41_0_0RCTTurboModule> module = nil;

  {
    std::unique_lock<std::mutex> lock(_rctTurboModuleCacheLock);

    auto rctTurboModuleCacheLookup = _rctTurboModuleCache.find(moduleName);
    if (rctTurboModuleCacheLookup != _rctTurboModuleCache.end()) {
      [_performanceLogger createABI41_0_0RCTTurboModuleCacheHit:moduleName];
      return rctTurboModuleCacheLookup->second;
    }

    if (_invalidating) {
      // Don't allow creating new instances while invalidating.
      return nil;
    }

    /**
     * Step 2a: Resolve platform-specific class.
     */
    [_performanceLogger getABI41_0_0RCTTurboModuleClassStart:moduleName];

    if ([_delegate respondsToSelector:@selector(getModuleClassFromName:)]) {
      moduleClass = [_delegate getModuleClassFromName:moduleName];
    }

    if (!moduleClass) {
      moduleClass = getFallbackClassFromName(moduleName);
    }

    [_performanceLogger getABI41_0_0RCTTurboModuleClassEnd:moduleName];

    if (![moduleClass conformsToProtocol:@protocol(ABI41_0_0RCTTurboModule)]) {
      return nil;
    }

    /**
     * Step 2b: Ask hosting application/delegate to instantiate this class
     */
    [_performanceLogger getABI41_0_0RCTTurboModuleInstanceStart:moduleName];

    if ([_delegate respondsToSelector:@selector(getModuleInstanceFromClass:)]) {
      module = [_delegate getModuleInstanceFromClass:moduleClass];
    } else {
      module = [moduleClass new];
    }

    [_performanceLogger getABI41_0_0RCTTurboModuleInstanceEnd:moduleName];

    if ([module respondsToSelector:@selector(setTurboModuleLookupDelegate:)]) {
      [module setTurboModuleLookupDelegate:self];
    }

    _rctTurboModuleCache.insert({moduleName, module});
  }

  [self setUpABI41_0_0RCTTurboModule:module moduleName:moduleName];
  return module;
}

- (void)setUpABI41_0_0RCTTurboModule:(id<ABI41_0_0RCTTurboModule>)module moduleName:(const char *)moduleName
{
  __weak id<ABI41_0_0RCTBridgeModule> weakModule = (id<ABI41_0_0RCTBridgeModule>)module;
  __weak ABI41_0_0RCTBridge *weakBridge = _bridge;
  id<ABI41_0_0RCTTurboModulePerformanceLogger> performanceLogger = _performanceLogger;

  auto setUpTurboModule = ^{
    if (!weakModule) {
      return;
    }

    [performanceLogger setupABI41_0_0RCTTurboModuleStart:moduleName];

    id<ABI41_0_0RCTBridgeModule> strongModule = weakModule;
    ABI41_0_0RCTBridge *strongBridge = weakBridge;

    /**
     * It is reasonable for NativeModules to not want/need the bridge.
     * In such cases, they won't have `@synthesize bridge = _bridge` in their
     * implementation, and a `- (ABI41_0_0RCTBridge *) bridge { ... }` method won't be
     * generated by the ObjC runtime. The property will also not be backed
     * by an ivar, which makes writing to it unsafe. Therefore, we check if
     * this method exists to know if we can safely set the bridge to the
     * NativeModule.
     */
    if ([strongModule respondsToSelector:@selector(bridge)] && strongBridge) {
      [performanceLogger attachABI41_0_0RCTBridgeToABI41_0_0RCTTurboModuleStart:moduleName];

      /**
       * Just because a NativeModule has the `bridge` method, it doesn't mean
       * that it has synthesized the bridge in its implementation. Therefore,
       * we need to surround the code that sets the bridge to the NativeModule
       * inside a try/catch. This catches the cases where the NativeModule
       * author specifies a `bridge` method manually.
       */
      @try {
        /**
         * ABI41_0_0RCTBridgeModule declares the bridge property as readonly.
         * Therefore, when authors of NativeModules synthesize the bridge
         * via @synthesize bridge = bridge;, the ObjC runtime generates
         * only a - (ABI41_0_0RCTBridge *) bridge: { ... } method. No setter is
         * generated, so we have have to rely on the KVC API of ObjC to set
         * the bridge property of these NativeModules.
         */
        [(id)strongModule setValue:strongBridge forKey:@"bridge"];
      } @catch (NSException *exception) {
        ABI41_0_0RCTLogError(
            @"%@ has no setter or ivar for its bridge, which is not "
             "permitted. You must either @synthesize the bridge property, "
             "or provide your own setter method.",
            ABI41_0_0RCTBridgeModuleNameForClass([strongModule class]));
      }

      [performanceLogger attachABI41_0_0RCTBridgeToABI41_0_0RCTTurboModuleEnd:moduleName];
    }

    /**
     * Some modules need their own queues, but don't provide any, so we need to create it for them.
     * These modules typically have the following:
     *   `@synthesize methodQueue = _methodQueue`
     */

    [performanceLogger attachMethodQueueToABI41_0_0RCTTurboModuleStart:moduleName];

    dispatch_queue_t methodQueue = nil;
    BOOL moduleHasMethodQueueGetter = [strongModule respondsToSelector:@selector(methodQueue)];

    if (moduleHasMethodQueueGetter) {
      methodQueue = [strongModule methodQueue];
    }

    /**
     * Note: ABI41_0_0RCTJSThread, which is a valid method queue, is defined as (id)kCFNull. It should rightfully not enter the
     * following if condition's block.
     */
    if (!methodQueue) {
      NSString *methodQueueName = [NSString stringWithFormat:@"com.facebook.ABI41_0_0React.%sQueue", moduleName];
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
          [(id)strongModule setValue:methodQueue forKey:@"methodQueue"];
        } @catch (NSException *exception) {
          ABI41_0_0RCTLogError(
              @"%@ has no setter or ivar for its methodQueue, which is not "
               "permitted. You must either @synthesize the bridge property, "
               "or provide your own setter method.",
              ABI41_0_0RCTBridgeModuleNameForClass([strongModule class]));
        }
      }
    }

    /**
     * Attach method queue to id<ABI41_0_0RCTTurboModule> object.
     * This is necessary because the id<ABI41_0_0RCTTurboModule> object can be eagerly created/initialized before the method
     * queue is required. The method queue is required for an id<ABI41_0_0RCTTurboModule> for JS -> Native calls. So, we need it
     * before we create the id<ABI41_0_0RCTTurboModule>'s TurboModule jsi::HostObject in provideTurboModule:.
     */
    objc_setAssociatedObject(strongModule, &kAssociatedMethodQueueKey, methodQueue, OBJC_ASSOCIATION_RETAIN);

    [performanceLogger attachMethodQueueToABI41_0_0RCTTurboModuleEnd:moduleName];

    /**
     * NativeModules that implement the ABI41_0_0RCTFrameUpdateObserver protocol
     * require registration with ABI41_0_0RCTDisplayLink.
     *
     * TODO(T55504345): Investigate whether we can improve this after TM
     * rollout.
     */
    if (strongBridge) {
      [performanceLogger registerABI41_0_0RCTTurboModuleForFrameUpdatesStart:moduleName];
      ABI41_0_0RCTModuleData *data = [[ABI41_0_0RCTModuleData alloc] initWithModuleInstance:strongModule bridge:strongBridge];
      [strongBridge registerModuleForFrameUpdates:strongModule withModuleData:data];
      [performanceLogger registerABI41_0_0RCTTurboModuleForFrameUpdatesEnd:moduleName];
    }

    /**
     * Broadcast that this TurboModule was created.
     *
     * TODO(T41180176): Investigate whether we can delete this after TM
     * rollout.
     */
    [performanceLogger dispatchDidInitializeModuleNotificationForABI41_0_0RCTTurboModuleStart:moduleName];
    [[NSNotificationCenter defaultCenter]
        postNotificationName:ABI41_0_0RCTDidInitializeModuleNotification
                      object:strongBridge
                    userInfo:@{@"module" : module, @"bridge" : ABI41_0_0RCTNullIfNil([strongBridge parentBridge])}];
    [performanceLogger dispatchDidInitializeModuleNotificationForABI41_0_0RCTTurboModuleEnd:moduleName];

    [performanceLogger setupABI41_0_0RCTTurboModuleEnd:moduleName];
  };

  /**
   * TODO(T64991809): Fix TurboModule race:
   *  - When NativeModules that don't require main queue setup are required from different threads, they'll
   *    concurrently run setUpABI41_0_0RCTTurboModule:
   */
  if ([[module class] respondsToSelector:@selector(requiresMainQueueSetup)] &&
      [[module class] requiresMainQueueSetup]) {
    /**
     * If the main thread synchronously calls into JS that creates a TurboModule,
     * we could deadlock. This behaviour is migrated over from the legacy NativeModule
     * system.
     *
     * TODO(T63807674): Investigate the right migration plan off of this
     */
    [_performanceLogger setupABI41_0_0RCTTurboModuleDispatch:moduleName];
    ABI41_0_0RCTUnsafeExecuteOnMainQueueSync(setUpTurboModule);
  } else {
    setUpTurboModule();
  }
}

- (void)installJSBindingWithRuntime:(jsi::Runtime *)runtime
{
  _runtime = runtime;

  if (!_runtime) {
    // jsi::Runtime doesn't exist when attached to Chrome debugger.
    return;
  }

  __weak __typeof(self) weakSelf = self;

  ABI41_0_0React::TurboModuleBinding::install(
      *_runtime,
      [weakSelf,
       performanceLogger = _performanceLogger](const std::string &name) -> std::shared_ptr<ABI41_0_0React::TurboModule> {
        if (!weakSelf) {
          return nullptr;
        }

        __strong __typeof(self) strongSelf = weakSelf;

        auto moduleName = name.c_str();
        auto moduleWasNotInitialized = ![strongSelf moduleIsInitialized:moduleName];
        if (moduleWasNotInitialized) {
          [strongSelf->_bridge.performanceLogger markStartForTag:ABI41_0_0RCTPLTurboModuleSetup];
        }

        [performanceLogger createTurboModuleStart:moduleName];

        /**
         * By default, all TurboModules are long-lived.
         * Additionally, if a TurboModule with the name `name` isn't found, then we
         * trigger an assertion failure.
         */
        auto turboModule = [strongSelf provideTurboModule:moduleName];

        [performanceLogger createTurboModuleEnd:moduleName];

        if (moduleWasNotInitialized && [strongSelf moduleIsInitialized:moduleName]) {
          [strongSelf->_bridge.performanceLogger markStopForTag:ABI41_0_0RCTPLTurboModuleSetup];
          [strongSelf notifyAboutTurboModuleSetup:moduleName];
        }

        return turboModule;
      });
}

#pragma mark ABI41_0_0RCTTurboModuleLookupDelegate

- (id)moduleForName:(const char *)moduleName
{
  return [self moduleForName:moduleName warnOnLookupFailure:YES];
}

- (id)moduleForName:(const char *)moduleName warnOnLookupFailure:(BOOL)warnOnLookupFailure
{
  id<ABI41_0_0RCTTurboModule> module = [self provideABI41_0_0RCTTurboModule:moduleName];

  if (warnOnLookupFailure && !module) {
    ABI41_0_0RCTLogError(@"Unable to find module for %@", [NSString stringWithUTF8String:moduleName]);
  }

  return module;
}

- (BOOL)moduleIsInitialized:(const char *)moduleName
{
  std::unique_lock<std::mutex> lock(_rctTurboModuleCacheLock);
  return _rctTurboModuleCache.find(std::string(moduleName)) != _rctTurboModuleCache.end();
}

#pragma mark Invalidation logic

- (void)bridgeWillInvalidateModules:(NSNotification *)notification
{
  ABI41_0_0RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _bridge) {
    return;
  }

  _invalidating = true;
}

- (void)bridgeDidInvalidateModules:(NSNotification *)notification
{
  ABI41_0_0RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _bridge) {
    return;
  }

  std::unordered_map<std::string, id<ABI41_0_0RCTTurboModule>> rctCacheCopy;
  {
    std::unique_lock<std::mutex> lock(_rctTurboModuleCacheLock);
    rctCacheCopy.insert(_rctTurboModuleCache.begin(), _rctTurboModuleCache.end());
  }

  // Backward-compatibility: ABI41_0_0RCTInvalidating handling.
  dispatch_group_t moduleInvalidationGroup = dispatch_group_create();
  for (const auto &p : rctCacheCopy) {
    id<ABI41_0_0RCTTurboModule> module = p.second;
    if ([module respondsToSelector:@selector(invalidate)]) {
      if ([module respondsToSelector:@selector(methodQueue)]) {
        dispatch_queue_t methodQueue = [module performSelector:@selector(methodQueue)];
        if (methodQueue) {
          dispatch_group_enter(moduleInvalidationGroup);
          [bridge
              dispatchBlock:^{
                [((id<ABI41_0_0RCTInvalidating>)module) invalidate];
                dispatch_group_leave(moduleInvalidationGroup);
              }
                      queue:methodQueue];
          continue;
        }
      }
      [((id<ABI41_0_0RCTInvalidating>)module) invalidate];
    }
  }

  if (dispatch_group_wait(moduleInvalidationGroup, dispatch_time(DISPATCH_TIME_NOW, 10 * NSEC_PER_SEC))) {
    ABI41_0_0RCTLogError(@"TurboModuleManager: Timed out waiting for modules to be invalidated");
  }

  {
    std::unique_lock<std::mutex> lock(_rctTurboModuleCacheLock);
    _rctTurboModuleCache.clear();
  }

  _turboModuleCache.clear();
}

- (void)invalidate
{
  std::unordered_map<std::string, id<ABI41_0_0RCTTurboModule>> rctCacheCopy;
  {
    std::unique_lock<std::mutex> lock(_rctTurboModuleCacheLock);
    rctCacheCopy.insert(_rctTurboModuleCache.begin(), _rctTurboModuleCache.end());
  }

  // Backward-compatibility: ABI41_0_0RCTInvalidating handling, but not adhering to desired methodQueue.
  for (const auto &p : rctCacheCopy) {
    id<ABI41_0_0RCTTurboModule> module = p.second;
    if ([module respondsToSelector:@selector(invalidate)]) {
      [((id<ABI41_0_0RCTInvalidating>)module) invalidate];
    }
  }

  {
    std::unique_lock<std::mutex> lock(_rctTurboModuleCacheLock);
    _rctTurboModuleCache.clear();
  }

  _turboModuleCache.clear();
}

@end
