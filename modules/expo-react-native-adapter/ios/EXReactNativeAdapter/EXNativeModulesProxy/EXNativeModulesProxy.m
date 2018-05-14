// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXReactNativeAdapter/EXNativeModulesProxy.h>
#import <objc/runtime.h>
#import <React/RCTLog.h>
#import <EXReactNativeAdapter/EXReactNativeAdapter.h>
#import <EXReactNativeAdapter/EXNativeModulesProxy+Modules.h>
#import <EXCore/EXModule.h>
#import <EXCore/EXViewManager.h>
#import <EXReactNativeAdapter/EXViewManagerAdapterClassesRegistry.h>

static const NSString *exportedMethodsNamesKeyPath = @"exportedMethodsNames";
static const NSRegularExpression *selectorRegularExpression = nil;
static dispatch_once_t selectorRegularExpressionOnceToken = 0;

@interface EXNativeModulesProxy ()

@property (nonatomic, strong) NSRegularExpression *regexp;
@property (nonatomic, strong) EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong) NSDictionary<NSString *, NSDictionary<NSString *, NSString *> *> *exportedMethods;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSNumber *> *modulesListenersCounts;

@end

@implementation EXNativeModulesProxy

- (instancetype)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    // Initialize selector regular expression
    dispatch_once(&selectorRegularExpressionOnceToken, ^{
      selectorRegularExpression = [NSRegularExpression regularExpressionWithPattern:@"\\(.+?\\).+?\\b\\s*" options:NSRegularExpressionCaseInsensitive error:nil];
    });

    _moduleRegistry = moduleRegistry;
    _modulesListenersCounts = [NSMutableDictionary dictionary];

    NSMutableDictionary *exportedMethodsAccumulator = [NSMutableDictionary dictionary];
    for (id<EXModule> module in [_moduleRegistry getAllModules]) {
      // Set NativeModuleProxy for EXReactNativeAdapter
      if ([module isKindOfClass:[EXReactNativeAdapter self]]) {
        EXReactNativeAdapter *adapter = (EXReactNativeAdapter *)module;
        [adapter setNativeModulesProxy:self];
      }

      // Set exported methods
      if ([self isModuleExportable:module]) {
        NSArray<NSDictionary *> *methodInfos = [self getExportedMethodsOfModule:module];
        NSMutableDictionary<NSString *, NSString *> *moduleExportedMethods = [NSMutableDictionary dictionary];
        for (NSDictionary *methodInfo in methodInfos) {
          // `objcName` constains a method declaration string
          // (eg. `doSth:(NSString *)string options:(NSDictionary *)options`)
          // We only need a selector string  (eg. `doSth:options:`)
          NSString *selectorName = [self selectorNameFromName:methodInfo[EXObjcMethodNameKeyPath]];
          moduleExportedMethods[methodInfo[EXJsMethodNameKeyPath]] = selectorName;
        }
        exportedMethodsAccumulator[[[module class] moduleName]] = moduleExportedMethods;
      }
    }
    _exportedMethods = exportedMethodsAccumulator;
  }
  return self;
}

# pragma mark - Public API

- (NSArray <id<RCTBridgeModule>> *)getBridgeModules
{
  NSArray<id> *allModules = [_moduleRegistry getAllModules];
  NSMutableArray<id<RCTBridgeModule>> *reactModules = [NSMutableArray array];
  [allModules enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
    // Escape hatch for modules that have to depend on React Native
    if ([obj conformsToProtocol:@protocol(RCTBridgeModule)]) {
      [reactModules addObject:obj];
    }
    
    if ([obj conformsToProtocol:@protocol(EXViewManager)]) {
      Class viewManagerAdapterClass = [[EXViewManagerAdapterClassesRegistry sharedInstance] viewManagerAdapterClassForViewManager:obj];
      [reactModules addObject:[[viewManagerAdapterClass alloc] initWithViewManager:obj]];
    }
  }];
  // Silence React Native warning `Base module "%s" does not exist`
  // occurring when view manager class is subclassing another class
  // that is not RCTViewManager (in our case all the view manager adapters
  // subclass EXViewManagerAdapter, so RN expects to find EXViewManagerAdapter
  // exported.
  [reactModules addObject:[[EXViewManagerAdapter alloc] init]];
  return reactModules;
}

# pragma mark - React API

RCT_EXPORT_MODULE(ExpoNativeModuleProxy);

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSDictionary *)constantsToExport
{
  NSMutableDictionary <NSString *, id> *constantsAccumulator = [NSMutableDictionary dictionary];
  // Grab all the constants exported by modules
  for (id<EXModule> module in [_moduleRegistry getAllModules]) {
    if ([self isModuleExportable:module]) {
      constantsAccumulator[[[module class] moduleName]] = [self getExportedConstantsOfModule:module];
    }
  }

  // Also add `exportedMethodsNames`
  NSMutableDictionary<NSString *, NSArray<NSString *> *> *exportedMethodsNamesAccumulator = [NSMutableDictionary dictionary];
  for (NSString *moduleName in [_exportedMethods allKeys]) {
    exportedMethodsNamesAccumulator[moduleName] = [_exportedMethods[moduleName] allKeys];
  }
  constantsAccumulator[exportedMethodsNamesKeyPath] = exportedMethodsNamesAccumulator;

  return constantsAccumulator;
}

- (NSArray<NSString *> *)supportedEvents
{
  NSMutableArray<NSString *> *eventsAccumulator = [NSMutableArray array];
  for (id<EXModule> module in [self.moduleRegistry getAllModules]) {
    NSArray<NSString *> *moduleEvents = [self getSupportedEventsOfModule:module];
    if (moduleEvents == nil) {
      continue;
    }
    [eventsAccumulator addObjectsFromArray:moduleEvents];
  }
  return eventsAccumulator;
}

RCT_EXPORT_METHOD(addProxiedListener:(NSString *)moduleName eventName:(NSString *)eventName)
{
  [self addListener:eventName];
  id module = [self.moduleRegistry getExportedModuleForName:moduleName];
  
  if (RCT_DEBUG && module == nil) {
    RCTLogError(@"Module for name `%@` have not been found.", moduleName);
    return;
  }
  
  if (RCT_DEBUG && ![module respondsToSelector:@selector(supportedEvents)]) {
    EXLogError(@"Module `%@` does not emit events, thus it cannot be subscribed to.", moduleName);
  } else if (RCT_DEBUG && ![[module supportedEvents] containsObject:eventName]) {
    EXLogError(@"`%@` is not a supported event type for %@. Supported events are: `%@`",
                eventName, [module class], [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }
  
  NSNumber *listenersCountNumber = _modulesListenersCounts[moduleName];
  int listenersCount = 0;
  if (listenersCountNumber != nil) {
    listenersCount = [listenersCountNumber intValue];
  }
  
  listenersCount++;
  if (listenersCount == 1) {
    [self startObserving];
  }
  
  _modulesListenersCounts[moduleName] = [NSNumber numberWithInt:listenersCount];
}

RCT_EXPORT_METHOD(removeProxiedListeners:(NSString *)moduleName count:(double)count)
{
  [self removeListeners:count];
  NSNumber *listenersCountNumber = _modulesListenersCounts[moduleName];
  int listenersCount = 0;
  if (listenersCountNumber != nil) {
    listenersCount = [listenersCountNumber intValue];
  }
  
  int currentCount = (int)count;
  if (RCT_DEBUG && currentCount > listenersCount) {
    EXLogError(@"Attempted to remove more %@ listeners than added", [self class]);
  }
  listenersCount = MAX(listenersCount - currentCount, 0);
  if (listenersCount == 0) {
    [self stopObserving];
  }
  
  _modulesListenersCounts[moduleName] = [NSNumber numberWithInt:listenersCount];
}

# pragma mark - Utilities

- (NSString *)selectorNameFromName:(NSString *)nameString
{
  return [selectorRegularExpression stringByReplacingMatchesInString:nameString options:0 range:NSMakeRange(0, [nameString length]) withTemplate:@""];
}

@end
