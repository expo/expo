// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXScreenOrientation/EXScreenOrientationModule.h>

@interface EXScreenOrientationUtilities : NSObject

+ (BOOL)doesSupportOrientationMask:(UIInterfaceOrientationMask)orientationMask;
+ (NSDictionary *)getStringToOrientationJSDict;
+ (NSDictionary *)getOrientationJSToStringDict;
+ (NSDictionary *)getStringToOrientationLockJSDict;
+ (NSDictionary *)getOrientationLockJSToStringDict;
+ (EXOrientation)orientationNativeToJS:(UIInterfaceOrientationMask)orientationMask;
+ (EXOrientationLock)orientationLockNativeToJS:(UIInterfaceOrientationMask)orientationMask;
+ (UIInterfaceOrientationMask)orientationJSToNative:(EXOrientation)orientation;
+ (UIInterfaceOrientationMask)orientationLockJSToNative:(EXOrientationLock)orientationLock;
+ (EXOrientation)stringToOrientation:(NSString *)orientationString;
+ (NSString *)orientationToString:(EXOrientation)orientation;
+ (EXOrientationLock)stringToOrientationLock:(NSString *)orientationLockString;
+ (NSString *)orientationLockToString:(EXOrientationLock)orientationLock;
+ (NSString *)UIInterfaceOrientationToEXOrientation:(UIInterfaceOrientation)screenOrientation;
+ (UIInterfaceOrientation)UIDeviceOrientationToUIInterfaceOrientation:(UIDeviceOrientation)deviceOrientation;
+ (BOOL)doesOrientationMask:(UIInterfaceOrientationMask)orientationMask containOrientation:(UIInterfaceOrientation)orientation;
+ (UIInterfaceOrientation)defaultOrientationForOrientationMask:(UIInterfaceOrientationMask)orientationMask;

@end
