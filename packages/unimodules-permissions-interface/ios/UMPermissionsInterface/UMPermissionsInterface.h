// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@protocol UMPermissionsInterface

- (NSDictionary *)getPermissionsForResource:(NSString *)resource;
- (BOOL)hasGrantedPermission:(NSString *)permissionType;

- (void)askForPermission:(NSString *)permissionType
              withResult:(void (^)(NSDictionary *))onResult
            withRejecter:(UMPromiseRejectBlock)reject;

@end
