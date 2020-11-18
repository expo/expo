// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXKernel (DeviceInstallationUUID)

/**
 *  An ID that uniquely identifies this installation of Expo Go
 */
+ (NSString *)deviceInstallationUUID;

@end

NS_ASSUME_NONNULL_END
