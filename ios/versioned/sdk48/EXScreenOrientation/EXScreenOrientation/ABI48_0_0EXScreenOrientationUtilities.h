// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXScreenOrientation/ABI48_0_0EXScreenOrientationModule.h>

@interface ABI48_0_0EXScreenOrientationUtilities : NSObject

+ (BOOL)isIPad;
+ (BOOL)doesDeviceSupportOrientationMask:(UIInterfaceOrientationMask)orientationMask;
+ (BOOL)doesOrientationMask:(UIInterfaceOrientationMask)orientationMask containOrientation:(UIInterfaceOrientation)orientation;
+ (UIInterfaceOrientation)defaultOrientationForOrientationMask:(UIInterfaceOrientationMask)orientationMask;
+ (UIInterfaceOrientation)interfaceOrientationFromDeviceOrientation:(UIDeviceOrientation)deviceOrientation;
+ (UIInterfaceOrientationMask)maskFromOrientation:(UIInterfaceOrientation)orientation;

// import/export

// orientationLock
+ (UIInterfaceOrientationMask)importOrientationLock:(NSNumber *)orientationLock;
+ (NSNumber *)exportOrientationLock:(UIInterfaceOrientationMask)orientationMask;

// orientation
+ (NSNumber *)exportOrientation:(UIInterfaceOrientation)orientation;
+ (UIInterfaceOrientation)importOrientation:(NSNumber *)orientation;


@end
