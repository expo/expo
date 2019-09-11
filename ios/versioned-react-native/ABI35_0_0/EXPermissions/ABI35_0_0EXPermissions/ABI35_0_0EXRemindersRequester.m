#import <ABI35_0_0EXPermissions/ABI35_0_0EXRemindersRequester.h>
#import <EventKit/EventKit.h>

@interface ABI35_0_0EXRemindersRequester ()

@property (nonatomic, weak) id<ABI35_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI35_0_0EXRemindersRequester

+ (NSDictionary *)permissions
{
  ABI35_0_0EXPermissionStatus status;
  EKAuthorizationStatus permissions;
  
  NSString *remindersUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSRemindersUsageDescription"];
  if (!remindersUsageDescription) {
    ABI35_0_0UMFatal(ABI35_0_0UMErrorWithMessage(@"This app is missing NSRemindersUsageDescription, so reminders methods will fail. Add this key to your bundle's Info.plist."));
    permissions = EKAuthorizationStatusDenied;
  } else {
    permissions = [EKEventStore authorizationStatusForEntityType:EKEntityTypeReminder];
  }
  switch (permissions) {
    case EKAuthorizationStatusAuthorized:
      status = ABI35_0_0EXPermissionStatusGranted;
      break;
    case EKAuthorizationStatusRestricted:
    case EKAuthorizationStatusDenied:
      status = ABI35_0_0EXPermissionStatusDenied;
      break;
    case EKAuthorizationStatusNotDetermined:
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
  EKEventStore *eventStore = [[EKEventStore alloc] init];
  [eventStore requestAccessToEntityType:EKEntityTypeReminder completion:^(BOOL granted, NSError *error) {
    // Error code 100 is a when the user denies permission; in that case we don't want to reject.
    if (error && error.code != 100) {
      reject(@"E_REMINDERS_ERROR_UNKNOWN", error.localizedDescription, error);
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
