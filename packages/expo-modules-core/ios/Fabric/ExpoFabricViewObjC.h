// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/React-Core-umbrella.h>

#ifdef __cplusplus

#import <React/RCTViewComponentView.h> // Allows non-umbrella since it's coming from React-RCTFabric

@interface ExpoFabricViewObjC : RCTViewComponentView
@end

#else

// Interface visible in Swift
@interface ExpoFabricViewObjC
@end

#endif // __cplusplus
#else // Paper

@interface ExpoFabricViewObjC : RCTView
@end

#endif // !RCT_NEW_ARCH_ENABLED

@class EXAppContext;

// Addition to the interface that is visible in both Swift and Objective-C
@interface ExpoFabricViewObjC (ExpoFabricViewInterface)

- (void)dispatchEvent:(nonnull NSString *)eventName payload:(nullable id)payload;

- (void)updateProps:(nonnull NSDictionary<NSString *, id> *)props;

- (void)viewDidUpdateProps;

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

@end
