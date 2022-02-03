#import <ABI42_0_0EXCalendar/ABI42_0_0EXCalendarPermissionRequester.h>
#import <EventKit/EventKit.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMDefines.h>

@implementation ABI42_0_0EXCalendarPermissionRequester

+ (NSString *)permissionType
{
  return @"calendar";
}

- (NSDictionary *)getPermissions
{
  ABI42_0_0EXPermissionStatus status;
  EKAuthorizationStatus permissions;
  
  NSString *calendarUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCalendarsUsageDescription"];
  if (!calendarUsageDescription) {
    ABI42_0_0UMFatal(ABI42_0_0UMErrorWithMessage(@"This app is missing NSCalendarsUsageDescription, so calendar methods will fail. Add this key to your bundle's Info.plist."));
    permissions = EKAuthorizationStatusDenied;
  } else {
    permissions = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
  }
  switch (permissions) {
    case EKAuthorizationStatusAuthorized:
      status = ABI42_0_0EXPermissionStatusGranted;
      break;
    case EKAuthorizationStatusRestricted:
    case EKAuthorizationStatusDenied:
      status = ABI42_0_0EXPermissionStatusDenied;
      break;
    case EKAuthorizationStatusNotDetermined:
      status = ABI42_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve rejecter:(ABI42_0_0UMPromiseRejectBlock)reject
{
  EKEventStore *eventStore = [[EKEventStore alloc] init];
  ABI42_0_0UM_WEAKIFY(self)
  [eventStore requestAccessToEntityType:EKEntityTypeEvent completion:^(BOOL granted, NSError *error) {
    ABI42_0_0UM_STRONGIFY(self)
    // Error code 100 is a when the user denies permission; in that case we don't want to reject.
    if (error && error.code != 100) {
      reject(@"E_CALENDAR_ERROR_UNKNOWN", error.localizedDescription, error);
    } else {
      resolve([self getPermissions]);
    }
  }];
}


@end
