// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelAppRecord.h"

#import "Expo_Go-Swift.h"

@class EXManifestsManifest;

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXUpdatesAppRelaunchCompletionBlock)(BOOL success);

@interface EXUpdatesManager : NSObject <EXUpdatesBindingDelegate>

- (void)notifyApp:(EXKernelAppRecord *)appRecord
ofDownloadWithManifest:(EXManifestsManifest * _Nullable)manifest
            isNew:(BOOL)isBundleNew
            error:(NSError * _Nullable)error;

@end

NS_ASSUME_NONNULL_END
