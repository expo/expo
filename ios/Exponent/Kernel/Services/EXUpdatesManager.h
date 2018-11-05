// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelAppRecord.h"
#import "EXUpdates.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesManager : NSObject <EXUpdatesScopedModuleDelegate>

- (void)notifyApp:(EXKernelAppRecord *)appRecord
ofDownloadWithManifest:(NSDictionary * _Nullable)manifest
            isNew:(BOOL)isBundleNew
            error:(NSError * _Nullable)error;

@end

NS_ASSUME_NONNULL_END
