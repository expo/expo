// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/ExpoModulesCore.h>
#import <Expo/RCTAppDelegateUmbrella.h>

@protocol RCTHostDelegate;
@protocol RCTHostRuntimeDelegate;

NS_SWIFT_NAME(ExpoReactNativeFactoryObjC)
@interface EXReactNativeFactory : RCTReactNativeFactory <RCTHostDelegate, RCTHostRuntimeDelegate>

@end
