// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI26_0_0EXPermissions.h"

@interface ABI26_0_0EXRemoteNotificationRequester : NSObject <ABI26_0_0EXPermissionRequester, ABI26_0_0EXPermissionRequesterDelegate>

+ (NSDictionary *)permissions;

@end
