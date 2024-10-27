  // Copyright 2018-present 650 Industries. All rights reserved.

#pragma once

#if __has_include(<React-RCTAppDelegate/RCTRootViewFactory.h>)
#import <React-RCTAppDelegate/RCTRootViewFactory.h>
#elif __has_include(<React_RCTAppDelegate/RCTRootViewFactory.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTRootViewFactory.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface DevClientRootViewFactory : RCTRootViewFactory

@end

NS_ASSUME_NONNULL_END
