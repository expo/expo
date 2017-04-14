/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0RCTBridge.h"
#import "ABI16_0_0RCTBridge+Private.h"

#import <objc/runtime.h>

#import "ABI16_0_0RCTConvert.h"
#import "ABI16_0_0RCTEventDispatcher.h"
#import "ABI16_0_0RCTLog.h"
#import "ABI16_0_0RCTModuleData.h"
#import "ABI16_0_0RCTPerformanceLogger.h"
#import "ABI16_0_0RCTProfile.h"
#import "ABI16_0_0RCTReloadCommand.h"
#import "ABI16_0_0RCTUtils.h"

NSString *const ABI16_0_0RCTJavaScriptWillStartLoadingNotification = @"ABI16_0_0RCTJavaScriptWillStartLoadingNotification";
NSString *const ABI16_0_0RCTJavaScriptDidLoadNotification = @"ABI16_0_0RCTJavaScriptDidLoadNotification";
NSString *const ABI16_0_0RCTJavaScriptDidFailToLoadNotification = @"ABI16_0_0RCTJavaScriptDidFailToLoadNotification";
NSString *const ABI16_0_0RCTDidInitializeModuleNotification = @"ABI16_0_0RCTDidInitializeModuleNotification";

static NSMutableArray<Class> *ABI16_0_0RCTModuleClasses;
NSArray<Class> *ABI16_0_0RCTGetModuleClasses(void)
{
  return ABI16_0_0RCTModuleClasses;
}

void ABI16_0_0RCTFBQuickPerformanceLoggerConfigureHooks(__unused JSGlobalContextRef ctx) { }

/**
 * Register the given class as a bridge module. All modules must be registered
 * prior to the first bridge initialization.
 */
void ABI16_0_0RCTRegisterModule(Class);
void ABI16_0_0RCTRegisterModule(Class moduleClass)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    ABI16_0_0RCTModuleClasses = [NSMutableArray new];
  });

  ABI16_0_0RCTAssert([moduleClass conformsToProtocol:@protocol(ABI16_0_0RCTBridgeModule)],
            @"%@ does not conform to the ABI16_0_0RCTBridgeModule protocol",
            moduleClass);

  // Register module
  [ABI16_0_0RCTModuleClasses addObject:moduleClass];
}

/**
 * This function returns the module name for a given class.
 */
NSString *ABI16_0_0RCTBridgeModuleNameForClass(Class cls)
{
#if ABI16_0_0RCT_DEBUG
  ABI16_0_0RCTAssert([cls conformsToProtocol:@protocol(ABI16_0_0RCTBridgeModule)],
            @"Bridge module `%@` does not conform to ABI16_0_0RCTBridgeModule", cls);
#endif

  NSString *name = [cls moduleName];
  if (name.length == 0) {
    name = NSStringFromClass(cls);
  }

  name = ABI16_0_0EX_REMOVE_VERSION(name);

  if ([name hasPrefix:@"RK"]) {
    name = [name substringFromIndex:2];
  } else if ([name hasPrefix:@"RCT"]) {
    name = [name substringFromIndex:3];
  }

  return name;
}

#if ABI16_0_0RCT_DEBUG
void ABI16_0_0RCTVerifyAllModulesExported(NSArray *extraModules)
{
  // Check for unexported modules
  unsigned int classCount;
  Class *classes = objc_copyClassList(&classCount);

  NSMutableSet *moduleClasses = [NSMutableSet new];
  [moduleClasses addObjectsFromArray:ABI16_0_0RCTGetModuleClasses()];
  [moduleClasses addObjectsFromArray:[extraModules valueForKeyPath:@"class"]];

  for (unsigned int i = 0; i < classCount; i++) {
    Class cls = classes[i];
    Class superclass = cls;
    while (superclass) {
      if (class_conformsToProtocol(superclass, @protocol(ABI16_0_0RCTBridgeModule))) {
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

        ABI16_0_0RCTLogWarn(@"Class %@ was not exported. Did you forget to use ABI16_0_0RCT_EXPORT_MODULE()?", cls);
        break;
      }
      superclass = class_getSuperclass(superclass);
    }
  }

  free(classes);
}
#endif

@interface ABI16_0_0RCTBridge () <ABI16_0_0RCTReloadListener>
@end

@implementation ABI16_0_0RCTBridge
{
  NSURL *_delegateBundleURL;
}

dispatch_queue_t ABI16_0_0RCTJSThread;

+ (void)initialize
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{

    // Set up JS thread
    ABI16_0_0RCTJSThread = (id)kCFNull;
  });
}

static ABI16_0_0RCTBridge *ABI16_0_0RCTCurrentBridgeInstance = nil;

/**
 * The last current active bridge instance. This is set automatically whenever
 * the bridge is accessed. It can be useful for static functions or singletons
 * that need to access the bridge for purposes such as logging, but should not
 * be relied upon to return any particular instance, due to race conditions.
 */
+ (instancetype)currentBridge
{
  return ABI16_0_0RCTCurrentBridgeInstance;
}

+ (void)setCurrentBridge:(ABI16_0_0RCTBridge *)currentBridge
{
  ABI16_0_0RCTCurrentBridgeInstance = currentBridge;
}

- (instancetype)initWithDelegate:(id<ABI16_0_0RCTBridgeDelegate>)delegate
                   launchOptions:(NSDictionary *)launchOptions
{
  return [self initWithDelegate:delegate
                      bundleURL:nil
                 moduleProvider:nil
                  launchOptions:launchOptions];
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   moduleProvider:(ABI16_0_0RCTBridgeModuleProviderBlock)block
                    launchOptions:(NSDictionary *)launchOptions
{
  return [self initWithDelegate:nil
                      bundleURL:bundleURL
                 moduleProvider:block
                  launchOptions:launchOptions];
}

- (instancetype)initWithDelegate:(id<ABI16_0_0RCTBridgeDelegate>)delegate
                       bundleURL:(NSURL *)bundleURL
                  moduleProvider:(ABI16_0_0RCTBridgeModuleProviderBlock)block
                   launchOptions:(NSDictionary *)launchOptions
{
  if (self = [super init]) {
    _delegate = delegate;
    _bundleURL = bundleURL;
    _moduleProvider = block;
    _launchOptions = [launchOptions copy];

    [self setUp];

    ABI16_0_0RCTExecuteOnMainQueue(^{ [self bindKeys]; });
  }
  return self;
}

ABI16_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)dealloc
{
  /**
   * This runs only on the main thread, but crashes the subclass
   * ABI16_0_0RCTAssertMainQueue();
   */
  [self invalidate];
}

- (void)bindKeys
{
  ABI16_0_0RCTAssertMainQueue();

#if TARGET_IPHONE_SIMULATOR
  ABI16_0_0RCTRegisterReloadCommandListener(self);
#endif
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
  return [self moduleForName:ABI16_0_0RCTBridgeModuleNameForClass(moduleClass)];
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

- (void)whitelistedModulesDidChange
{
  [self.batchedBridge whitelistedModulesDidChange];
}

- (void)reload
{
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

- (void)setUp
{
  ABI16_0_0RCT_PROFILE_BEGIN_EVENT(0, @"-[ABI16_0_0RCTBridge setUp]", nil);

  _performanceLogger = [ABI16_0_0RCTPerformanceLogger new];
  [_performanceLogger markStartForTag:ABI16_0_0RCTPLBridgeStartup];
  [_performanceLogger markStartForTag:ABI16_0_0RCTPLTTI];

  // Only update bundleURL from delegate if delegate bundleURL has changed
  NSURL *previousDelegateURL = _delegateBundleURL;
  _delegateBundleURL = [self.delegate sourceURLForBridge:self];
  if (_delegateBundleURL && ![_delegateBundleURL isEqual:previousDelegateURL]) {
    _bundleURL = _delegateBundleURL;
  }

  // Sanitize the bundle URL
  _bundleURL = [ABI16_0_0RCTConvert NSURL:_bundleURL.absoluteString];

  [self createBatchedBridge];
  [self.batchedBridge start];

  ABI16_0_0RCT_PROFILE_END_EVENT(ABI16_0_0RCTProfileTagAlways, @"");
}

- (void)createBatchedBridge
{
  self.batchedBridge = [[ABI16_0_0RCTBatchedBridge alloc] initWithParentBridge:self];
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
  ABI16_0_0RCTBridge *batchedBridge = self.batchedBridge;
  self.batchedBridge = nil;

  if (batchedBridge) {
    ABI16_0_0RCTExecuteOnMainQueue(^{
      [batchedBridge invalidate];
    });
  }
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

- (JSValue *)callFunctionOnModule:(NSString *)module
                           method:(NSString *)method
                        arguments:(NSArray *)arguments
                            error:(NSError **)error
{
  return [self.batchedBridge callFunctionOnModule:module method:method arguments:arguments error:error];
}


@end
