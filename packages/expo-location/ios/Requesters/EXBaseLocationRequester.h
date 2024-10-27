// Copyright 2016-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocationManager.h>

#import <ExpoModulesCore/EXPermissionsInterface.h>

@interface EXBaseLocationRequester : NSObject<EXPermissionsRequester>

@property (nonatomic, strong) CLLocationManager *locationManager;
@property (nonatomic, strong) EXPromiseResolveBlock resolve;
@property (nonatomic, strong) EXPromiseRejectBlock reject;

+ (BOOL)isConfiguredForWhenInUseAuthorization;
+ (BOOL)isConfiguredForAlwaysAuthorization;

- (void)requestLocationPermissions;
- (NSDictionary *)parsePermissions:(CLAuthorizationStatus)systemStatus;

- (void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status;

@end
