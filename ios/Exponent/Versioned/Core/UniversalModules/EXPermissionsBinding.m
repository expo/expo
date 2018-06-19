// Copyright © 2018 650 Industries. All rights reserved.

#import "EXPermissionsBinding.h"

@interface EXPermissionsBinding ()

@property (nonatomic, weak) EXPermissions *permissions;

@end

@implementation EXPermissionsBinding

- (instancetype)initWithPermissions:(EXPermissions *)permissions
{
  if (self = [super init]) {
    _permissions = permissions;
  }
  return self;
}

- (NSDictionary *)getPermissionsForResource:(NSString *)resource
{
  return [_permissions getSystemPermissionsWithType:resource];
}

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(EXPermissions)];
}

@end
