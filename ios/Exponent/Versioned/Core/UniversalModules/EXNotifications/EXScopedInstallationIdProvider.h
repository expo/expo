// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXDeviceInstallationUUIDManager <NSObject>

- (NSString *)deviceInstallationUUID;

@end

NS_ASSUME_NONNULL_END

// We only define EXScopedInstallationIdProvider if EXInstallationIdProvider
// is available, otherwise in installations that don't have expo-notifications
// it wouldn't compile (while technically as of December 2020 it shouldn't
// happen, it eventually main, so let's stay on the safe side).
#if __has_include(<EXNotifications/EXInstallationIdProvider.h>)

#import <EXNotifications/EXInstallationIdProvider.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedInstallationIdProvider : EXInstallationIdProvider

- (instancetype)initWithDeviceInstallationUUIDManager:(id<EXDeviceInstallationUUIDManager>)deviceInstallationUUIDManager;

@end

NS_ASSUME_NONNULL_END

#endif
