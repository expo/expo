/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTBridge.h"
#import "ABI48_0_0RCTBridge+Private.h"

#import <objc/runtime.h>

#import "ABI48_0_0RCTConvert.h"
#if ABI48_0_0RCT_ENABLE_INSPECTOR
#import "ABI48_0_0RCTInspectorDevServerHelper.h"
#endif
#import "ABI48_0_0RCTDevLoadingViewProtocol.h"
#import "ABI48_0_0RCTJSThread.h"
#import "ABI48_0_0RCTLog.h"
#import "ABI48_0_0RCTModuleData.h"
#import "ABI48_0_0RCTPerformanceLogger.h"
#import "ABI48_0_0RCTProfile.h"
#import "ABI48_0_0RCTReloadCommand.h"
#import "ABI48_0_0RCTUtils.h"

static NSMutableArray<Class> *ABI48_0_0RCTModuleClasses;
static dispatch_queue_t ABI48_0_0RCTModuleClassesSyncQueue;
NSArray<Class> *ABI48_0_0RCTGetModuleClasses(void)
{
  __block NSArray<Class> *result;
  dispatch_sync(ABI48_0_0RCTModuleClassesSyncQueue, ^{
    result = [ABI48_0_0RCTModuleClasses copy];
  });
  return result;
}

/**
 * Register the given class as a bridge module. All modules must be registered
 * prior to the first bridge initialization.
 * TODO: (T115656171) Refactor ABI48_0_0RCTRegisterModule out of Bridge.m since it doesn't use the Bridge.
 */
void ABI48_0_0RCTRegisterModule(Class);
void ABI48_0_0RCTRegisterModule(Class moduleClass)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    ABI48_0_0RCTModuleClasses = [NSMutableArray new];
    ABI48_0_0RCTModuleClassesSyncQueue =
        dispatch_queue_create("com.facebook.ABI48_0_0React.ModuleClassesSyncQueue", DISPATCH_QUEUE_CONCURRENT);
  });

  ABI48_0_0RCTAssert(
      [moduleClass conformsToProtocol:@protocol(ABI48_0_0RCTBridgeModule)],
      @"%@ does not conform to the ABI48_0_0RCTBridgeModule protocol",
      moduleClass);

  // Register module
  dispatch_barrier_async(ABI48_0_0RCTModuleClassesSyncQueue, ^{
    [ABI48_0_0RCTModuleClasses addObject:moduleClass];
  });
}

/**
 * This function returns the module name for a given class.
 */
NSString *ABI48_0_0RCTBridgeModuleNameForClass(Class cls)
{
#if ABI48_0_0RCT_DEBUG
  ABI48_0_0RCTAssert(
      [cls conformsToProtocol:@protocol(ABI48_0_0RCTBridgeModule)],
      @"Bridge module `%@` does not conform to ABI48_0_0RCTBridgeModule",
      cls);
#endif

  NSString *name = [cls moduleName];
  if (name.length == 0) {
    name = NSStringFromClass(cls);
  }

  return ABI48_0_0RCTDropABI48_0_0ReactPrefixes(ABI48_0_0EX_REMOVE_VERSION(name));
}

static BOOL turboModuleEnabled = NO;
BOOL ABI48_0_0RCTTurboModuleEnabled(void)
{
#if ABI48_0_0RCT_DEBUG
  // TODO(T53341772): Allow TurboModule for test environment. Right now this breaks ABI48_0_0RNTester tests if enabled.
  if (ABI48_0_0RCTRunningInTestEnvironment()) {
    return NO;
  }
#endif
  return turboModuleEnabled;
}

void ABI48_0_0RCTEnableTurboModule(BOOL enabled)
{
  turboModuleEnabled = enabled;
}

static BOOL turboModuleEagerInitEnabled = NO;
BOOL ABI48_0_0RCTTurboModuleEagerInitEnabled(void)
{
  return turboModuleEagerInitEnabled;
}

void ABI48_0_0RCTEnableTurboModuleEagerInit(BOOL enabled)
{
  turboModuleEagerInitEnabled = enabled;
}

static BOOL turboModuleSharedMutexInitEnabled = NO;
BOOL ABI48_0_0RCTTurboModuleSharedMutexInitEnabled(void)
{
  return turboModuleSharedMutexInitEnabled;
}

void ABI48_0_0RCTEnableTurboModuleSharedMutexInit(BOOL enabled)
{
  turboModuleSharedMutexInitEnabled = enabled;
}

static ABI48_0_0RCTTurboModuleCleanupMode turboModuleCleanupMode = kABI48_0_0RCTGlobalScope;
ABI48_0_0RCTTurboModuleCleanupMode ABI48_0_0RCTGetTurboModuleCleanupMode(void)
{
  return turboModuleCleanupMode;
}

void ABI48_0_0RCTSetTurboModuleCleanupMode(ABI48_0_0RCTTurboModuleCleanupMode mode)
{
  turboModuleCleanupMode = mode;
}

// Turn off TurboModule delegate locking
static BOOL turboModuleManagerDelegateLockingDisabled = YES;
BOOL ABI48_0_0RCTTurboModuleManagerDelegateLockingDisabled(void)
{
  return turboModuleManagerDelegateLockingDisabled;
}

void ABI48_0_0RCTDisableTurboModuleManagerDelegateLocking(BOOL disabled)
{
  turboModuleManagerDelegateLockingDisabled = disabled;
}

// Turn off TurboModule delegate locking
static BOOL viewConfigEventValidAttributesDisabled = NO;
BOOL ABI48_0_0RCTViewConfigEventValidAttributesDisabled(void)
{
  return viewConfigEventValidAttributesDisabled;
}

void ABI48_0_0RCTDisableViewConfigEventValidAttributes(BOOL disabled)
{
  viewConfigEventValidAttributesDisabled = disabled;
}

@interface ABI48_0_0RCTBridge () <ABI48_0_0RCTReloadListener>
@end

@implementation ABI48_0_0RCTBridge {
  NSURL *_delegateBundleURL;
}

+ (void)initialize
{
  _ABI48_0_0RCTInitializeJSThreadConstantInternal();
}

static ABI48_0_0RCTBridge *ABI48_0_0RCTCurrentBridgeInstance = nil;

/**
 * The last current active bridge instance. This is set automatically whenever
 * the bridge is accessed. It can be useful for static functions or singletons
 * that need to access the bridge for purposes such as logging, but should not
 * be relied upon to return any particular instance, due to race conditions.
 */
+ (instancetype)currentBridge
{
  return ABI48_0_0RCTCurrentBridgeInstance;
}

+ (void)setCurrentBridge:(ABI48_0_0RCTBridge *)currentBridge
{
  ABI48_0_0RCTCurrentBridgeInstance = currentBridge;
}

- (instancetype)initWithDelegate:(id<ABI48_0_0RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  return [self initWithDelegate:delegate bundleURL:nil moduleProvider:nil launchOptions:launchOptions];
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   moduleProvider:(ABI48_0_0RCTBridgeModuleListProvider)block
                    launchOptions:(NSDictionary *)launchOptions
{
  return [self initWithDelegate:nil bundleURL:bundleURL moduleProvider:block launchOptions:launchOptions];
}

- (instancetype)initWithDelegate:(id<ABI48_0_0RCTBridgeDelegate>)delegate
                       bundleURL:(NSURL *)bundleURL
                  moduleProvider:(ABI48_0_0RCTBridgeModuleListProvider)block
                   launchOptions:(NSDictionary *)launchOptions
{
  if (self = [super init]) {
    ABI48_0_0RCTEnforceNewArchitectureValidation(ABI48_0_0RCTNotAllowedInBridgeless, self, nil);
    _delegate = delegate;
    _bundleURL = bundleURL;
    _moduleProvider = block;
    _launchOptions = [launchOptions copy];

    [self setUp];
  }
  return self;
}

ABI48_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (void)dealloc
{
  /**
   * This runs only on the main thread, but crashes the subclass
   * ABI48_0_0RCTAssertMainQueue();
   */
  [self invalidate];
}

- (void)setABI48_0_0RCTTurboModuleRegistry:(id<ABI48_0_0RCTTurboModuleRegistry>)turboModuleRegistry
{
  [self.batchedBridge setABI48_0_0RCTTurboModuleRegistry:turboModuleRegistry];
}

- (void)attachBridgeAPIsToTurboModule:(id<ABI48_0_0RCTTurboModule>)module
{
  [self.batchedBridge attachBridgeAPIsToTurboModule:module];
}

- (void)didReceiveReloadCommand
{
#if ABI48_0_0RCT_ENABLE_INSPECTOR
  // Disable debugger to resume the JsVM & avoid thread locks while reloading
  [ABI48_0_0RCTInspectorDevServerHelper disableDebugger];
#endif

  [[NSNotificationCenter defaultCenter] postNotificationName:ABI48_0_0RCTBridgeWillReloadNotification object:self userInfo:nil];

  /**
   * Any thread
   */
  dispatch_async(dispatch_get_main_queue(), ^{
    // WARNING: Invalidation is async, so it may not finish before re-setting up the bridge,
    // causing some issues. TODO: revisit this post-Fabric/TurboModule.
    [self invalidate];
    // Reload is a special case, do not preserve launchOptions and treat reload as a fresh start
    self->_launchOptions = nil;
    [self setUp];
  });
}

- (ABI48_0_0RCTModuleRegistry *)moduleRegistry
{
  return self.batchedBridge.moduleRegistry;
}

- (NSArray<Class> *)moduleClasses
{
  return self.batchedBridge.moduleClasses;
}

- (id)moduleForName:(NSString *)moduleName
{
  return [self.batchedBridge moduleForName:moduleName];
}

- (id)moduleForName:(NSString *)moduleName lazilyLoadIfNecessary:(BOOL)lazilyLoad
{
  return [self.batchedBridge moduleForName:moduleName lazilyLoadIfNecessary:lazilyLoad];
}

- (id)moduleForClass:(Class)moduleClass
{
  id module = [self.batchedBridge moduleForClass:moduleClass];
  if (!module) {
    module = [self moduleForName:ABI48_0_0RCTBridgeModuleNameForClass(moduleClass)];
  }
  return module;
}

- (NSArray *)modulesConformingToProtocol:(Protocol *)protocol
{
  NSMutableArray *modules = [NSMutableArray new];
  for (Class moduleClass in [self.moduleClasses copy]) {
    if ([moduleClass conformsToProtocol:protocol]) {
      id module = [self moduleForClass:moduleClass];
      if (module) {
        [modules addObject:module];
      }
    }
  }
  return [modules copy];
}

- (BOOL)moduleIsInitialized:(Class)moduleClass
{
  return [self.batchedBridge moduleIsInitialized:moduleClass];
}

/**
 * DEPRECATED - please use ABI48_0_0RCTReloadCommand.
 */
- (void)reload
{
  ABI48_0_0RCTTriggerReloadCommandListeners(@"Unknown from bridge");
}

/**
 * DEPRECATED - please use ABI48_0_0RCTReloadCommand.
 */
- (void)reloadWithReason:(NSString *)reason
{
  ABI48_0_0RCTTriggerReloadCommandListeners(reason);
}

- (void)onFastRefresh
{
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI48_0_0RCTBridgeFastRefreshNotification object:self];
}

/**
 * DEPRECATED - please use ABI48_0_0RCTReloadCommand.
 */
- (void)requestReload
{
  [self reloadWithReason:@"Requested from bridge"];
}

- (Class)bridgeClass
{
  return [ABI48_0_0RCTCxxBridge class];
}

- (void)setUp
{
  ABI48_0_0RCT_PROFILE_BEGIN_EVENT(0, @"-[ABI48_0_0RCTBridge setUp]", nil);

  _performanceLogger = [ABI48_0_0RCTPerformanceLogger new];
  [_performanceLogger markStartForTag:ABI48_0_0RCTPLBridgeStartup];
  [_performanceLogger markStartForTag:ABI48_0_0RCTPLTTI];

  Class bridgeClass = self.bridgeClass;

  // Only update bundleURL from delegate if delegate bundleURL has changed
  NSURL *previousDelegateURL = _delegateBundleURL;
  _delegateBundleURL = [self.delegate sourceURLForBridge:self];
  if (_delegateBundleURL && ![_delegateBundleURL isEqual:previousDelegateURL]) {
    _bundleURL = _delegateBundleURL;
  }

  // Sanitize the bundle URL
  _bundleURL = [ABI48_0_0RCTConvert NSURL:_bundleURL.absoluteString];

  ABI48_0_0RCTExecuteOnMainQueue(^{
    ABI48_0_0RCTRegisterReloadCommandListener(self);
    ABI48_0_0RCTReloadCommandSetBundleURL(self->_bundleURL);
  });

  self.batchedBridge = [[bridgeClass alloc] initWithParentBridge:self];
  [self.batchedBridge start];

  ABI48_0_0RCT_PROFILE_END_EVENT(ABI48_0_0RCTProfileTagAlways, @"");
}

- (BOOL)isLoading
{
  return self.batchedBridge.loading;
}

- (BOOL)isValid
{
  return self.batchedBridge.valid;
}

- (BOOL)isBatchActive
{
  return [_batchedBridge isBatchActive];
}

- (void)invalidate
{
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI48_0_0RCTBridgeWillBeInvalidatedNotification object:self];

  ABI48_0_0RCTBridge *batchedBridge = self.batchedBridge;
  self.batchedBridge = nil;

  if (batchedBridge) {
    ABI48_0_0RCTExecuteOnMainQueue(^{
      [batchedBridge invalidate];
    });
  }
}

- (void)updateModuleWithInstance:(id<ABI48_0_0RCTBridgeModule>)instance
{
  [self.batchedBridge updateModuleWithInstance:instance];
}

- (void)registerAdditionalModuleClasses:(NSArray<Class> *)modules
{
  [self.batchedBridge registerAdditionalModuleClasses:modules];
}

- (void)enqueueJSCall:(NSString *)moduleDotMethod args:(NSArray *)args
{
  NSArray<NSString *> *ids = [moduleDotMethod componentsSeparatedByString:@"."];
  NSString *module = ids[0];
  NSString *method = ids[1];
  [self enqueueJSCall:module method:method args:args completion:NULL];
}

- (void)enqueueJSCall:(NSString *)module
               method:(NSString *)method
                 args:(NSArray *)args
           completion:(dispatch_block_t)completion
{
  [self.batchedBridge enqueueJSCall:module method:method args:args completion:completion];
}

- (void)enqueueCallback:(NSNumber *)cbID args:(NSArray *)args
{
  [self.batchedBridge enqueueCallback:cbID args:args];
}

- (void)registerSegmentWithId:(NSUInteger)segmentId path:(NSString *)path
{
  [self.batchedBridge registerSegmentWithId:segmentId path:path];
}

- (void)loadAndExecuteSplitBundleURL:(NSURL *)bundleURL
                             onError:(ABI48_0_0RCTLoadAndExecuteErrorBlock)onError
                          onComplete:(dispatch_block_t)onComplete
{
  [self.batchedBridge loadAndExecuteSplitBundleURL:bundleURL onError:onError onComplete:onComplete];
}

@end
