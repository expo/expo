// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
// UIResponder/UIApplicationDelegate below. CocoaPods supplies UIKit through its
// generated prefix header; SwiftPM has none, so import Expo's platform shim
// explicitly (it also aliases the UI* names to their AppKit equivalents on macOS).
#import <ExpoModulesCore/Platform.h>

NS_ASSUME_NONNULL_BEGIN

/**
 The legacy wrapper is still used to forward app delegate calls to singleton modules.
 See `EXAppDelegatesLoader.m` which registers this class as a subscriber of `ExpoAppDelegate`.
 */
#if TARGET_OS_OSX
@interface EXLegacyAppDelegateWrapper : NSResponder <NSApplicationDelegate>
#else
@interface EXLegacyAppDelegateWrapper : UIResponder <UIApplicationDelegate>
#endif

@end

NS_ASSUME_NONNULL_END
