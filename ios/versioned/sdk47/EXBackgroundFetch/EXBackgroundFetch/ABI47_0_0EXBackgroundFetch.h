// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXExportedModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryConsumer.h>

// Background fetch result
typedef NS_ENUM(NSUInteger, ABI47_0_0EXBackgroundFetchResult) {
  ABI47_0_0EXBackgroundFetchResultNoData = 1,
  ABI47_0_0EXBackgroundFetchResultNewData = 2,
  ABI47_0_0EXBackgroundFetchResultFailed = 3,
};

// Background fetch status
typedef NS_ENUM(NSUInteger, ABI47_0_0EXBackgroundFetchStatus) {
  ABI47_0_0EXBackgroundFetchStatusDenied = 1,
  ABI47_0_0EXBackgroundFetchStatusRestricted = 2,
  ABI47_0_0EXBackgroundFetchStatusAvailable = 3,
};

@interface ABI47_0_0EXBackgroundFetch : ABI47_0_0EXExportedModule <ABI47_0_0EXModuleRegistryConsumer>

@end
