// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXContacts/EXContactsPermissionRequester.h>

@import Contacts;

@implementation EXContactsPermissionRequester

+ (NSString *)permissionType
{
  return @"contacts";
}

- (NSDictionary *)getPermissions
{
  UMPermissionStatus status;
  CNAuthorizationStatus permissions = [CNContactStore authorizationStatusForEntityType:CNEntityTypeContacts];
  switch (permissions) {
    case CNAuthorizationStatusAuthorized:
      status = UMPermissionStatusGranted;
      break;
    case CNAuthorizationStatusDenied:
    case CNAuthorizationStatusRestricted:
      status = UMPermissionStatusDenied;
      break;
    case CNAuthorizationStatusNotDetermined:
      status = UMPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  CNContactStore *contactStore = [CNContactStore new];
  UM_WEAKIFY(self)
  [contactStore requestAccessForEntityType:CNEntityTypeContacts completionHandler:^(BOOL granted, NSError * _Nullable error) {
    UM_STRONGIFY(self)
    // Error code 100 is a when the user denies permission, in that case we don't want to reject.
    if (error && error.code != 100) {
      reject(@"E_CONTACTS_ERROR_UNKNOWN", error.localizedDescription, error);
    } else {
      resolve([self getPermissions]);
    }
  }];
}



@end
