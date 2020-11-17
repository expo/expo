// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXScopedInstallationIdProvider.h"
#import "EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

// A kernel service allowing modules to access device install UUID
@interface EXDeviceInstallUUIDService : NSObject <EXDeviceInstallUUIDManager, EXConstantsDeviceInstallUUIDManager>

@end

NS_ASSUME_NONNULL_END
