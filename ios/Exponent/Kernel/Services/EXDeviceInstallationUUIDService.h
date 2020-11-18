// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXScopedInstallationIdProvider.h"
#import "EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

// A kernel service allowing modules to access device installation UUID
@interface EXDeviceInstallationUUIDService : NSObject <EXDeviceInstallationUUIDManager, EXConstantsDeviceInstallationUUIDManager>

@end

NS_ASSUME_NONNULL_END
