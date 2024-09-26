// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>
#import <ExpoModulesCore/EXReactDelegateWrapper.h>

#import <React_RCTAppDelegate/React-RCTAppDelegate-umbrella.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXAppDelegateWrapper : RCTAppDelegate

@property (nonatomic, strong, readonly) EXReactDelegateWrapper *reactDelegate;

@end

NS_ASSUME_NONNULL_END
