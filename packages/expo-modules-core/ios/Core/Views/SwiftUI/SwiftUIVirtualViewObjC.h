// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#import <ExpoModulesCore/Platform.h>

NS_ASSUME_NONNULL_BEGIN

/**
 An NSObject acting as a fake UIView for RCTMountingManager to represent a SwiftUI view.
 */
@interface SwiftUIVirtualViewObjC : NSObject

@property (nonatomic) NSInteger tag;
@property (nonatomic, copy, nullable) NSString *componentName;

/**
 The tag this view last published a content origin under.

 React Native zeroes `tag` when it recycles a component view, and it does so *before* calling
 `prepareForRecycle` or `invalidate`, so a teardown hook cannot use `tag` to find its own registry
 entry. Remembering it here is what lets the entry be removed rather than leaked.
 */
@property (nonatomic) NSInteger publishedContentOriginTag;

- (void)dispatchEvent:(nonnull NSString *)eventName payload:(nullable id)payload;

- (void)updateProps:(nonnull NSDictionary<NSString *, id> *)props NS_SWIFT_UI_ACTOR;

- (void)viewDidUpdateProps NS_SWIFT_UI_ACTOR;

- (void)setShadowNodeSize:(float) width height:(float) height;

- (void)setStyleSize:(nullable NSNumber *)width height:(nullable NSNumber *)height;

/**
 Publishes where SwiftUI drew this view's contents, relative to its host, so `measure()` matches
 what is on screen. Pass `CGPointZero`-equivalent by calling `clearContentOrigin`.
 */
- (void)setContentOrigin:(CGPoint)contentOrigin;

- (void)clearContentOrigin;

- (BOOL)supportsPropWithName:(nonnull NSString *)name;

/*
 * Called for mounting (attaching) a child component view inside `self` component view.
 */
- (void)mountChildComponentView:(nonnull UIView *)childComponentView index:(NSInteger)index NS_SWIFT_UI_ACTOR;

/*
 * Called for unmounting (detaching) a child component view from `self` component view.
 */
- (void)unmountChildComponentView:(nonnull UIView *)childComponentView index:(NSInteger)index NS_SWIFT_UI_ACTOR;

- (void)removeFromSuperview NS_SWIFT_UI_ACTOR;

@end

NS_ASSUME_NONNULL_END
