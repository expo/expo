// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>

#ifdef __cplusplus

#import <React/RCTViewComponentView.h> // Allows non-umbrella since it's coming from React-RCTFabric

@interface ExpoFabricViewObjC : RCTViewComponentView
@end

#else

// Interface visible in Swift - we expose UIView inheritance so Swift sees this as a UIView subclass.
// The actual C++ implementation inherits from RCTViewComponentView (which is a UIView subclass).
// Methods that Swift needs to override must be declared here (not in a category) so Swift
// can properly override them.
@interface ExpoFabricViewObjC : UIView

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

// Forward declarations for ObjC compatibility - these are Swift classes with @objc(EX...) names
// We use the protocol for AppContext to allow proper Swift type bridging
@protocol EXAppContextProtocol;

// Addition to the interface that is visible in both Swift and Objective-C
@interface ExpoFabricViewObjC (ExpoFabricViewInterface)

- (void)dispatchEvent:(nonnull NSString *)eventName payload:(nullable id)payload;

- (void)updateProps:(nonnull NSDictionary<NSString *, id> *)props;

- (void)viewDidUpdateProps;

- (void)setShadowNodeSize:(float)width height:(float)height;

- (void)setStyleSize:(nullable NSNumber *)width height:(nullable NSNumber *)height;

- (BOOL)supportsPropWithName:(nonnull NSString *)name;

// MARK: - Derived from RCTComponentViewProtocol

- (void)prepareForRecycle;

#pragma mark - Component registration

/**
 Registers given view module in the global `RCTComponentViewFactory`.
 Uses `id` types to allow proper bridging of Swift classes with @objc(EX...) names.
 */
+ (void)registerComponent:(nonnull id)viewModule appContext:(nonnull id<EXAppContextProtocol>)appContext;

@end
