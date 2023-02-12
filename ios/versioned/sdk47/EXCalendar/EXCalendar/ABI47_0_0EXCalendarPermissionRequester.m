#import <ABI47_0_0EXCalendar/ABI47_0_0EXCalendarPermissionRequester.h>
#import <EventKit/EventKit.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXDefines.h>

@implementation ABI47_0_0EXCalendarPermissionRequester

+ (NSString *)permissionType
{
  return @"calendar";
}

- (NSDictionary *)getPermissions
{
  ABI47_0_0EXPermissionStatus status;
  EKAuthorizationStatus permissions;
  
  NSString *calendarUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCalendarsUsageDescription"];
  if (!calendarUsageDescription) {
    ABI47_0_0EXFatal(ABI47_0_0EXErrorWithMessage(@"This app is missing NSCalendarsUsageDescription, so calendar methods will fail. Add this key to your bundle's Info.plist."));
    permissions = EKAuthorizationStatusDenied;
  } else {
    permissions = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
  }
  switch (permissions) {
    case EKAuthorizationStatusAuthorized:
      status = ABI47_0_0EXPermissionStatusGranted;
      break;
    case EKAuthorizationStatusRestricted:
    case EKAuthorizationStatusDenied:
      status = ABI47_0_0EXPermissionStatusDenied;
      break;
    case EKAuthorizationStatusNotDetermined:
      status = ABI47_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(ABI47_0_0EXPromiseResolveBlock)resolve rejecter:(ABI47_0_0EXPromiseRejectBlock)reject
{
  EKEventStore *eventStore = [[EKEventStore alloc] init];
  ABI47_0_0EX_WEAKIFY(self)
  [eventStore requestAccessToEntityType:EKEntityTypeEvent completion:^(BOOL granted, NSError *error) {
    ABI47_0_0EX_STRONGIFY(self)
    // Error code 100 is a when the user denies permission; in that case we don't want to reject.
    if (error && error.code != 100) {
      reject(@"E_CALENDAR_ERROR_UNKNOWN", error.localizedDescription, error);
    } else {
      resolve([self getPermissions]);
    }
  }];
}


@end
