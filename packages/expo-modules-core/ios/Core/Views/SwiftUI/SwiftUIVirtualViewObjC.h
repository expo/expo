// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#import <ExpoModulesCore/Platform.h>

NS_ASSUME_NONNULL_BEGIN

/**
 An NSObject acting as a fake UIView for RCTMountingManager to represent a SwiftUI view.
 */
@interface SwiftUIVirtualViewObjC : NSObject

@property (nonatomic) NSInteger tag;

- (void)dispatchEvent:(nonnull NSString *)eventName payload:(nullable id)payload;

- (void)updateProps:(nonnull NSDictionary<NSString *, id> *)props;

- (void)viewDidUpdateProps;

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

- (void)removeFromSuperview;

@end

NS_ASSUME_NONNULL_END
