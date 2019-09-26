#import <ABI33_0_0EXPermissions/ABI33_0_0EXCalendarRequester.h>
#import <EventKit/EventKit.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMDefines.h>

@interface ABI33_0_0EXCalendarRequester ()

@property (nonatomic, weak) id<ABI33_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI33_0_0EXCalendarRequester

+ (NSDictionary *)permissions
{
  ABI33_0_0EXPermissionStatus status;
  EKAuthorizationStatus permissions;
  
  NSString *calendarUsageDescription = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSCalendarsUsageDescription"];
  if (!calendarUsageDescription) {
    ABI33_0_0UMFatal(ABI33_0_0UMErrorWithMessage(@"This app is missing NSCalendarsUsageDescription, so calendar methods will fail. Add this key to your bundle's Info.plist."));
    permissions = EKAuthorizationStatusDenied;
  } else {
    permissions = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
  }
  switch (permissions) {
    case EKAuthorizationStatusAuthorized:
      status = ABI33_0_0EXPermissionStatusGranted;
      break;
    case EKAuthorizationStatusRestricted:
    case EKAuthorizationStatusDenied:
      status = ABI33_0_0EXPermissionStatusDenied;
      break;
    case EKAuthorizationStatusNotDetermined:
      status = ABI33_0_0EXPermissionStatusUndetermined;
      break;
  }
  return @{
    @"status": [ABI33_0_0EXPermissions permissionStringForStatus:status],
    @"expires": ABI33_0_0EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(ABI33_0_0UMPromiseResolveBlock)resolve rejecter:(ABI33_0_0UMPromiseRejectBlock)reject
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

- (void)setDelegate:(id<ABI33_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
