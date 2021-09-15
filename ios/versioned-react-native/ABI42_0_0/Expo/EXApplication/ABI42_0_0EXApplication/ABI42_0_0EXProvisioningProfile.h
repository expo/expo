// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Keep in sync with ApplicationReleaseType in JS
typedef NS_ENUM(NSInteger, ABI42_0_0EXAppReleaseType) {
  ABI42_0_0EXAppReleaseTypeUnknown,
  ABI42_0_0EXAppReleaseSimulator,
  ABI42_0_0EXAppReleaseEnterprise,
  ABI42_0_0EXAppReleaseDev,
  ABI42_0_0EXAppReleaseAdHoc,
  ABI42_0_0EXAppReleaseAppStore
};

@interface ABI42_0_0EXProvisioningProfile : NSObject

+ (nonnull instancetype)mainProvisioningProfile;

- (ABI42_0_0EXAppReleaseType)appReleaseType;
- (nullable NSString *)notificationServiceEnvironment;

@end
