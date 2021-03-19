// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>

// Background fetch result
typedef NS_ENUM(NSUInteger, ABI41_0_0EXBackgroundFetchResult) {
  ABI41_0_0EXBackgroundFetchResultNoData = 1,
  ABI41_0_0EXBackgroundFetchResultNewData = 2,
  ABI41_0_0EXBackgroundFetchResultFailed = 3,
};

// Background fetch status
typedef NS_ENUM(NSUInteger, ABI41_0_0EXBackgroundFetchStatus) {
  ABI41_0_0EXBackgroundFetchStatusDenied = 1,
  ABI41_0_0EXBackgroundFetchStatusRestricted = 2,
  ABI41_0_0EXBackgroundFetchStatusAvailable = 3,
};

@interface ABI41_0_0EXBackgroundFetch : ABI41_0_0UMExportedModule <ABI41_0_0UMModuleRegistryConsumer>

@end
