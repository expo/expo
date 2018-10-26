// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXPermissions/ABI31_0_0EXContactsRequester.h>

@import Contacts;

@interface ABI31_0_0EXContactsRequester ()

@property (nonatomic, weak) id<ABI31_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI31_0_0EXContactsRequester

+ (NSDictionary *)permissions
{
  ABI31_0_0EXPermissionStatus status;
  CNAuthorizationStatus permissions = [CNContactStore authorizationStatusForEntityType:CNEntityTypeContacts];
  switch (permissions) {
    case CNAuthorizationStatusAuthorized:
      status = ABI31_0_0EXPermissionStatusGranted;
      break;
    case CNAuthorizationStatusDenied:
    case CNAuthorizationStatusRestricted:
      status = ABI31_0_0EXPermissionStatusDenied;
      break;
    case CNAuthorizationStatusNotDetermined:
      status = ABI31_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": [ABI31_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI31_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI31_0_0EXPromiseResolveBlock)resolve rejecter:(ABI31_0_0EXPromiseRejectBlock)reject
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

- (void)setDelegate:(id<ABI31_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
