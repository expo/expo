// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Keep in sync with ApplicationReleaseType in JS
typedef NS_ENUM(NSInteger, EXAppReleaseType) {
  EXAppReleaseTypeUnknown,
  EXAppReleaseSimulator,
  EXAppReleaseEnterprise,
  EXAppReleaseDev,
  EXAppReleaseAdHoc,
  EXAppReleaseAppStore
};

@interface EXProvisioningProfile : NSObject

+ (nonnull instancetype)mainProvisioningProfile;

- (EXAppReleaseType)appReleaseType;
- (nullable NSString *)notificationServiceEnvironment;

@end
