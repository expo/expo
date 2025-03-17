// Copyright 2015-present 650 Industries. All rights reserved.

#ifndef EXDevClientReactNativeFactory_h
#define EXDevClientReactNativeFactory_h

#import <ExpoModulesCore/EXReactNativeFactory.h>

// subclassing RCTReactNativeFactory appears to work in Bare Expo too, but it fails tests
@interface EXDevClientReactNativeFactory : EXReactNativeFactory

@end
#endif /* EXDevClientReactNativeFactory_h */

