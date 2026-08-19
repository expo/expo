// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/ExpoModulesCore.h>
#import <Expo/RCTAppDelegateUmbrella.h>

@protocol RCTHostDelegate;
@protocol RCTHostRuntimeDelegate;

NS_SWIFT_NAME(ExpoReactNativeFactoryObjC)
#if !TARGET_OS_OSX
@interface EXReactNativeFactory : RCTReactNativeFactory <RCTHostDelegate>
#else
// TODO: remove when bumping to react-native-macos 0.85
@interface EXReactNativeFactory : RCTReactNativeFactory <RCTHostDelegate, RCTHostRuntimeDelegate>
#endif

@end
