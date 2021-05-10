// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMPermissionsInterface/UMPermissionsInterface.h>
#import <CoreLocation/CLLocationManager.h>

@interface EXBaseLocationRequester : NSObject<UMPermissionsRequester>

@property (nonatomic, strong) CLLocationManager *locationManager;
@property (nonatomic, strong) UMPromiseResolveBlock resolve;
@property (nonatomic, strong) UMPromiseRejectBlock reject;

+ (BOOL)isConfiguredForWhenInUseAuthorization;
+ (BOOL)isConfiguredForAlwaysAuthorization;

- (void)requestLocationPermissions;
- (NSDictionary *)parsePermissions:(CLAuthorizationStatus)systemStatus;

- (void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status;

@end
