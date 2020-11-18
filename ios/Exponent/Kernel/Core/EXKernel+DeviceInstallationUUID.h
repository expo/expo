// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXKernel (DeviceInstallationUUID)

/**
 *  An ID that uniquely identifies this installation of Expo Go
 */
+ (NSString *)deviceInstallationUUID __attribute((deprecated("The installation ID API is deprecated and will be removed once both SDK 39 and legacy Notifications API are removed")));

@end

NS_ASSUME_NONNULL_END
