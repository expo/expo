#import "ABI28_0_0EXRemindersRequester.h"
#import <EventKit/EventKit.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUtils.h>

@interface ABI28_0_0EXRemindersRequester ()

@property (nonatomic, weak) id<ABI28_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI28_0_0EXRemindersRequester

+ (NSDictionary *)permissions
{
  ABI28_0_0EXPermissionStatus status;
  EKAuthorizationStatus permissions;
  
  NSString *remindersUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSRemindersUsageDescription"];
  if (!remindersUsageDescription) {
    ABI28_0_0RCTFatal(ABI28_0_0RCTErrorWithMessage(@"This app is missing NSRemindersUsageDescription, so reminders methods will fail. Add this key to your bundle's Info.plist."));
    permissions = EKAuthorizationStatusDenied;
  } else {
    permissions = [EKEventStore authorizationStatusForEntityType:EKEntityTypeReminder];
  }
  switch (permissions) {
    case EKAuthorizationStatusAuthorized:
      status = ABI28_0_0EXPermissionStatusGranted;
      break;
    case EKAuthorizationStatusRestricted:
    case EKAuthorizationStatusDenied:
      status = ABI28_0_0EXPermissionStatusDenied;
      break;
    case EKAuthorizationStatusNotDetermined:
      status = ABI28_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
           @"status": [ABI28_0_0EXPermissions permissionStringForStatus:status],
           @"expires": ABI28_0_0EXPermissionExpiresNever,
           };
}

- (void)requestPermissionsWithResolver:(ABI28_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject
{
  EKEventStore *eventStore = [[EKEventStore alloc] init];
  [eventStore requestAccessToEntityType:EKEntityTypeReminder completion:^(BOOL granted, NSError *error) {
    NSDictionary *result;
    // Error code 100 is a when the user denies permission; in that case we don't want to reject.
    if (error && error.code != 100) {
      reject(@"E_REMINDERS_ERROR_UNKNOWN", error.localizedDescription, error);
    } else {
      result = [[self class] permissions];
      resolve(result);
    }
    
    if (_delegate) {
      [_delegate permissionsRequester:self didFinishWithResult:result];
    }
  }];
}

- (void)setDelegate:(id<ABI28_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
