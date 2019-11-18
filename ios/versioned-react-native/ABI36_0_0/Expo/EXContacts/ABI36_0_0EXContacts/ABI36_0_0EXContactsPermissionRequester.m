// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI36_0_0EXContacts/ABI36_0_0EXContactsPermissionRequester.h>

@import Contacts;

@implementation ABI36_0_0EXContactsPermissionRequester

+ (NSString *)permissionType
{
  return @"contacts";
}

- (NSDictionary *)getPermissions
{
  ABI36_0_0UMPermissionStatus status;
  CNAuthorizationStatus permissions = [CNContactStore authorizationStatusForEntityType:CNEntityTypeContacts];
  switch (permissions) {
    case CNAuthorizationStatusAuthorized:
      status = ABI36_0_0UMPermissionStatusGranted;
      break;
    case CNAuthorizationStatusDenied:
    case CNAuthorizationStatusRestricted:
      status = ABI36_0_0UMPermissionStatusDenied;
      break;
    case CNAuthorizationStatusNotDetermined:
      status = ABI36_0_0UMPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI36_0_0UMPromiseResolveBlock)resolve rejecter:(ABI36_0_0UMPromiseRejectBlock)reject
{
  CNContactStore *contactStore = [CNContactStore new];
  ABI36_0_0UM_WEAKIFY(self)
  [contactStore requestAccessForEntityType:CNEntityTypeContacts completionHandler:^(BOOL granted, NSError * _Nullable error) {
    ABI36_0_0UM_STRONGIFY(self)
    // Error code 100 is a when the user denies permission, in that case we don't want to reject.
    if (error && error.code != 100) {
      reject(@"E_CONTACTS_ERROR_UNKNOWN", error.localizedDescription, error);
    } else {
      resolve([self getPermissions]);
    }
  }];
}



@end
