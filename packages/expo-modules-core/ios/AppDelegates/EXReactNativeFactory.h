// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<React-RCTAppDelegate/RCTReactNativeFactory.h>)
#import <React-RCTAppDelegate/RCTReactNativeFactory.h>
#elif __has_include(<React_RCTAppDelegate/RCTReactNativeFactory.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTReactNativeFactory.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface EXReactNativeFactory : RCTReactNativeFactory

@end

NS_ASSUME_NONNULL_END
