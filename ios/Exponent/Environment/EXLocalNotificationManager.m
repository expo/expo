// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXLocalNotificationManager.h"

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
  
}

@end
