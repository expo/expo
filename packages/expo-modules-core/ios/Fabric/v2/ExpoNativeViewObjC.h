// Copyright 2026-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>
#import <ExpoModulesCore/EXViewPropsDecoding.h>

#ifdef __cplusplus

#import <React/RCTViewComponentView.h> // Allows non-umbrella since it's coming from React-RCTFabric

/**
 The Fabric component view of the views of Expo Modules v2. Unlike `ExpoFabricViewObjC`, it
 uses the `expo::views` types: `NewComponentDescriptor` creates its shadow nodes, and its props are
 `NewViewProps` with the props that the Swift decoder decoded.
 */
@interface ExpoNativeViewObjC : RCTViewComponentView
@end

#else

// Interface visible in Swift. Swift sees the class as a `UIView` subclass, while the C++ implementation
// inherits from `RCTViewComponentView`. See `ExpoFabricViewObjC.h`.
#if TARGET_OS_OSX
#import <React/RCTUIKit.h>
@interface ExpoNativeViewObjC : RCTUIView
#else
@interface ExpoNativeViewObjC : UIView
#endif

/*
 * Called for mounting (attaching) a child component view inside `self` component view.
 * Declared in main interface (not category) so Swift subclasses can override.
 */
- (void)mountChildComponentView:(nonnull UIView *)childComponentView index:(NSInteger)index;

/*
 * Called for unmounting (detaching) a child component view from `self` component view.
 * Declared in main interface (not category) so Swift subclasses can override.
 */
- (void)unmountChildComponentView:(nonnull UIView *)childComponentView index:(NSInteger)index;

@end

#endif // __cplusplus

// Addition to the interface that is visible in both Swift and Objective-C
@interface ExpoNativeViewObjC (ExpoNativeViewInterface)

/**
 Called when Fabric mounts new props, with the decoded props that the props hold, or `nil` when no
 props of the view were decoded yet. Implemented in `ExpoNativeView.swift`.
 */
- (void)updateDecodedProps:(nullable id)decodedProps NS_SWIFT_UI_ACTOR;

#pragma mark - Component registration

/**
 Registers the given view class in the global `RCTComponentViewFactory` under its class name, as a
 component whose props the given decoder decodes. The class is registered once: its component
 descriptor keeps the decoder of the first registration, so its component handle stays the same after
 reloads.
 */
+ (void)registerComponentViewClass:(nonnull Class)viewClass
                      propsDecoder:(nonnull id<EXViewPropsDecoding>)propsDecoder NS_SWIFT_UI_ACTOR;

@end
