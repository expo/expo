// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXPermissions/ABI35_0_0EXContactsRequester.h>

@import Contacts;

@interface ABI35_0_0EXContactsRequester ()

@property (nonatomic, weak) id<ABI35_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI35_0_0EXContactsRequester

+ (NSDictionary *)permissions
{
  ABI35_0_0EXPermissionStatus status;
  CNAuthorizationStatus permissions = [CNContactStore authorizationStatusForEntityType:CNEntityTypeContacts];
  switch (permissions) {
    case CNAuthorizationStatusAuthorized:
      status = ABI35_0_0EXPermissionStatusGranted;
      break;
    case CNAuthorizationStatusDenied:
    case CNAuthorizationStatusRestricted:
      status = ABI35_0_0EXPermissionStatusDenied;
      break;
    case CNAuthorizationStatusNotDetermined:
      status = ABI35_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": [ABI35_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI35_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI35_0_0UMPromiseResolveBlock)resolve rejecter:(ABI35_0_0UMPromiseRejectBlock)reject
{
  CNContactStore *contactStore = [CNContactStore new];

  [contactStore requestAccessForEntityType:CNEntityTypeContacts completionHandler:^(BOOL granted, NSError * _Nullable error) {
    // Error code 100 is a when the user denies permission, in that case we don't want to reject.
    if (error && error.code != 100) {
      reject(@"E_CONTACTS_ERROR_UNKNOWN", error.localizedDescription, error);
    } else {
      resolve([[self class] permissions]);
    }

    if (self->_delegate) {
      [self->_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<ABI35_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
