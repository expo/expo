// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXContacts/ABI42_0_0EXContactsPermissionRequester.h>

@import Contacts;

@implementation ABI42_0_0EXContactsPermissionRequester

+ (NSString *)permissionType
{
  return @"contacts";
}

- (NSDictionary *)getPermissions
{
  ABI42_0_0EXPermissionStatus status;
  CNAuthorizationStatus permissions = [CNContactStore authorizationStatusForEntityType:CNEntityTypeContacts];
  switch (permissions) {
    case CNAuthorizationStatusAuthorized:
      status = ABI42_0_0EXPermissionStatusGranted;
      break;
    case CNAuthorizationStatusDenied:
    case CNAuthorizationStatusRestricted:
      status = ABI42_0_0EXPermissionStatusDenied;
      break;
    case CNAuthorizationStatusNotDetermined:
      status = ABI42_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve rejecter:(ABI42_0_0UMPromiseRejectBlock)reject
{
  CNContactStore *contactStore = [CNContactStore new];
  ABI42_0_0UM_WEAKIFY(self)
  [contactStore requestAccessForEntityType:CNEntityTypeContacts completionHandler:^(BOOL granted, NSError * _Nullable error) {
    ABI42_0_0UM_STRONGIFY(self)
    // Error code 100 is a when the user denies permission, in that case we don't want to reject.
    if (error && error.code != 100) {
      reject(@"E_CONTACTS_ERROR_UNKNOWN", error.localizedDescription, error);
    } else {
      resolve([self getPermissions]);
    }
  }];
}



@end
