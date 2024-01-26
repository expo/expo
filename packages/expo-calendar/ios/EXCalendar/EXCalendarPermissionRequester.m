#import <EXCalendar/EXCalendarPermissionRequester.h>
#import <EventKit/EventKit.h>
#import <ExpoModulesCore/EXDefines.h>

@implementation EXCalendarPermissionRequester

+ (NSString *)permissionType
{
  return @"calendar";
}

- (NSDictionary *)getPermissions
{
  EXPermissionStatus status;
  EKAuthorizationStatus permissions;
  
  NSString *description;
  if (@available(iOS 17, *)) {
    description = @"NSCalendarsFullAccessUsageDescription";
  } else {
    description = @"NSCalendarsUsageDescription";
  }
  
  NSString *calendarUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:description];
  
  if (!calendarUsageDescription) {
    NSString *message = [NSString stringWithFormat:@"This app is missing %@, so calendar methods will fail. Add this key to your bundle's Info.plist.", description];
    EXFatal(EXErrorWithMessage(message));
    permissions = EKAuthorizationStatusDenied;
  } else {
    permissions = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
  }
  
  switch (permissions) {
    case EKAuthorizationStatusAuthorized:
      status = EXPermissionStatusGranted;
      break;
    case EKAuthorizationStatusRestricted:
    case EKAuthorizationStatusDenied:
      status = EXPermissionStatusDenied;
      break;
    case EKAuthorizationStatusNotDetermined:
      status = EXPermissionStatusUndetermined;
      break;
  }
  
  return @{
    @"status": @(status)
  };
}

- (void)requestPermissionsWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject
{
  EKEventStore *eventStore = [[EKEventStore alloc] init];
  EX_WEAKIFY(self)
#if defined(__IPHONE_17_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >=__IPHONE_17_0 
  if (@available(iOS 17.0, *)) {
    [eventStore requestFullAccessToEventsWithCompletion:^(BOOL granted, NSError * _Nullable error) {
      EX_STRONGIFY(self)
      if (error && error.code != 100) {
        reject(@"E_CALENDAR_ERROR_UNKNOWN", error.localizedDescription, error);
      } else {
        resolve([self getPermissions]);
      }
    }];
  } else {
    [eventStore requestAccessToEntityType:EKEntityTypeEvent completion:^(BOOL granted, NSError *error) {
      EX_STRONGIFY(self)
      // Error code 100 is a when the user denies permission; in that case we don't want to reject.
      if (error && error.code != 100) {
        reject(@"E_CALENDAR_ERROR_UNKNOWN", error.localizedDescription, error);
      } else {
        resolve([self getPermissions]);
      }
    }];
  }
#else
    [eventStore requestAccessToEntityType:EKEntityTypeEvent completion:^(BOOL granted, NSError *error) {
      EX_STRONGIFY(self)
      // Error code 100 is a when the user denies permission; in that case we don't want to reject.
      if (error && error.code != 100) {
        reject(@"E_CALENDAR_ERROR_UNKNOWN", error.localizedDescription, error);
      } else {
        resolve([self getPermissions]);
      }
    }];
#endif
}


@end
