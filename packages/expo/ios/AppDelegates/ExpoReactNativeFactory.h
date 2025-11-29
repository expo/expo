// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/ExpoModulesCore.h>
#import <Expo/RCTAppDelegateUmbrella.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RCTHostDelegate;
@protocol RCTHostRuntimeDelegate;

NS_SWIFT_NAME(ExpoReactNativeFactoryObjC)
@interface EXReactNativeFactory : RCTReactNativeFactory

- (nonnull EXAppContext *)appContext;

@end

#ifdef __cplusplus
@interface EXReactNativeFactory (Cxx) <RCTHostDelegate, RCTHostRuntimeDelegate, RCTTurboModuleManagerDelegate>
@end
#endif // __cplusplus

NS_ASSUME_NONNULL_END
