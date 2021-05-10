// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Keep in sync with ApplicationReleaseType in JS
typedef NS_ENUM(NSInteger, ABI41_0_0EXAppReleaseType) {
  ABI41_0_0EXAppReleaseTypeUnknown,
  ABI41_0_0EXAppReleaseSimulator,
  ABI41_0_0EXAppReleaseEnterprise,
  ABI41_0_0EXAppReleaseDev,
  ABI41_0_0EXAppReleaseAdHoc,
  ABI41_0_0EXAppReleaseAppStore
};

@interface ABI41_0_0EXProvisioningProfile : NSObject

+ (nonnull instancetype)mainProvisioningProfile;

- (ABI41_0_0EXAppReleaseType)appReleaseType;
- (nullable NSString *)notificationServiceEnvironment;

@end
