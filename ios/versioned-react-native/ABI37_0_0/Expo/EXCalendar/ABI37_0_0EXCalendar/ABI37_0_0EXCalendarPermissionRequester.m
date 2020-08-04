#import <ABI37_0_0EXCalendar/ABI37_0_0EXCalendarPermissionRequester.h>
#import <EventKit/EventKit.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMDefines.h>

@implementation ABI37_0_0EXCalendarPermissionRequester

+ (NSString *)permissionType
{
  return @"calendar";
}

- (NSDictionary *)getPermissions
{
  ABI37_0_0UMPermissionStatus status;
  EKAuthorizationStatus permissions;
  
  NSString *calendarUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCalendarsUsageDescription"];
  if (!calendarUsageDescription) {
    ABI37_0_0UMFatal(ABI37_0_0UMErrorWithMessage(@"This app is missing NSCalendarsUsageDescription, so calendar methods will fail. Add this key to your bundle's Info.plist."));
    permissions = EKAuthorizationStatusDenied;
  } else {
    permissions = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
  }
  switch (permissions) {
    case EKAuthorizationStatusAuthorized:
      status = ABI37_0_0UMPermissionStatusGranted;
      break;
    case EKAuthorizationStatusRestricted:
    case EKAuthorizationStatusDenied:
      status = ABI37_0_0UMPermissionStatusDenied;
      break;
    case EKAuthorizationStatusNotDetermined:
      status = ABI37_0_0UMPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI37_0_0UMPromiseResolveBlock)resolve rejecter:(ABI37_0_0UMPromiseRejectBlock)reject
{
  EKEventStore *eventStore = [[EKEventStore alloc] init];
  ABI37_0_0UM_WEAKIFY(self)
  [eventStore requestAccessToEntityType:EKEntityTypeEvent completion:^(BOOL granted, NSError *error) {
    ABI37_0_0UM_STRONGIFY(self)
    // Error code 100 is a when the user denies permission; in that case we don't want to reject.
    if (error && error.code != 100) {
      reject(@"E_CALENDAR_ERROR_UNKNOWN", error.localizedDescription, error);
    } else {
      resolve([self getPermissions]);
    }
  }];
}


@end
