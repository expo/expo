// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXExportedModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryConsumer.h>

// Background fetch result
typedef NS_ENUM(NSUInteger, ABI49_0_0EXBackgroundFetchResult) {
  ABI49_0_0EXBackgroundFetchResultNoData = 1,
  ABI49_0_0EXBackgroundFetchResultNewData = 2,
  ABI49_0_0EXBackgroundFetchResultFailed = 3,
};

// Background fetch status
typedef NS_ENUM(NSUInteger, ABI49_0_0EXBackgroundFetchStatus) {
  ABI49_0_0EXBackgroundFetchStatusDenied = 1,
  ABI49_0_0EXBackgroundFetchStatusRestricted = 2,
  ABI49_0_0EXBackgroundFetchStatusAvailable = 3,
};

@interface ABI49_0_0EXBackgroundFetch : ABI49_0_0EXExportedModule <ABI49_0_0EXModuleRegistryConsumer>

@end
