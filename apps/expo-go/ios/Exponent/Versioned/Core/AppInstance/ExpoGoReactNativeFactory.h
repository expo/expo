#import <ExpoModulesCore/ExpoModulesCore.h>
#import <Expo/RCTAppDelegateUmbrella.h>

@protocol RCTHostDelegate;
@protocol RCTHostRuntimeDelegate;

@interface ExpoGoReactNativeFactory : RCTReactNativeFactory <RCTHostDelegate, RCTHostRuntimeDelegate>

@end
