// Copyright 2015-present 650 Industries. All rights reserved.
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXConstantsDeviceInstallationUUIDManager <NSObject>

- (NSString *)deviceInstallationUUID;

@end

NS_ASSUME_NONNULL_END

#if __has_include(<EXConstants/EXConstantsService.h>)
#import <EXConstants/EXConstantsService.h>
#import <UMConstantsInterface/UMConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXConstantsBinding : EXConstantsService <UMInternalModule, UMConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params deviceInstallationUUIDManager:(id<EXConstantsDeviceInstallationUUIDManager>)deviceInstallationUUIDManager;

@end

NS_ASSUME_NONNULL_END

#endif
