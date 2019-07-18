// Copyright 2016-present 650 Industries. All rights reserved.

#if __has_include(<EXPermissions/EXPermissions.h>)
#import "EXScopedPermissions.h"
#import <UMCore/UMUtilities.h>
#import <UMCore/UMDefines.h>


@interface EXScopedPermissions ()

@property (nonatomic, strong) NSString *experienceId;
@property (nonatomic, weak) id<EXPermissionsScopedModuleDelegate> permissionsService;
@property (nonatomic, weak) id<UMUtilitiesInterface> utils;
@property (nonatomic, weak) EXConstantsBinding *constantsBinding;

@end

@implementation EXScopedPermissions

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(EXConstantsBinding *)constantsBinding
{
  if (self = [super init]) {
    _experienceId = experienceId;
    _constantsBinding = constantsBinding;
  }
  return self;
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  [super setModuleRegistry:moduleRegistry];
  _utils = [moduleRegistry getModuleImplementingProtocol:@protocol(UMUtilitiesInterface)];
  _permissionsService = [moduleRegistry getSingletonModuleForName:@"Permissions"];
}

# pragma mark - permission requsters / getters

// overriding EXPermission to inject scoped permission logic
- (NSDictionary *)getPermissionsForResource:(NSString *)permissionType
{
  NSDictionary *globalPermission = [super getPermissionsForResource:permissionType];
  if (!globalPermission) {
    return nil;
  }
  
  NSMutableDictionary *permission = [NSMutableDictionary dictionaryWithDictionary:globalPermission];
  
  if ([self shouldVerifyScopedPermission:permissionType]
      && [EXPermissions statusForPermissions:permission] == EXPermissionStatusGranted
      && ![self hasGrantedScopedPermission:permissionType]) {
    permission[@"status"] = [[self class] permissionStringForStatus:EXPermissionStatusDenied];
  }
  return permission;
}

- (BOOL)hasGrantedScopedPermission:(NSString *)permissionType
{
  if (!_permissionsService) {
    return YES;
  }
  
  return [_permissionsService getPermission:permissionType forExperience:_experienceId] == EXPermissionStatusGranted;
}

- (void)askForPermissionWithType:(NSString *)permissionType
                       withResults:(void (^)(NSDictionary *results))onResults
                      withRejecter:(UMPromiseRejectBlock)reject
{
//   Divide permissions into three groups:
//   1. that for which global status is undetermined
//   2. that for which scoped status is undetermined
//   3. that for which both of these statuses are determined.
  
//  We will query the system about the first group. If the user grants the permission
//  we treat as an experience granted to the running experience - the scoped permission
//  also is granted. Same for denial.
//
//  We will query for second group manually, with our own dialogs.
//  The result will be saved in EXPermissionsScopedModuleDelegate.

  UM_WEAKIFY(self)
  if (![[super getPermissionsForResource:permissionType][@"status"] isEqualToString:@"granted"]) {
    // first group
    // ask for permission. If granted then save it as scope permission
    void (^customOnResults)(NSDictionary *) = ^(NSDictionary *permission){
      UM_ENSURE_STRONGIFY(self)
      [self.permissionsService savePermission:permission ofType:permissionType forExperience:self.experienceId];
      onResults(permission);
    };
    
    return [super askForGlobalPermission:permissionType withResolver:customOnResults withRejecter:reject];
  } else if (![self hasGrantedScopedPermission:permissionType]) {
    // second group
    // had to reinitilize UIAlertActions between alertShow invocations
    UIAlertAction *allowAction = [UIAlertAction actionWithTitle:@"Allow" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
      UM_ENSURE_STRONGIFY(self);
      NSMutableDictionary *permission = [[super getPermissionsForResource:permissionType] mutableCopy];
      // try to save scoped permissions - if fails than permission is denied
      if (![self.permissionsService savePermission:permission ofType:permissionType forExperience:self.experienceId]) {
        permission[@"status"] = [[self class] permissionStringForStatus:EXPermissionStatusDenied];
        permission[@"granted"] = @(NO);
      }
      onResults(permission);
    }];
    
    UIAlertAction *denyAction = [UIAlertAction actionWithTitle:@"Deny" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
      UM_ENSURE_STRONGIFY(self);
      // i dont know if i need to get global permission but for i will leave it here
      NSMutableDictionary *permission = [[self getPermissionsForResource:permissionType] mutableCopy];
      permission[@"status"] = [[self class] permissionStringForStatus:EXPermissionStatusDenied];
      permission[@"granted"] = @(NO);
      onResults([NSDictionary dictionaryWithDictionary:permission]);
    }];
    
    return [self showPermissionRequestAlert:permissionType withAllowAction:allowAction withDenyAction:denyAction];
  }
 
  onResults([self getPermissionsForResource:permissionType]); // third group
}

# pragma mark - helpers

- (void)showPermissionRequestAlert:(NSString *)permissionType
                   withAllowAction:(UIAlertAction *)allow
                    withDenyAction:(UIAlertAction *)deny
{
  NSString *experienceName = self.experienceId; // TODO: we might want to use name from the manifest?
  NSString *messageTemplate = @"%1$@ needs permissions for %2$@. You\'ve already granted permission to another Expo experience. Allow %1$@ to use it also?";
  NSString *permissionString = [[self class] textForPermissionType:permissionType];

  NSString *message = [NSString stringWithFormat:messageTemplate, experienceName, permissionString];
  UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"Experience needs permissions"
                                                                 message:message
                                                          preferredStyle:UIAlertControllerStyleAlert];
  [alert addAction:deny];
  [alert addAction:allow];

  UM_WEAKIFY(self);
  [UMUtilities performSynchronouslyOnMainThread:^{
    UM_ENSURE_STRONGIFY(self);
    // TODO: below line is sometimes failing with: "Presenting view controllers on detached view controllers is discourage"
    [self->_utils.currentViewController presentViewController:alert animated:YES completion:nil];
  }];
}


+ (NSString *)textForPermissionType:(NSString *)type
{
  if ([type isEqualToString:@"audioRecording"]) {
    return @"recording audio";
  } else if ([type isEqualToString:@"cameraRoll"]) {
    return @"photos";
  }
  
  return type;
}

- (BOOL)shouldVerifyScopedPermission:(NSString *)permissionType
{
  // temporarily exclude notifactions from permissions per experience; system brightness is always granted
  return ![@[@"notifications", @"userFacingNotifications", @"systemBrightness"] containsObject:permissionType];
}


@end
#endif
