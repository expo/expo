// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@protocol EXPermissionsInterface

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;
- (BOOL)hasGrantedPermission:(NSString *)permissionType;

- (void)askForPermission:(NSString *)permissionType
              withResult:(void (^)(NSDictionary *))onResult
            withRejecter:(EXPromiseRejectBlock)reject;

- (void)askForPermissions:(NSArray<NSString *> *)permissionsTypes
              withResults:(void (^)(NSArray<NSDictionary *> *))onResults
             withRejecter:(EXPromiseRejectBlock)reject;

@end

@protocol EXPermissionsServiceInterface

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end
