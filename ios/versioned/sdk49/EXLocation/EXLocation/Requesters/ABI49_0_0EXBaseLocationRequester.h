// Copyright 2016-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocationManager.h>

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXPermissionsInterface.h>

@interface ABI49_0_0EXBaseLocationRequester : NSObject<ABI49_0_0EXPermissionsRequester>

@property (nonatomic, strong) CLLocationManager *locationManager;
@property (nonatomic, strong) ABI49_0_0EXPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI49_0_0EXPromiseRejectBlock reject;

+ (BOOL)isConfiguredForWhenInUseAuthorization;
+ (BOOL)isConfiguredForAlwaysAuthorization;

- (void)requestLocationPermissions;
- (NSDictionary *)parsePermissions:(CLAuthorizationStatus)systemStatus;

- (void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status;

@end
