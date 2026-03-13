// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>

#ifdef __cplusplus

#import <React/RCTViewComponentView.h> // Allows non-umbrella since it's coming from React-RCTFabric

@interface ExpoFabricViewObjC : RCTViewComponentView
@end

#else

#import <React/RCTView.h>

// Interface visible in Swift
@interface ExpoFabricViewObjC : RCTView
@end

#endif // __cplusplus

@class EXAppContext;
@class EXViewModuleWrapper;

// Addition to the interface that is visible in both Swift and Objective-C
@interface ExpoFabricViewObjC (ExpoFabricViewInterface)

- (void)dispatchEvent:(nonnull NSString *)eventName payload:(nullable id)payload;

- (void)updateProps:(nonnull NSDictionary<NSString *, id> *)props;

- (void)viewDidUpdateProps NS_SWIFT_UI_ACTOR;

- (void)setShadowNodeSize:(float)width height:(float)height;

- (void)setStyleSize:(nullable NSNumber *)width height:(nullable NSNumber *)height;

- (BOOL)supportsPropWithName:(nonnull NSString *)name;

// MARK: - Derived from RCTComponentViewProtocol

- (void)prepareForRecycle;

/*
 * Called for mounting (attaching) a child component view inside `self` component view.
 */
- (void)mountChildComponentView:(nonnull UIView *)childComponentView index:(NSInteger)index;

/*
 * Called for unmounting (detaching) a child component view from `self` component view.
 */
- (void)unmountChildComponentView:(nonnull UIView *)childComponentView index:(NSInteger)index;

#pragma mark - Component registration

/**
 Registers given view module in the global `RCTComponentViewFactory`.
 */
+ (void)registerComponent:(nonnull EXViewModuleWrapper *)viewModule appContext:(nonnull EXAppContext *)appContext;

@end
