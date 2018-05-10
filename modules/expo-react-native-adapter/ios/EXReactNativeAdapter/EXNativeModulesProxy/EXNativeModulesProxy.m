// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXReactNativeAdapter/EXNativeModulesProxy.h>
#import <objc/runtime.h>
#import <React/RCTLog.h>
#import <EXReactNativeAdapter/EXReactNativeAdapter.h>
#import <EXCore/EXEventEmitter.h>
#import <EXCore/EXViewManager.h>
#import <EXReactNativeAdapter/EXViewManagerAdapter.h>
#import <EXReactNativeAdapter/EXViewManagerAdapterClassesRegistry.h>

static const NSString *exportedMethodsNamesKeyPath = @"exportedMethods";
static const NSString *exportedConstantsKeyPath = @"modulesConstants";

@interface EXNativeModulesProxy ()

@property (nonatomic, strong) NSRegularExpression *regexp;
@property (nonatomic, strong) EXModuleRegistry *moduleRegistry;

@end

@implementation EXNativeModulesProxy

- (instancetype)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _moduleRegistry = moduleRegistry;
  }
  return self;
}

# pragma mark - React API

RCT_EXPORT_MODULE(ExpoNativeModuleProxy);

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSDictionary *)constantsToExport
{
  NSMutableDictionary <NSString *, id> *exportedModulesConstants = [NSMutableDictionary dictionary];
  // Grab all the constants exported by modules
  for (EXExportedModule *exportedModule in [_moduleRegistry getAllExportedModules]) {
    exportedModulesConstants[[[exportedModule class] exportedModuleName]] = [exportedModule constantsToExport];
  }
  
  // Also add `exportedMethodsNames`
  NSMutableDictionary<const NSString *, NSMutableDictionary<NSString *, id> *> *exportedMethodsNamesAccumulator = [NSMutableDictionary dictionary];
  for (EXExportedModule *exportedModule in [_moduleRegistry getAllExportedModules]) {
    const NSString *exportedModuleName = [[exportedModule class] exportedModuleName];
    exportedMethodsNamesAccumulator[exportedModuleName] = [NSMutableDictionary dictionary];
    [[exportedModule getExportedMethods] enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull exportedName, NSString * _Nonnull selectorName, BOOL * _Nonnull stop) {
      exportedMethodsNamesAccumulator[exportedModuleName][exportedName] = @{
                                                                            // - 3 is for resolver and rejecter of the promise and the last, empty component
                                                                            @"argumentsCount": @([[selectorName componentsSeparatedByString:@":"] count] - 3)
                                                                            };
    }];
  }
  
  NSMutableDictionary <NSString *, id> *constantsAccumulator = [NSMutableDictionary dictionary];
  constantsAccumulator[exportedConstantsKeyPath] = exportedModulesConstants;
  constantsAccumulator[exportedMethodsNamesKeyPath] = exportedMethodsNamesAccumulator;
  
  return constantsAccumulator;
}

RCT_EXPORT_METHOD(callMethod:(NSString *)moduleName methodName:(NSString *)methodName arguments:(NSArray *)arguments resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  EXExportedModule *module = [_moduleRegistry getExportedModuleForName:moduleName];
  if (module == nil) {
    NSString *reason = [NSString stringWithFormat:@"No exported module was found for name '%@'. Are you sure all the packages are linked correctly?", moduleName];
    reject(@"E_NO_MODULE", reason, nil);
    return;
  }
  
  [module callExportedMethod:methodName withArguments:arguments resolver:resolve rejecter:reject];
}

@end
