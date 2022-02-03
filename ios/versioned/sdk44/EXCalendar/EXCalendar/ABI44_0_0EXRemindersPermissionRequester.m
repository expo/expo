#import <ABI44_0_0EXCalendar/ABI44_0_0EXRemindersPermissionRequester.h>
#import <EventKit/EventKit.h>


@implementation ABI44_0_0EXRemindersPermissionRequester

+ (NSString *)permissionType
{
  return @"reminders";
}

- (NSDictionary *)getPermissions
{
  ABI44_0_0EXPermissionStatus status;
  EKAuthorizationStatus permissions;
  
  NSString *remindersUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSRemindersUsageDescription"];
  if (!remindersUsageDescription) {
    ABI44_0_0EXFatal(ABI44_0_0EXErrorWithMessage(@"This app is missing NSRemindersUsageDescription, so reminders methods will fail. Add this key to your bundle's Info.plist."));
    permissions = EKAuthorizationStatusDenied;
  } else {
    permissions = [EKEventStore authorizationStatusForEntityType:EKEntityTypeReminder];
  }
  switch (permissions) {
    case EKAuthorizationStatusAuthorized:
      status = ABI44_0_0EXPermissionStatusGranted;
      break;
    case EKAuthorizationStatusRestricted:
    case EKAuthorizationStatusDenied:
      status = ABI44_0_0EXPermissionStatusDenied;
      break;
    case EKAuthorizationStatusNotDetermined:
      status = ABI44_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
           @"status": @(status)
          };
}

- (void)requestPermissionsWithResolver:(ABI44_0_0EXPromiseResolveBlock)resolve rejecter:(ABI44_0_0EXPromiseRejectBlock)reject
{
  EKEventStore *eventStore = [[EKEventStore alloc] init];
  ABI44_0_0EX_WEAKIFY(self)
  [eventStore requestAccessToEntityType:EKEntityTypeReminder completion:^(BOOL granted, NSError *error) {
    ABI44_0_0EX_STRONGIFY(self)
    // Error code 100 is a when the user denies permission; in that case we don't want to reject.
    if (error && error.code != 100) {
      reject(@"E_REMINDERS_ERROR_UNKNOWN", error.localizedDescription, error);
    } else {
      resolve([self getPermissions]);
    }
  }];
}

@end
