// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI33_0_0EXScopedPermissions.h"
#import <ABI33_0_0UMCore/ABI33_0_0UMUtilities.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMDefines.h>

@interface ABI33_0_0EXPermissions (Protected)

- (void)askForPermissionsWithTypes:(NSArray<NSString *> *)permissionsTypes
                       withResults:(void (^)(NSDictionary *results))onResults
                      withRejecter:(ABI33_0_0UMPromiseRejectBlock)reject;

@end

@interface ABI33_0_0EXScopedPermissions ()

@property (nonatomic, strong) NSString *experienceId;
@property (nonatomic, weak) id<ABI33_0_0EXPermissionsScopedModuleDelegate> permissionsService;
@property (nonatomic, weak) id<ABI33_0_0UMUtilitiesInterface> utils;
@property (nonatomic, weak) ABI33_0_0EXConstantsBinding *constantsBinding;

@end

@implementation ABI33_0_0EXScopedPermissions

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(ABI33_0_0EXConstantsBinding *)constantsBinding
{
  if (self = [super init]) {
    _experienceId = experienceId;
    _constantsBinding = constantsBinding;
  }
  return self;
}

- (void)setModuleRegistry:(ABI33_0_0UMModuleRegistry *)moduleRegistry
{
  [super setModuleRegistry:moduleRegistry];
  _utils = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI33_0_0UMUtilitiesInterface)];
  _permissionsService = [moduleRegistry getSingletonModuleForName:@"Permissions"];
}

- (void)askForPermissionsWithTypes:(NSArray<NSString *> *)permissionsTypes
                       withResults:(void (^)(NSDictionary *results))onResults
                      withRejecter:(ABI33_0_0UMPromiseRejectBlock)reject
{
  // Divide permissions into three groups:
  // 1. that for which global status is undetermined
  // 2. that for which scoped status is undetermined
  // 3. that for which both of these statuses are determined.
  //
  // We will query the system about the first group. If the user grants the permission
  // we treat as an experience granted to the running experience - the scoped permission
  // also is granted. Same for denial.
  //
  // We will query for second group manually, with our own dialogs.
  // The result will be saved in ABI33_0_0EXPermissionsScopedModuleDelegate.
  //
  // The third group requires no special handling.
  NSMutableArray<NSString *> *permissionTypesWithUngrantedGlobalStatus = [NSMutableArray new];
  NSMutableArray<NSString *> *permissionTypesWithUngrantedScopedStatus = [NSMutableArray new];

  for (NSString *permissionType in permissionsTypes) {
    // super - we manager service check
    if (![super hasGrantedPermission:permissionType]) {
      [permissionTypesWithUngrantedGlobalStatus addObject:permissionType];
    } else if (![self hasGrantedScopedPermission:permissionType]) {
      [permissionTypesWithUngrantedScopedStatus addObject:permissionType];
    }
  }

  ABI33_0_0UM_WEAKIFY(self);
  void (^customOnResults)(NSDictionary *) = ^(NSDictionary *globalPermissions) {
    ABI33_0_0UM_ENSURE_STRONGIFY(self);
    for (NSString *permissionType in permissionTypesWithUngrantedGlobalStatus) {
      [self.permissionsService savePermission:globalPermissions[permissionType] ofType:permissionType forExperience:self.experienceId];
    }

    [self askForScopedPermissions:permissionTypesWithUngrantedScopedStatus withResolver:^(NSDictionary *scopedPermissions) {
      NSMutableDictionary *mergedPermissions = [[NSMutableDictionary alloc] initWithDictionary:globalPermissions];
      [mergedPermissions addEntriesFromDictionary:scopedPermissions];
      onResults(mergedPermissions);
    } withRejecter:reject];
  };

  [super askForPermissionsWithTypes:permissionsTypes withResults:customOnResults withRejecter:reject];
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

  ABI33_0_0UM_WEAKIFY(self);
  [ABI33_0_0UMUtilities performSynchronouslyOnMainThread:^{
    ABI33_0_0UM_ENSURE_STRONGIFY(self);
    // TODO: below line is sometimes failing with: "Presenting view controllers on detached view controllers is discourage"
    [self->_utils.currentViewController presentViewController:alert animated:YES completion:nil];
  }];
}

- (BOOL)hasGrantedScopedPermission:(NSString *)permissionType
{
  if (!_permissionsService) {
    return YES;
  }

  return [_permissionsService getPermission:permissionType forExperience:_experienceId] == ABI33_0_0EXPermissionStatusGranted;
}

- (BOOL)hasGrantedPermission:(NSString *)permissionType
{
  return [super hasGrantedPermission:permissionType] && [self hasGrantedScopedPermission:permissionType];
}

- (void)askForScopedPermissions:(NSArray<NSString *> *)permissionsTypes
                   withResolver:(void (^)(NSDictionary *))resolver
                   withRejecter:(ABI33_0_0UMPromiseRejectBlock)reject
{
  // nothing to ask for - return immediately
  if (permissionsTypes.count == 0) {
    return resolver(@{});
  }
  
  // not in Expo Client - invoke allow action for each permission type
  if (![_constantsBinding.appOwnership isEqualToString:@"expo"]) {
    NSMutableDictionary *results = [NSMutableDictionary new];
    
    for (NSString *permissionType in permissionsTypes) {
      
      // initilize as global permission
      results[permissionType] = [NSMutableDictionary dictionaryWithDictionary:[self getPermissionsForResource:permissionType]];
      
      // try to save scoped permissions - if fails than permission is denied
      if (![self.permissionsService savePermission:results[permissionType] ofType:permissionType forExperience:self.experienceId]) {
        results[permissionType][@"status"] = [[self class] permissionStringForStatus:ABI33_0_0EXPermissionStatusDenied];
        results[@"granted"] = @(NO);
      }
    }
    
    return resolver(results);
  }


  __block NSMutableDictionary *permissions = [NSMutableDictionary new];
  __block NSMutableSet *permissionsToBeAsked = [NSMutableSet setWithArray:permissionsTypes];
  __block NSString *permissionType; // accumulator for currently proceessed permissionType
  ABI33_0_0UM_WEAKIFY(self);

  __block void (^askForNextPermission)(void) = ^() {
    // stop condition: no permission left to be asked - resolve with results
    if (permissionsToBeAsked.count == 0) {
      resolver(permissions);
      askForNextPermission = nil;
      return;
    }

    ABI33_0_0UM_ENSURE_STRONGIFY(self);

    // pop next permissionType from set
    permissionType = [permissionsToBeAsked anyObject];
    [permissionsToBeAsked removeObject:permissionType];

    // initilize as global permission
    permissions[permissionType] = [NSMutableDictionary dictionaryWithDictionary:[self getPermissionsForResource:permissionType]];

    // had to reinitilize UIAlertActions between alertShow invocations
    UIAlertAction *allowAction = [UIAlertAction actionWithTitle:@"Allow" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
      ABI33_0_0UM_ENSURE_STRONGIFY(self);
      // try to save scoped permissions - if fails than permission is denied
      if (![self.permissionsService savePermission:permissions[permissionType] ofType:permissionType forExperience:self.experienceId]) {
        permissions[permissionType][@"status"] = [[self class] permissionStringForStatus:ABI33_0_0EXPermissionStatusDenied];
        permissions[@"granted"] = @(NO);
      }
      askForNextPermission();
    }];

    UIAlertAction *denyAction = [UIAlertAction actionWithTitle:@"Deny" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
      ABI33_0_0UM_ENSURE_STRONGIFY(self);
      permissions[permissionType][@"status"] = [[self class] permissionStringForStatus:ABI33_0_0EXPermissionStatusDenied];
      permissions[@"granted"] = @(NO);
      askForNextPermission();
    }];

    [self showPermissionRequestAlert:permissionType withAllowAction:allowAction withDenyAction:denyAction];
  };

  // ask for first scoped permission
  askForNextPermission();
}

- (NSDictionary *)getPermissionsForResource:(NSString *)permissionType
{
  NSDictionary *globalPermission = [super getPermissionsForResource:permissionType];
  if (!globalPermission) {
    return nil;
  }

  NSMutableDictionary *permission = [NSMutableDictionary dictionaryWithDictionary:globalPermission];

  // check scoped permissions if available
  if ([self shouldVerifyScopedPermission:permissionType]
      && [ABI33_0_0EXPermissions statusForPermissions:permission] == ABI33_0_0EXPermissionStatusGranted
      && ![self hasGrantedScopedPermission:permissionType]) {
    permission[@"status"] = [[self class] permissionStringForStatus:ABI33_0_0EXPermissionStatusDenied];
  }
  return permission;
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
