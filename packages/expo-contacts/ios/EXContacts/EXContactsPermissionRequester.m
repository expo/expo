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
  EXPermissionStatus status;
  CNAuthorizationStatus permissions = [CNContactStore authorizationStatusForEntityType:CNEntityTypeContacts];
  switch (permissions) {
    case CNAuthorizationStatusAuthorized:
      status = EXPermissionStatusGranted;
      break;
    case CNAuthorizationStatusDenied:
    case CNAuthorizationStatusRestricted:
      status = EXPermissionStatusDenied;
      break;
    case CNAuthorizationStatusNotDetermined:
      status = EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject
{
  CNContactStore *contactStore = [CNContactStore new];
  EX_WEAKIFY(self)
  [contactStore requestAccessForEntityType:CNEntityTypeContacts completionHandler:^(BOOL granted, NSError * _Nullable error) {
    EX_STRONGIFY(self)
    // Error code 100 is a when the user denies permission, in that case we don't want to reject.
    if (error && error.code != 100) {
      reject(@"E_CONTACTS_ERROR_UNKNOWN", error.localizedDescription, error);
    } else {
      resolve([self getPermissions]);
    }
  }];
}



@end
