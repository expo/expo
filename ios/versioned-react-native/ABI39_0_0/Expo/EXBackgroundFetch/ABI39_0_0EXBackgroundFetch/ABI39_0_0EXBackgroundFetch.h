// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>

// Background fetch result
typedef NS_ENUM(NSUInteger, ABI39_0_0EXBackgroundFetchResult) {
  ABI39_0_0EXBackgroundFetchResultNoData = 1,
  ABI39_0_0EXBackgroundFetchResultNewData = 2,
  ABI39_0_0EXBackgroundFetchResultFailed = 3,
};

// Background fetch status
typedef NS_ENUM(NSUInteger, ABI39_0_0EXBackgroundFetchStatus) {
  ABI39_0_0EXBackgroundFetchStatusDenied = 1,
  ABI39_0_0EXBackgroundFetchStatusRestricted = 2,
  ABI39_0_0EXBackgroundFetchStatusAvailable = 3,
};

@interface ABI39_0_0EXBackgroundFetch : ABI39_0_0UMExportedModule <ABI39_0_0UMModuleRegistryConsumer>

@end
