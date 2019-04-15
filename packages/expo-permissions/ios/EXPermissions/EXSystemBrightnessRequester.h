// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXPermissions/EXPermissions.h>

@interface EXSystemBrightnessRequester : NSObject <EXPermissionRequester>

+ (NSDictionary *)permissions;

@end
