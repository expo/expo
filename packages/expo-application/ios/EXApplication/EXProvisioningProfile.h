// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, EXAppReleaseType) {
  EXAppReleaseTypeUnknown,
  EXAppReleaseSimulator,
  EXAppReleaseEnterprise,
  EXAppReleaseDev,
  EXAppReleaseAdHoc,
  EXAppReleaseAppStore
};

@interface EXProvisioningProfile : NSObject

+ (instancetype)mainProvisioningProfile;

- (EXAppReleaseType)appReleaseType;
- (NSString *)notificationServiceEnvironment;

@end
