// Copyright 2019-present 650 Industries. All rights reserved.

#import "EXBareAppIdProvider.h"

@implementation EXBareAppIdProvider

UM_REGISTER_MODULE()

- (NSString *)getAppId {
  NSString *appIdFromInfoPList = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"appId"];
  if (appIdFromInfoPList != nil) {
    return appIdFromInfoPList;
  }
  return @"defaultId";
}

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(EXAppIdProvider)];
}

@end
