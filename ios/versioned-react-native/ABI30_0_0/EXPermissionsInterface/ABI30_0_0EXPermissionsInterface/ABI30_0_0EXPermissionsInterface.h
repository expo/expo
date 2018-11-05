// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@protocol ABI30_0_0EXPermissionsInterface

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;
- (BOOL)hasGrantedPermission:(NSString *)permissionType;
- (void)askForPermission:(NSString *)permissionType
              withResult:(nonnull void (^)(BOOL result))onResult
            withRejecter:(ABI30_0_0EXPromiseRejectBlock)reject;
- (void)askForPermissions:(NSArray<NSString *> *)permissionsTypes
              withResults:(nonnull void (^)(NSArray<NSNumber *> *results))onResults
             withRejecter:(ABI30_0_0EXPromiseRejectBlock)reject;

@end

@protocol ABI30_0_0EXPermissionsServiceInterface

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end
