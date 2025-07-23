// Copyright © 2018 650 Industries. All rights reserved.

#import "EXScopedModuleRegistry.h"

#import "EXScopedModuleRegistryAdapter.h"
#import "EXSensorsManagerBinding.h"
#import "EXConstantsBinding.h"
#import "EXUnversioned.h"
#import "EXScopedFontLoader.h"
#import "EXScopedSecureStore.h"
#import "EXScopedPermissions.h"
#import "EXScopedLocalAuthentication.h"
#import "EXScopedErrorRecoveryModule.h"

#import "EXScopedReactNativeAdapter.h"
#import "EXExpoUserNotificationCenterProxy.h"

#if __has_include(<EXTaskManager/EXTaskManager.h>)
#import <EXTaskManager/EXTaskManager.h>
#endif

#import <ExpoModulesCore-Swift.h>

@implementation EXScopedModuleRegistryAdapter

- (EXModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params
                  forExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                     scopeKey:(NSString *)scopeKey
                                     manifest:(EXManifestsManifest *)manifest
                           withKernelServices:(NSDictionary *)kernelServices
{
  EXModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistry];

#if __has_include(<EXConstants/EXConstantsService.h>)
  EXConstantsBinding *constantsBinding = [[EXConstantsBinding alloc] initWithParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];
#endif

if (params[@"fileSystemDirectories"]) {
  // Override the FileSystem module with custom document and cache directories
  NSString *documentDirectory = params[@"fileSystemDirectories"][@"documentDirectory"];
  NSString *cachesDirectory = params[@"fileSystemDirectories"][@"cachesDirectory"];
  NSString *applicationSupportDirectory = NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES).firstObject;
  EXFileSystemLegacyUtilities *fileSystemModule = [[EXFileSystemLegacyUtilities alloc] initWithDocumentDirectory:documentDirectory cachesDirectory:cachesDirectory applicationSupportDirectory:applicationSupportDirectory];
  
  [moduleRegistry registerInternalModule:fileSystemModule];
}

  EXScopedReactNativeAdapter *reactNativeAdapter = [[EXScopedReactNativeAdapter alloc] init];
  [moduleRegistry registerInternalModule:reactNativeAdapter];

  EXExpoUserNotificationCenterProxy *userNotificationCenter = [[EXExpoUserNotificationCenterProxy alloc] initWithUserNotificationCenter:kernelServices[EX_UNVERSIONED(@"EXUserNotificationCenter")]];
  [moduleRegistry registerInternalModule:userNotificationCenter];

#if __has_include(<ExpoModulesCore/EXPermissionsService.h>)
  EXScopedPermissions *permissionsModule = [[EXScopedPermissions alloc] initWithScopeKey:scopeKey andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:permissionsModule];
  [moduleRegistry registerInternalModule:permissionsModule];
#endif

#if __has_include(<EXTaskManager/EXTaskManager.h>)
  // TODO: Make scoped task manager when adding support for bare React Native
  EXTaskManager *taskManagerModule = [[EXTaskManager alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerInternalModule:taskManagerModule];
  [moduleRegistry registerExportedModule:taskManagerModule];
#endif

  return moduleRegistry;
}

@end
