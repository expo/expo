// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@protocol EXPermissions

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;

@end

