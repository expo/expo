// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// We need this protocol to conveniently exclude ABIXX_0_0EXConstantsDeviceInstallationUUIDManager protocols
// from list of protocols EXDeviceInstallationUUIDService conforms to.
@protocol EXDeviceInstallationUUIDServiceDummyInterface <NSObject>

@end

// A kernel service allowing versioned expo-constants to access device installation UUID
// We deprecated installationIDs in SDK 39 and will remove them after we provide a synchronous
// storage API, which allows developers to synchronously set and get their own IDs
// TODO: Remove this after SDK 44 is phased out
__deprecated_msg("The installation ID API is deprecated and will be removed when SDK 44 is phased out")
@interface EXDeviceInstallationUUIDService : NSObject <EXDeviceInstallationUUIDServiceDummyInterface>

@end

NS_ASSUME_NONNULL_END
