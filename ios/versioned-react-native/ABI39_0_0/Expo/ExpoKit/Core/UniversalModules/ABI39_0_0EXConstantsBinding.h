// Copyright 2015-present 650 Industries. All rights reserved.
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI39_0_0EXConstantsDeviceInstallationUUIDManager <NSObject>

- (NSString *)deviceInstallationUUID;

@end

NS_ASSUME_NONNULL_END

#if __has_include(<ABI39_0_0EXConstants/ABI39_0_0EXConstantsService.h>)
#import <ABI39_0_0EXConstants/ABI39_0_0EXConstantsService.h>
#import <ABI39_0_0UMConstantsInterface/ABI39_0_0UMConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXConstantsBinding : ABI39_0_0EXConstantsService <ABI39_0_0UMInternalModule, ABI39_0_0UMConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params deviceInstallationUUIDManager:(id<ABI39_0_0EXConstantsDeviceInstallationUUIDManager>)deviceInstallationUUIDManager;

@end

NS_ASSUME_NONNULL_END

#endif
