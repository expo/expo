// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXInstallationIdProvider : UMExportedModule

- (NSString *)getInstallationId;

@end

NS_ASSUME_NONNULL_END
