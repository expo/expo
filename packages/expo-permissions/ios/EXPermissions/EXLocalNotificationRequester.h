// Copyright © 2018 650 Industries. All rights reserved.

#import <EXPermissions/EXPermissions.h>

@interface EXLocalNotificationRequester : NSObject <EXPermissionRequester>

+ (NSDictionary *)permissions;

@end

