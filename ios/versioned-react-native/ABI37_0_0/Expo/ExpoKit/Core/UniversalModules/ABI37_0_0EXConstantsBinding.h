// Copyright 2015-present 650 Industries. All rights reserved.
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI37_0_0EXConstantsDeviceInstallationUUIDManager <NSObject>

- (NSString *)deviceInstallationUUID;

@end

NS_ASSUME_NONNULL_END

#if __has_include(<ABI37_0_0EXConstants/ABI37_0_0EXConstantsService.h>)
#import <ABI37_0_0EXConstants/ABI37_0_0EXConstantsService.h>
#import <ABI37_0_0UMConstantsInterface/ABI37_0_0UMConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI37_0_0EXConstantsBinding : ABI37_0_0EXConstantsService <ABI37_0_0UMInternalModule, ABI37_0_0UMConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params deviceInstallationUUIDManager:(id<ABI37_0_0EXConstantsDeviceInstallationUUIDManager>)deviceInstallationUUIDManager;

@end

NS_ASSUME_NONNULL_END

#endif
