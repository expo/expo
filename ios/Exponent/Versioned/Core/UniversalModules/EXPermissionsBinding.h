// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXInternalModule.h>
#import <EXPermissionsInterface/EXPermissionsInterface.h>

#import "EXPermissions.h"

@interface EXPermissionsBinding : NSObject <EXInternalModule, EXPermissions>

- (instancetype)initWithPermissions:(EXPermissions *)permissions;
- (NSDictionary *)getPermissionsForResource:(NSString *)resource;

@end
