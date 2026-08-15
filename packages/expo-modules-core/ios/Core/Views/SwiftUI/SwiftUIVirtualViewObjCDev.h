// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#import <ExpoModulesCore/Platform.h>

NS_ASSUME_NONNULL_BEGIN

/**
 A UIView-based variant of SwiftUIVirtualViewObjC used in dev mode.
 Because it inherits from UIView, `insertSubview:` won't crash even when
 the component is incorrectly placed without a `<Host>` wrapper.
 `didMoveToSuperview` emits an RCTLogError to alert the developer.
 */
@interface SwiftUIVirtualViewObjCDev : UIView

// `tag` is inherited from UIView
@property (nonatomic, copy, nullable) NSString *componentName;

- (void)dispatchEvent:(nonnull NSString *)eventName payload:(nullable id)payload;

- (void)updateProps:(nonnull NSDictionary<NSString *, id> *)props NS_SWIFT_UI_ACTOR;

- (void)viewDidUpdateProps NS_SWIFT_UI_ACTOR;

- (void)setShadowNodeSize:(float) width height:(float) height;

- (void)setStyleSize:(nullable NSNumber *)width height:(nullable NSNumber *)height;

- (BOOL)supportsPropWithName:(nonnull NSString *)name;

/*
 * Called for mounting (attaching) a child component view inside `self` component view.
 */
- (void)mountChildComponentView:(nonnull UIView *)childComponentView index:(NSInteger)index;

/*
 * Called for unmounting (detaching) a child component view from `self` component view.
 */
- (void)unmountChildComponentView:(nonnull UIView *)childComponentView index:(NSInteger)index;

@end

NS_ASSUME_NONNULL_END
