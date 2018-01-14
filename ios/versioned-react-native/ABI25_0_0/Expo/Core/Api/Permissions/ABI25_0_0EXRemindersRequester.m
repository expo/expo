#import "ABI25_0_0EXRemindersRequester.h"
#import <EventKit/EventKit.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUtils.h>

@interface ABI25_0_0EXRemindersRequester ()

@property (nonatomic, weak) id<ABI25_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI25_0_0EXRemindersRequester

+ (NSDictionary *)permissions
{
  ABI25_0_0EXPermissionStatus status;
  EKAuthorizationStatus permissions;
  
  NSString *remindersUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSRemindersUsageDescription"];
  if (!remindersUsageDescription) {
    ABI25_0_0RCTFatal(ABI25_0_0RCTErrorWithMessage(@"This app is missing NSRemindersUsageDescription, so reminders methods will fail. Add this key to your bundle's Info.plist."));
    permissions = EKAuthorizationStatusDenied;
  } else {
    permissions = [EKEventStore authorizationStatusForEntityType:EKEntityTypeReminder];
  }
  switch (permissions) {
    case EKAuthorizationStatusAuthorized:
      status = ABI25_0_0EXPermissionStatusGranted;
      break;
    case EKAuthorizationStatusRestricted:
    case EKAuthorizationStatusDenied:
      status = ABI25_0_0EXPermissionStatusDenied;
      break;
    case EKAuthorizationStatusNotDetermined:
      status = ABI25_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
           @"status": [ABI25_0_0EXPermissions permissionStringForStatus:status],
           @"expires": ABI25_0_0EXPermissionExpiresNever,
           };
}

- (void)requestPermissionsWithResolver:(ABI25_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject
{
  EKEventStore *eventStore = [[EKEventStore alloc] init];
  [eventStore requestAccessToEntityType:EKEntityTypeReminder completion:^(BOOL granted, NSError *error) {
    // Error code 100 is a when the user denies permission; in that case we don't want to reject.
    if (error && error.code != 100) {
      reject(@"E_REMINDERS_ERROR_UNKNOWN", error.localizedDescription, error);
    } else {
      resolve([[self class] permissions]);
    }
    
    if (_delegate) {
      [_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<ABI25_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
