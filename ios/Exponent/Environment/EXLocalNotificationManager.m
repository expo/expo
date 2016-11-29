// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXLocalNotificationManager.h"
#import "EXKernel.h"

@implementation EXLocalNotificationManager

+ (instancetype)sharedInstance
{
  static EXLocalNotificationManager *theManager;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theManager) {
      theManager = [EXLocalNotificationManager new];
    }
  });
  return theManager;
}

- (void)handleLocalNotification:(UILocalNotification *)notification fromBackground:(BOOL)isFromBackground
{
  NSDictionary *payload = notification.userInfo;
  
  if (payload) {
    NSDictionary *body = [payload objectForKey:@"body"];
    NSString *experienceId = [payload objectForKey:@"experienceId"];
    if (body && experienceId) {
      [[EXKernel sharedInstance] sendNotification:body
                               toExperienceWithId:experienceId
                                   fromBackground:isFromBackground
                                         isRemote:NO];
    }
  }
}

@end
