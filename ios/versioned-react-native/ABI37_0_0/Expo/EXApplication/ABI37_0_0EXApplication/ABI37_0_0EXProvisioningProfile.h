// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Keep in sync with ApplicationReleaseType in JS
typedef NS_ENUM(NSInteger, ABI37_0_0EXAppReleaseType) {
  ABI37_0_0EXAppReleaseTypeUnknown,
  ABI37_0_0EXAppReleaseSimulator,
  ABI37_0_0EXAppReleaseEnterprise,
  ABI37_0_0EXAppReleaseDev,
  ABI37_0_0EXAppReleaseAdHoc,
  ABI37_0_0EXAppReleaseAppStore
};

@interface ABI37_0_0EXProvisioningProfile : NSObject

+ (instancetype)mainProvisioningProfile;

- (ABI37_0_0EXAppReleaseType)appReleaseType;
- (nullable NSString *)notificationServiceEnvironment;

@end
