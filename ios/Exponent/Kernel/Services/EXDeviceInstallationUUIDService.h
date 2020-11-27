// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#if __has_include(<ABI39_0_0ExpoKit/ABI39_0_0EXConstantsBinding.h>)
#import <ABI39_0_0ExpoKit/ABI39_0_0EXConstantsBinding.h>
#endif
#if __has_include(<ABI38_0_0ExpoKit/ABI38_0_0EXConstantsBinding.h>)
#import <ABI38_0_0ExpoKit/ABI38_0_0EXConstantsBinding.h>
#endif
#if __has_include(<ABI37_0_0ExpoKit/ABI37_0_0EXConstantsBinding.h>)
#import <ABI37_0_0ExpoKit/ABI37_0_0EXConstantsBinding.h>
#endif

NS_ASSUME_NONNULL_BEGIN

// We need this protocol to conveniently exclude ABIXX_0_0EXConstantsDeviceInstallationUUIDManager protocols
// from list of protocols EXDeviceInstallationUUIDService conforms to.
@protocol EXDeviceInstallationUUIDServiceDummyInterface <NSObject>

@end

// A kernel service allowing versioned expo-constants to access device installation UUID
// TODO: Remove this after SDK 39 is phased out
__deprecated_msg("The installation ID API is deprecated and will be removed once both SDK 39 and legacy Notifications API are removed")
@interface EXDeviceInstallationUUIDService : NSObject <
#if __has_include(<ABI37_0_0ExpoKit/ABI37_0_0EXConstantsBinding.h>)
ABI37_0_0EXConstantsDeviceInstallationUUIDManager,
#endif
#if __has_include(<ABI38_0_0ExpoKit/ABI38_0_0EXConstantsBinding.h>)
ABI38_0_0EXConstantsDeviceInstallationUUIDManager,
#endif
#if __has_include(<ABI39_0_0ExpoKit/ABI39_0_0EXConstantsBinding.h>)
ABI39_0_0EXConstantsDeviceInstallationUUIDManager,
#endif
EXDeviceInstallationUUIDServiceDummyInterface
>

@end

NS_ASSUME_NONNULL_END
