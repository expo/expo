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
- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass
{
  NSDictionary *globalPermission = [super getPermissionUsingRequesterClass:requesterClass];
  return [self getScopedPermissionForType:[requesterClass permissionType] withGlobalPermission:globalPermission];
}

// overriding EXPermission to inject scoped permission logic
- (NSDictionary *)getPermissionsForResource:(NSString *)permissionType
{
  NSDictionary *globalPermission = [super getPermissionsForResource:permissionType];
  return [self getScopedPermissionForType:permissionType withGlobalPermission:globalPermission];
}

- (NSString *)getScopedPermissionStatus:(NSString *)permissionType {
  return [[self class] permissionStringForStatus:[_permissionsService getPermission:permissionType forExperience:_experienceId]];
}

- (BOOL)hasGrantedScopedPermission:(NSString *)permissionType
{
  if (!_permissionsService) {
    return YES;
  }
  
  return [_permissionsService getPermission:permissionType forExperience:_experienceId] == UMPermissionStatusGranted;
}

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                withResult:(void (^)(NSDictionary *))onResult
                              withRejecter:(UMPromiseRejectBlock)reject
{
  NSDictionary* globalPermissions = [super getPermissionUsingRequesterClass:requesterClass];
  NSString* permissionType = [requesterClass permissionType];
  UM_WEAKIFY(self)
  if (![globalPermissions[@"status"] isEqualToString:@"granted"]) {
    // first group
    // ask for permission. If granted then save it as scope permission
    void (^customOnResults)(NSDictionary *) = ^(NSDictionary *permission){
      UM_ENSURE_STRONGIFY(self)
      [self.permissionsService savePermission:permission ofType:permissionType forExperience:self.experienceId];
      onResult(permission);
    };
    
    return [self askForGlobalPermissionUsingRequesterClass:requesterClass withResolver:customOnResults withRejecter:reject];
  } else if (![self hasGrantedScopedPermission:permissionType]) {
    // second group
    // had to reinitilize UIAlertActions between alertShow invocations
    UIAlertAction *allowAction = [UIAlertAction actionWithTitle:@"Allow" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
      UM_ENSURE_STRONGIFY(self);
      NSMutableDictionary *permission = [globalPermissions mutableCopy];
      // try to save scoped permissions - if fails than permission is denied
      if (![self.permissionsService savePermission:permission ofType:permissionType forExperience:self.experienceId]) {
        permission[@"status"] = [[self class] permissionStringForStatus:UMPermissionStatusDenied];
        permission[@"granted"] = @(NO);
      }
      onResult(permission);
    }];
    
    UIAlertAction *denyAction = [UIAlertAction actionWithTitle:@"Deny" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
      UM_ENSURE_STRONGIFY(self);
      NSMutableDictionary *permission = [globalPermissions mutableCopy];
      permission[@"status"] = [[self class] permissionStringForStatus:UMPermissionStatusDenied];
      permission[@"granted"] = @(NO);
      onResult([NSDictionary dictionaryWithDictionary:permission]);
    }];
    
    return [self showPermissionRequestAlert:permissionType withAllowAction:allowAction withDenyAction:denyAction];
  }
  
  onResult([self getPermissionUsingRequesterClass:requesterClass]); // third group
}

// overriding EXPermission to inject scoped permission logic
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
  NSDictionary* globalPermissions = [super getPermissionsForResource:permissionType];
  UM_WEAKIFY(self)
  if (![globalPermissions[@"status"] isEqualToString:@"granted"]) {
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
      NSMutableDictionary *permission = [globalPermissions mutableCopy];
      // try to save scoped permissions - if fails than permission is denied
      if (![self.permissionsService savePermission:permission ofType:permissionType forExperience:self.experienceId]) {
        permission[@"status"] = [[self class] permissionStringForStatus:UMPermissionStatusDenied];
        permission[@"granted"] = @(NO);
      }
      onResults(permission);
    }];
    
    UIAlertAction *denyAction = [UIAlertAction actionWithTitle:@"Deny" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
      UM_ENSURE_STRONGIFY(self);
      NSMutableDictionary *permission = [globalPermissions mutableCopy];
      permission[@"status"] = [[self class] permissionStringForStatus:UMPermissionStatusDenied];
      permission[@"granted"] = @(NO);
      onResults([NSDictionary dictionaryWithDictionary:permission]);
    }];
    
    return [self showPermissionRequestAlert:permissionType withAllowAction:allowAction withDenyAction:denyAction];
  }
 
  onResults([self getPermissionsForResource:permissionType]); // third group
}

# pragma mark - helpers
- (NSDictionary *)getScopedPermissionForType:(NSString *)permissionType withGlobalPermission:(NSDictionary *)globalPermission
{
  if (!globalPermission) {
    return nil;
  }
  NSMutableDictionary *permission = [NSMutableDictionary dictionaryWithDictionary:globalPermission];
  
  if ([self shouldVerifyScopedPermission:permissionType]
      && [EXPermissions statusForPermission:permission] == UMPermissionStatusGranted) {
    permission[@"status"] = [self getScopedPermissionStatus:permissionType];
  }
  return permission;
}

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
