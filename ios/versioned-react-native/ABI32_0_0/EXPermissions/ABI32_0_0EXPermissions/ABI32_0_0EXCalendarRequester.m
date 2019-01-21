#import <ABI32_0_0EXPermissions/ABI32_0_0EXCalendarRequester.h>
#import <EventKit/EventKit.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXDefines.h>

@interface ABI32_0_0EXCalendarRequester ()

@property (nonatomic, weak) id<ABI32_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI32_0_0EXCalendarRequester

+ (NSDictionary *)permissions
{
  ABI32_0_0EXPermissionStatus status;
  EKAuthorizationStatus permissions;
  
  NSString *calendarUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCalendarsUsageDescription"];
  if (!calendarUsageDescription) {
    ABI32_0_0EXFatal(ABI32_0_0EXErrorWithMessage(@"This app is missing NSCalendarsUsageDescription, so calendar methods will fail. Add this key to your bundle's Info.plist."));
    permissions = EKAuthorizationStatusDenied;
  } else {
    permissions = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
  }
  switch (permissions) {
    case EKAuthorizationStatusAuthorized:
      status = ABI32_0_0EXPermissionStatusGranted;
      break;
    case EKAuthorizationStatusRestricted:
    case EKAuthorizationStatusDenied:
      status = ABI32_0_0EXPermissionStatusDenied;
      break;
    case EKAuthorizationStatusNotDetermined:
      status = ABI32_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": [ABI32_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI32_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI32_0_0EXPromiseResolveBlock)resolve rejecter:(ABI32_0_0EXPromiseRejectBlock)reject
{
  EKEventStore *eventStore = [[EKEventStore alloc] init];
  [eventStore requestAccessToEntityType:EKEntityTypeEvent completion:^(BOOL granted, NSError *error) {
    // Error code 100 is a when the user denies permission; in that case we don't want to reject.
    if (error && error.code != 100) {
      reject(@"E_CALENDAR_ERROR_UNKNOWN", error.localizedDescription, error);
    } else {
      resolve([[self class] permissions]);
    }

    if (self->_delegate) {
      [self->_delegate permissionRequesterDidFinish:self];
    }
  }];
}

- (void)setDelegate:(id<ABI32_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
