// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXPermissions/EXPermissions.h>

@interface EXCameraPermissionRequester : NSObject <EXPermissionRequester>

+ (NSDictionary *)permissions;

@end
