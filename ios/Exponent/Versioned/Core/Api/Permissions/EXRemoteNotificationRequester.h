// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXPermissions.h"

@interface EXRemoteNotificationRequester : NSObject <EXPermissionRequester>

+ (NSDictionary *)permissions;

@end
