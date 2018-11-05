// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@protocol ABI29_0_0EXPermissionsInterface

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;

@end

@protocol ABI29_0_0EXPermissionsServiceInterface

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end
