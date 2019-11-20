// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMCore/ABI36_0_0UMExportedModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>

// Background fetch result
typedef NS_ENUM(NSUInteger, ABI36_0_0EXBackgroundFetchResult) {
  ABI36_0_0EXBackgroundFetchResultNoData = 1,
  ABI36_0_0EXBackgroundFetchResultNewData = 2,
  ABI36_0_0EXBackgroundFetchResultFailed = 3,
};

// Background fetch status
typedef NS_ENUM(NSUInteger, ABI36_0_0EXBackgroundFetchStatus) {
  ABI36_0_0EXBackgroundFetchStatusDenied = 1,
  ABI36_0_0EXBackgroundFetchStatusRestricted = 2,
  ABI36_0_0EXBackgroundFetchStatusAvailable = 3,
};

@interface ABI36_0_0EXBackgroundFetch : ABI36_0_0UMExportedModule <ABI36_0_0UMModuleRegistryConsumer>

@end
