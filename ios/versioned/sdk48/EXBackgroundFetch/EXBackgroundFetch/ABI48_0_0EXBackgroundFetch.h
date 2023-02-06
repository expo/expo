// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXExportedModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryConsumer.h>

// Background fetch result
typedef NS_ENUM(NSUInteger, ABI48_0_0EXBackgroundFetchResult) {
  ABI48_0_0EXBackgroundFetchResultNoData = 1,
  ABI48_0_0EXBackgroundFetchResultNewData = 2,
  ABI48_0_0EXBackgroundFetchResultFailed = 3,
};

// Background fetch status
typedef NS_ENUM(NSUInteger, ABI48_0_0EXBackgroundFetchStatus) {
  ABI48_0_0EXBackgroundFetchStatusDenied = 1,
  ABI48_0_0EXBackgroundFetchStatusRestricted = 2,
  ABI48_0_0EXBackgroundFetchStatusAvailable = 3,
};

@interface ABI48_0_0EXBackgroundFetch : ABI48_0_0EXExportedModule <ABI48_0_0EXModuleRegistryConsumer>

@end
