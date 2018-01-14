/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <CoreGraphics/CoreGraphics.h>

#import <Foundation/Foundation.h>

/**
 * These block types can be used for mapping input event handlers from JS to view
 * properties. Unlike JS method callbacks, these can be called multiple times.
 */
typedef void (^ABI25_0_0RCTDirectEventBlock)(NSDictionary *body);
typedef void (^ABI25_0_0RCTBubblingEventBlock)(NSDictionary *body);

/**
 * Logical node in a tree of application components. Both `ShadowView` and
 * `UIView` conforms to this. Allows us to write utilities that reason about
 * trees generally.
 */
@protocol ABI25_0_0RCTComponent <NSObject>

@property (nonatomic, copy) NSNumber *ReactABI25_0_0Tag;

- (void)insertReactABI25_0_0Subview:(id<ABI25_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex;
- (void)removeReactABI25_0_0Subview:(id<ABI25_0_0RCTComponent>)subview;
- (NSArray<id<ABI25_0_0RCTComponent>> *)ReactABI25_0_0Subviews;
- (id<ABI25_0_0RCTComponent>)ReactABI25_0_0Superview;
- (NSNumber *)ReactABI25_0_0TagAtPoint:(CGPoint)point;

// View/ShadowView is a root view
- (BOOL)isReactABI25_0_0RootView;

@optional

/**
 * Called each time props have been set.
 * Not all props have to be set - ReactABI25_0_0 can set only changed ones.
 * @param changedProps String names of all set props.
 */
- (void)didSetProps:(NSArray<NSString *> *)changedProps;

/**
 * Called each time subviews have been updated
 */
- (void)didUpdateReactABI25_0_0Subviews;

// TODO: Deprecate this
// This method is called after layout has been performed for all views known
// to the ABI25_0_0RCTViewManager. It is only called on UIViews, not shadow views.
- (void)ReactABI25_0_0BridgeDidFinishTransaction;

@end

// TODO: this is kinda dumb - let's come up with a
// better way of identifying root ReactABI25_0_0 views please!
static inline BOOL ABI25_0_0RCTIsReactABI25_0_0RootView(NSNumber *ReactABI25_0_0Tag)
{
  return ReactABI25_0_0Tag.integerValue % 10 == 1;
}
