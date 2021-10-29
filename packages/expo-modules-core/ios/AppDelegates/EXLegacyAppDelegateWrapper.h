// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 The legacy wrapper is still used to forward app delegate calls to singleton modules.
 See `EXAppDelegatesLoader.m` which registers this class as a subscriber of `ExpoAppDelegate`.
 */
@interface EXLegacyAppDelegateWrapper : UIResponder <UIApplicationDelegate>

@end

NS_ASSUME_NONNULL_END
