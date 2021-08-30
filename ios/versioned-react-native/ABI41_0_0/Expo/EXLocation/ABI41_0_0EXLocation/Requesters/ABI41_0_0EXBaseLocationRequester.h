// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMPermissionsInterface/ABI41_0_0UMPermissionsInterface.h>
#import <CoreLocation/CLLocationManager.h>

@interface ABI41_0_0EXBaseLocationRequester : NSObject<ABI41_0_0UMPermissionsRequester>

@property (nonatomic, strong) CLLocationManager *locationManager;
@property (nonatomic, strong) ABI41_0_0UMPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI41_0_0UMPromiseRejectBlock reject;

+ (BOOL)isConfiguredForWhenInUseAuthorization;
+ (BOOL)isConfiguredForAlwaysAuthorization;

- (void)requestLocationPermissions;
- (NSDictionary *)parsePermissions:(CLAuthorizationStatus)systemStatus;

- (void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status;

@end
