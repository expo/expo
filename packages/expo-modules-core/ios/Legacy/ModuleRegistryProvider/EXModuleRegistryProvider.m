// Copyright © 2018 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXDefines.h>
#import <ExpoModulesCore/EXModuleRegistryProvider.h>
#import <ExpoModulesCore/EXSingletonModule.h>
#import <Foundation/Foundation.h>

// Forward declaration for LegacyModuleRegistry (Swift)
// This allows SPM prebuilds to use the Swift-based registry
@class EXLegacyModuleRegistry;

static dispatch_once_t onceToken;
static NSMutableSet<Class> *EXModuleClasses;
static NSMutableSet<Class> *EXSingletonModuleClasses;

// Helper to get the Swift LegacyModuleRegistry if available
static id EXGetLegacyModuleRegistry(void) {
  static id legacyRegistry = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class legacyRegistryClass = NSClassFromString(@"EXLegacyModuleRegistry");
    if (legacyRegistryClass) {
      SEL sharedSelector = NSSelectorFromString(@"shared");
      if ([legacyRegistryClass respondsToSelector:sharedSelector]) {
        legacyRegistry = [legacyRegistryClass performSelector:sharedSelector];
      }
    }
  });
  return legacyRegistry;
}

void (^EXinitializeGlobalModulesRegistry)(void) = ^{
  EXModuleClasses = [NSMutableSet set];
  EXSingletonModuleClasses = [NSMutableSet set];

  // Also add temporary Swift modules from core
  [EXModuleClasses addObject:NSClassFromString(@"EXFileSystemLegacyUtilities")];
};

EX_EXTERN_C_BEGIN

__attribute__((visibility("default"))) void
EXRegisterModule(Class moduleClass) {
  // First try to register with Swift LegacyModuleRegistry (for SPM prebuilds)
  id legacyRegistry = EXGetLegacyModuleRegistry();
  if (legacyRegistry) {
    SEL registerSelector = NSSelectorFromString(@"registerModule:");
    if ([legacyRegistry respondsToSelector:registerSelector]) {
      [legacyRegistry performSelector:registerSelector withObject:moduleClass];
      return;
    }
  }
  // Fall back to local ObjC storage (for CocoaPods source builds)
  dispatch_once(&onceToken, EXinitializeGlobalModulesRegistry);
  [EXModuleClasses addObject:moduleClass];
}

__attribute__((visibility("default"))) void
EXRegisterSingletonModule(Class singletonModuleClass) {
  // First try to register with Swift LegacyModuleRegistry (for SPM prebuilds)
  id legacyRegistry = EXGetLegacyModuleRegistry();
  if (legacyRegistry) {
    SEL registerSelector = NSSelectorFromString(@"registerSingletonModule:");
    if ([legacyRegistry respondsToSelector:registerSelector]) {
      [legacyRegistry performSelector:registerSelector
                           withObject:singletonModuleClass];
      return;
    }
  }
  // Fall back to local ObjC storage (for CocoaPods source builds)
  dispatch_once(&onceToken, EXinitializeGlobalModulesRegistry);

  // A heuristic solution to "multiple singletons registering
  // to the same name" problem. Usually it happens when we want to
  // override module singleton with an ExpoKit one. This solution
  // gives preference to subclasses.

  // If a superclass of a registering singleton is already registered
  // we want to remove it in favor of the registering singleton.
  Class superClass = [singletonModuleClass superclass];
  while (superClass != [NSObject class]) {
    [EXSingletonModuleClasses removeObject:superClass];
    superClass = [superClass superclass];
  }

  // If a registering singleton is a superclass of an already registered
  // singleton, we don't register it.
  for (Class registeredClass in EXSingletonModuleClasses) {
    if ([singletonModuleClass isSubclassOfClass:registeredClass]) {
      return;
    }
  }

  [EXSingletonModuleClasses addObject:singletonModuleClass];
}

EX_EXTERN_C_END

// Singleton modules classes register in EXSingletonModuleClasses
// with EXRegisterSingletonModule function. Then they should be
// initialized exactly once (onceSingletonModulesToken guards that).

static dispatch_once_t onceSingletonModulesToken;
static NSMutableSet<EXSingletonModule *> *EXSingletonModules;
void (^EXinitializeGlobalSingletonModulesSet)(void) = ^{
  EXSingletonModules = [NSMutableSet set];
  for (Class singletonModuleClass in EXSingletonModuleClasses) {
    [EXSingletonModules addObject:[[singletonModuleClass alloc] init]];
  }
};

@interface EXModuleRegistryProvider ()

@property(nonatomic, strong) NSSet *singletonModules;

@end

@implementation EXModuleRegistryProvider

- (instancetype)init {
  return [self
      initWithSingletonModules:[EXModuleRegistryProvider singletonModules]];
}

- (instancetype)initWithSingletonModules:(NSSet *)modules {
  if (self = [super init]) {
    _singletonModules = [NSSet setWithSet:modules];
  }
  return self;
}

+ (NSSet<Class> *)getModulesClasses {
  // First check if LegacyModuleRegistry (Swift) has registered modules
  // This is used for SPM prebuilds where modules register via @_cdecl functions
  id legacyRegistry = EXGetLegacyModuleRegistry();
  if (legacyRegistry) {
    SEL getModulesSelector = NSSelectorFromString(@"getModuleClasses");
    if ([legacyRegistry respondsToSelector:getModulesSelector]) {
      NSSet *swiftModules = [legacyRegistry performSelector:getModulesSelector];
      if (swiftModules.count > 0) {
        return swiftModules;
      }
    }
  }
  // Fall back to static ObjC storage (used when building from source with
  // CocoaPods)
  return EXModuleClasses;
}

+ (NSSet<EXSingletonModule *> *)singletonModules {
  // First check if LegacyModuleRegistry (Swift) has registered singletons
  id legacyRegistry = EXGetLegacyModuleRegistry();
  if (legacyRegistry) {
    SEL getSingletonsSelector = NSSelectorFromString(@"getSingletonModules");
    if ([legacyRegistry respondsToSelector:getSingletonsSelector]) {
      NSSet *swiftSingletons =
          [legacyRegistry performSelector:getSingletonsSelector];
      if (swiftSingletons.count > 0) {
        return swiftSingletons;
      }
    }
  }
  // Fall back to static ObjC storage (used when building from source with
  // CocoaPods)
  dispatch_once(&onceSingletonModulesToken,
                EXinitializeGlobalSingletonModulesSet);
  return EXSingletonModules;
}

+ (nullable EXSingletonModule *)getSingletonModuleForClass:
    (Class)singletonClass {
  NSSet<EXSingletonModule *> *singletonModules = [self singletonModules];

  for (EXSingletonModule *singleton in singletonModules) {
    if ([singleton isKindOfClass:singletonClass]) {
      return singleton;
    }
  }
  return nil;
}

- (EXModuleRegistry *)moduleRegistry {
  NSMutableSet<id<EXInternalModule>> *internalModules = [NSMutableSet set];
  NSMutableSet<EXExportedModule *> *exportedModules = [NSMutableSet set];

  for (Class klass in [self.class getModulesClasses]) {
    if (![klass conformsToProtocol:@protocol(EXInternalModule)]) {
      EXLogWarn(@"Registered class `%@` does not conform to the "
                @"`EXInternalModule` protocol.",
                [klass description]);
      continue;
    }

    id<EXInternalModule> instance = [self createModuleInstance:klass];

    if ([[instance class] exportedInterfaces] != nil &&
        [[[instance class] exportedInterfaces] count] > 0) {
      [internalModules addObject:instance];
    }

    if ([instance isKindOfClass:[EXExportedModule class]]) {
      [exportedModules addObject:(EXExportedModule *)instance];
    }
  }

  EXModuleRegistry *moduleRegistry =
      [[EXModuleRegistry alloc] initWithInternalModules:internalModules
                                        exportedModules:exportedModules
                                       singletonModules:_singletonModules];
  [moduleRegistry setDelegate:_moduleRegistryDelegate];
  return moduleRegistry;
}

#pragma mark - Utilities

- (id<EXInternalModule>)createModuleInstance:(Class)moduleClass {
  return [[moduleClass alloc] init];
}

@end
