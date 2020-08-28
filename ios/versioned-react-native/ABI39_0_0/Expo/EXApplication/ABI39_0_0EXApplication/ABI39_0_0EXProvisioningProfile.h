// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Keep in sync with ApplicationReleaseType in JS
typedef NS_ENUM(NSInteger, ABI39_0_0EXAppReleaseType) {
  ABI39_0_0EXAppReleaseTypeUnknown,
  ABI39_0_0EXAppReleaseSimulator,
  ABI39_0_0EXAppReleaseEnterprise,
  ABI39_0_0EXAppReleaseDev,
  ABI39_0_0EXAppReleaseAdHoc,
  ABI39_0_0EXAppReleaseAppStore
};

@interface ABI39_0_0EXProvisioningProfile : NSObject

+ (nonnull instancetype)mainProvisioningProfile;

- (ABI39_0_0EXAppReleaseType)appReleaseType;
- (nullable NSString *)notificationServiceEnvironment;

@end
