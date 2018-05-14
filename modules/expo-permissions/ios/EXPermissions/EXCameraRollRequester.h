// Copyright 2017-present 650 Industries. All rights reserved.

#import <EXPermissions/EXPermissions.h>

@interface EXCameraRollRequester : NSObject<EXPermissionRequester>

+ (NSDictionary *)permissions;

@end
