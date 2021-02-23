// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>

// Background fetch result
typedef NS_ENUM(NSUInteger, ABI40_0_0EXBackgroundFetchResult) {
  ABI40_0_0EXBackgroundFetchResultNoData = 1,
  ABI40_0_0EXBackgroundFetchResultNewData = 2,
  ABI40_0_0EXBackgroundFetchResultFailed = 3,
};

// Background fetch status
typedef NS_ENUM(NSUInteger, ABI40_0_0EXBackgroundFetchStatus) {
  ABI40_0_0EXBackgroundFetchStatusDenied = 1,
  ABI40_0_0EXBackgroundFetchStatusRestricted = 2,
  ABI40_0_0EXBackgroundFetchStatusAvailable = 3,
};

@interface ABI40_0_0EXBackgroundFetch : ABI40_0_0UMExportedModule <ABI40_0_0UMModuleRegistryConsumer>

@end
