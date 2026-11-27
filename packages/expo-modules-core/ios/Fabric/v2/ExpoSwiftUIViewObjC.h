// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#import <ExpoModulesCore/Platform.h>
#import <ExpoModulesCore/EXViewEventEmitting.h>

NS_ASSUME_NONNULL_BEGIN

/**
 The Fabric component view of the SwiftUI views of Expo Modules v2. It's an `NSObject` that stands in for a `UIView`:
 the SwiftUI view or the `Host` that it's mounted in renders its SwiftUI view, so it needs no view of its own. Mounting
 it in a UIKit view throws an exception that names the missing `<Host>`. Its props are `NewViewProps`, like those of
 `ExpoNativeViewObjC`.
 */
@interface ExpoSwiftUIViewObjC : NSObject <EXViewEventEmitting>

@property (nonatomic) NSInteger tag;

#if TARGET_OS_OSX
// react-native-macos uses `reactTag` instead because `NSView.tag` is read-only
@property (nonatomic, copy, nullable) NSNumber *reactTag;
#endif

/**
 Called on the main thread when Fabric mounts new props, like `-[ExpoNativeViewObjC updateDecodedProps:]`. Implemented
 in Swift.
 */
- (void)updateDecodedProps:(nullable const void *)decodedProps NS_SWIFT_UI_ACTOR;

/**
 Called for mounting (attaching) a child component view inside `self` component view. Implemented in Swift.
 */
- (void)mountChildComponentView:(UIView *)childComponentView index:(NSInteger)index NS_SWIFT_UI_ACTOR;

/**
 Called for unmounting (detaching) a child component view from `self` component view. Implemented in Swift.
 */
- (void)unmountChildComponentView:(UIView *)childComponentView index:(NSInteger)index NS_SWIFT_UI_ACTOR;

- (void)removeFromSuperview NS_SWIFT_UI_ACTOR;

@end

NS_ASSUME_NONNULL_END
