// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>

// Background fetch result
typedef NS_ENUM(NSUInteger, ABI44_0_0EXBackgroundFetchResult) {
  ABI44_0_0EXBackgroundFetchResultNoData = 1,
  ABI44_0_0EXBackgroundFetchResultNewData = 2,
  ABI44_0_0EXBackgroundFetchResultFailed = 3,
};

// Background fetch status
typedef NS_ENUM(NSUInteger, ABI44_0_0EXBackgroundFetchStatus) {
  ABI44_0_0EXBackgroundFetchStatusDenied = 1,
  ABI44_0_0EXBackgroundFetchStatusRestricted = 2,
  ABI44_0_0EXBackgroundFetchStatusAvailable = 3,
};

@interface ABI44_0_0EXBackgroundFetch : ABI44_0_0EXExportedModule <ABI44_0_0EXModuleRegistryConsumer>

@end
