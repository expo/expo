/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTBridge.h"
#import "ABI27_0_0RCTBridge+Private.h"

#import <objc/runtime.h>

#import "ABI27_0_0RCTConvert.h"
#import "ABI27_0_0RCTEventDispatcher.h"
#if ABI27_0_0RCT_ENABLE_INSPECTOR
#import "ABI27_0_0RCTInspectorDevServerHelper.h"
#endif
#import "ABI27_0_0RCTLog.h"
#import "ABI27_0_0RCTModuleData.h"
#import "ABI27_0_0RCTPerformanceLogger.h"
#import "ABI27_0_0RCTProfile.h"
#import "ABI27_0_0RCTReloadCommand.h"
#import "ABI27_0_0RCTUtils.h"

NSString *const ABI27_0_0RCTJavaScriptWillStartLoadingNotification = @"ABI27_0_0RCTJavaScriptWillStartLoadingNotification";
NSString *const ABI27_0_0RCTJavaScriptWillStartExecutingNotification = @"ABI27_0_0RCTJavaScriptWillStartExecutingNotification";
NSString *const ABI27_0_0RCTJavaScriptDidLoadNotification = @"ABI27_0_0RCTJavaScriptDidLoadNotification";
NSString *const ABI27_0_0RCTJavaScriptDidFailToLoadNotification = @"ABI27_0_0RCTJavaScriptDidFailToLoadNotification";
NSString *const ABI27_0_0RCTDidInitializeModuleNotification = @"ABI27_0_0RCTDidInitializeModuleNotification";
NSString *const ABI27_0_0RCTBridgeWillReloadNotification = @"ABI27_0_0RCTBridgeWillReloadNotification";
NSString *const ABI27_0_0RCTBridgeWillDownloadScriptNotification = @"ABI27_0_0RCTBridgeWillDownloadScriptNotification";
NSString *const ABI27_0_0RCTBridgeDidDownloadScriptNotification = @"ABI27_0_0RCTBridgeDidDownloadScriptNotification";
NSString *const ABI27_0_0RCTBridgeDidDownloadScriptNotificationSourceKey = @"source";

static NSMutableArray<Class> *ABI27_0_0RCTModuleClasses;
NSArray<Class> *ABI27_0_0RCTGetModuleClasses(void)
{
  return ABI27_0_0RCTModuleClasses;
}

void ABI27_0_0RCTFBQuickPerformanceLoggerConfigureHooks(__unused JSGlobalContextRef ctx) { }

/**
 * Register the given class as a bridge module. All modules must be registered
 * prior to the first bridge initialization.
 */
void ABI27_0_0RCTRegisterModule(Class);
void ABI27_0_0RCTRegisterModule(Class moduleClass)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    ABI27_0_0RCTModuleClasses = [NSMutableArray new];
  });

  ABI27_0_0RCTAssert([moduleClass conformsToProtocol:@protocol(ABI27_0_0RCTBridgeModule)],
            @"%@ does not conform to the ABI27_0_0RCTBridgeModule protocol",
            moduleClass);

  // Register module
  [ABI27_0_0RCTModuleClasses addObject:moduleClass];
}

/**
 * This function returns the module name for a given class.
 */
NSString *ABI27_0_0RCTBridgeModuleNameForClass(Class cls)
{
#if ABI27_0_0RCT_DEBUG
  ABI27_0_0RCTAssert([cls conformsToProtocol:@protocol(ABI27_0_0RCTBridgeModule)],
            @"Bridge module `%@` does not conform to ABI27_0_0RCTBridgeModule", cls);
#endif

  NSString *name = [cls moduleName];
  if (name.length == 0) {
    name = NSStringFromClass(cls);
  }

  name = ABI27_0_0EX_REMOVE_VERSION(name);

  if ([name hasPrefix:@"RK"]) {
    name = [name substringFromIndex:2];
  } else if ([name hasPrefix:@"RCT"]) {
    name = [name substringFromIndex:3];
  }

  return name;
}

#if ABI27_0_0RCT_DEBUG
void ABI27_0_0RCTVerifyAllModulesExported(NSArray *extraModules)
{
  // Check for unexported modules
  unsigned int classCount;
  Class *classes = objc_copyClassList(&classCount);

  NSMutableSet *moduleClasses = [NSMutableSet new];
  [moduleClasses addObjectsFromArray:ABI27_0_0RCTGetModuleClasses()];
  [moduleClasses addObjectsFromArray:[extraModules valueForKeyPath:@"class"]];

  for (unsigned int i = 0; i < classCount; i++) {
    Class cls = classes[i];
    Class superclass = cls;
    while (superclass) {
      if (class_conformsToProtocol(superclass, @protocol(ABI27_0_0RCTBridgeModule))) {
        if ([moduleClasses containsObject:cls]) {
          break;
        }

        // Verify it's not a super-class of one of our moduleClasses
        BOOL isModuleSuperClass = NO;
        for (Class moduleClass in moduleClasses) {
          if ([moduleClass isSubclassOfClass:cls]) {
            isModuleSuperClass = YES;
            break;
          }
        }
        if (isModuleSuperClass) {
          break;
        }

        break;
      }
      superclass = class_getSuperclass(superclass);
    }
  }

  free(classes);
}
#endif

@interface ABI27_0_0RCTBridge () <ABI27_0_0RCTReloadListener>
@end

@implementation ABI27_0_0RCTBridge
{
  NSURL *_delegateBundleURL;
}

dispatch_queue_t ABI27_0_0RCTJSThread;

+ (void)initialize
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{

    // Set up JS thread
    ABI27_0_0RCTJSThread = (id)kCFNull;
  });
}

static ABI27_0_0RCTBridge *ABI27_0_0RCTCurrentBridgeInstance = nil;

/**
 * The last current active bridge instance. This is set automatically whenever
 * the bridge is accessed. It can be useful for static functions or singletons
 * that need to access the bridge for purposes such as logging, but should not
 * be relied upon to return any particular instance, due to race conditions.
 */
+ (instancetype)currentBridge
{
  return ABI27_0_0RCTCurrentBridgeInstance;
}

+ (void)setCurrentBridge:(ABI27_0_0RCTBridge *)currentBridge
{
  ABI27_0_0RCTCurrentBridgeInstance = currentBridge;
}

- (instancetype)initWithDelegate:(id<ABI27_0_0RCTBridgeDelegate>)delegate
                   launchOptions:(NSDictionary *)launchOptions
{
  return [self initWithDelegate:delegate
                      bundleURL:nil
                 moduleProvider:nil
                  launchOptions:launchOptions];
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   moduleProvider:(ABI27_0_0RCTBridgeModuleListProvider)block
                    launchOptions:(NSDictionary *)launchOptions
{
  return [self initWithDelegate:nil
                      bundleURL:bundleURL
                 moduleProvider:block
                  launchOptions:launchOptions];
}

- (instancetype)initWithDelegate:(id<ABI27_0_0RCTBridgeDelegate>)delegate
                       bundleURL:(NSURL *)bundleURL
                  moduleProvider:(ABI27_0_0RCTBridgeModuleListProvider)block
                   launchOptions:(NSDictionary *)launchOptions
{
  if (self = [super init]) {
    _delegate = delegate;
    _bundleURL = bundleURL;
    _moduleProvider = block;
    _launchOptions = [launchOptions copy];

    [self setUp];
  }
  return self;
}

ABI27_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)dealloc
{
  /**
   * This runs only on the main thread, but crashes the subclass
   * ABI27_0_0RCTAssertMainQueue();
   */
  [self invalidate];
}

- (void)didReceiveReloadCommand
{
  [self reload];
}

- (NSArray<Class> *)moduleClasses
{
  return self.batchedBridge.moduleClasses;
}

- (id)moduleForName:(NSString *)moduleName
{
  return [self.batchedBridge moduleForName:moduleName];
}

- (id)moduleForClass:(Class)moduleClass
{
  return [self moduleForName:ABI27_0_0RCTBridgeModuleNameForClass(moduleClass)];
}

- (NSArray *)modulesConformingToProtocol:(Protocol *)protocol
{
  NSMutableArray *modules = [NSMutableArray new];
  for (Class moduleClass in self.moduleClasses) {
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

- (id)jsBoundExtraModuleForClass:(Class)moduleClass
{
  return [self.batchedBridge jsBoundExtraModuleForClass:moduleClass];
}

- (void)reload
{
  #if ABI27_0_0RCT_ENABLE_INSPECTOR
  // Disable debugger to resume the JsVM & avoid thread locks while reloading
  [ABI27_0_0RCTInspectorDevServerHelper disableDebugger];
  #endif

  [[NSNotificationCenter defaultCenter] postNotificationName:ABI27_0_0RCTBridgeWillReloadNotification object:self];

  /**
   * Any thread
   */
  dispatch_async(dispatch_get_main_queue(), ^{
    [self invalidate];
    [self setUp];
  });
}

- (void)requestReload
{
  [self reload];
}

- (Class)bridgeClass
{
  return [ABI27_0_0RCTCxxBridge class];
}

- (void)setUp
{
  ABI27_0_0RCT_PROFILE_BEGIN_EVENT(0, @"-[ABI27_0_0RCTBridge setUp]", nil);

  _performanceLogger = [ABI27_0_0RCTPerformanceLogger new];
  [_performanceLogger markStartForTag:ABI27_0_0RCTPLBridgeStartup];
  [_performanceLogger markStartForTag:ABI27_0_0RCTPLTTI];

  Class bridgeClass = self.bridgeClass;

  #if ABI27_0_0RCT_DEV
  ABI27_0_0RCTExecuteOnMainQueue(^{
    ABI27_0_0RCTRegisterReloadCommandListener(self);
  });
  #endif

  // Only update bundleURL from delegate if delegate bundleURL has changed
  NSURL *previousDelegateURL = _delegateBundleURL;
  _delegateBundleURL = [self.delegate sourceURLForBridge:self];
  if (_delegateBundleURL && ![_delegateBundleURL isEqual:previousDelegateURL]) {
    _bundleURL = _delegateBundleURL;
  }

  // Sanitize the bundle URL
  _bundleURL = [ABI27_0_0RCTConvert NSURL:_bundleURL.absoluteString];

  self.batchedBridge = [[bridgeClass alloc] initWithParentBridge:self];
  [self.batchedBridge start];

  ABI27_0_0RCT_PROFILE_END_EVENT(ABI27_0_0RCTProfileTagAlways, @"");
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
  ABI27_0_0RCTBridge *batchedBridge = self.batchedBridge;
  self.batchedBridge = nil;

  if (batchedBridge) {
    ABI27_0_0RCTExecuteOnMainQueue(^{
      [batchedBridge invalidate];
    });
  }
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

- (void)enqueueJSCall:(NSString *)module method:(NSString *)method args:(NSArray *)args completion:(dispatch_block_t)completion
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

- (JSGlobalContextRef)jsContextRef
{
  return [self.batchedBridge jsContextRef];
}

@end
