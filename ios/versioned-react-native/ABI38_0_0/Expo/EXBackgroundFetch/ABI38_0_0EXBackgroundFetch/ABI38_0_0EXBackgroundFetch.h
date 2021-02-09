// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>

// Background fetch result
typedef NS_ENUM(NSUInteger, ABI38_0_0EXBackgroundFetchResult) {
  ABI38_0_0EXBackgroundFetchResultNoData = 1,
  ABI38_0_0EXBackgroundFetchResultNewData = 2,
  ABI38_0_0EXBackgroundFetchResultFailed = 3,
};

// Background fetch status
typedef NS_ENUM(NSUInteger, ABI38_0_0EXBackgroundFetchStatus) {
  ABI38_0_0EXBackgroundFetchStatusDenied = 1,
  ABI38_0_0EXBackgroundFetchStatusRestricted = 2,
  ABI38_0_0EXBackgroundFetchStatusAvailable = 3,
};

@interface ABI38_0_0EXBackgroundFetch : ABI38_0_0UMExportedModule <ABI38_0_0UMModuleRegistryConsumer>

@end
