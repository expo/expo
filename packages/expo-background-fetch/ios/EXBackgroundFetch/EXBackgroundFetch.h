// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>

// Background fetch result
typedef NS_ENUM(NSUInteger, EXBackgroundFetchResult) {
  EXBackgroundFetchResultNoData = 1,
  EXBackgroundFetchResultNewData = 2,
  EXBackgroundFetchResultFailed = 3,
};

// Background fetch status
typedef NS_ENUM(NSUInteger, EXBackgroundFetchStatus) {
  EXBackgroundFetchStatusDenied = 1,
  EXBackgroundFetchStatusRestricted = 2,
  EXBackgroundFetchStatusAvailable = 3,
};

@interface EXBackgroundFetch : UMExportedModule <UMModuleRegistryConsumer>

@end
