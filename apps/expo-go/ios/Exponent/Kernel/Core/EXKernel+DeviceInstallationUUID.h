// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXKernel (DeviceInstallationUUID)

/**
 *  An ID that uniquely identifies this installation of Expo Go
 */
// We deprecated installationIDs in SDK 39 and will remove them after we provide a synchronous
// storage API, which allows developers to synchronously set and get their own IDs
// TODO: Remove this after SDK 44 is phased out
+ (NSString *)deviceInstallationUUID __attribute((deprecated("The installation ID API is deprecated and will be removed once SDK 44 is phased out")));

@end

NS_ASSUME_NONNULL_END
