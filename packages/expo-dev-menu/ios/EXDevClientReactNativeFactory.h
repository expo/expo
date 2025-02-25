// Copyright 2015-present 650 Industries. All rights reserved.

#ifndef EXDevClientReactNativeFactory_h
#define EXDevClientReactNativeFactory_h

#if __has_include(<React-RCTAppDelegate/RCTReactNativeFactory.h>)
#import <React-RCTAppDelegate/RCTReactNativeFactory.h>
#elif __has_include(<React_RCTAppDelegate/RCTReactNativeFactory.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTReactNativeFactory.h>
#endif

@interface EXDevClientReactNativeFactory : RCTReactNativeFactory

@end
#endif /* EXDevClientReactNativeFactory_h */

