/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreGraphics/CoreGraphics.h>

#import <Foundation/Foundation.h>

/**
 * These block types can be used for mapping input event handlers from JS to view
 * properties. Unlike JS method callbacks, these can be called multiple times.
 */
typedef void (^ABI28_0_0RCTDirectEventBlock)(NSDictionary *body);
typedef void (^ABI28_0_0RCTBubblingEventBlock)(NSDictionary *body);

/**
 * Logical node in a tree of application components. Both `ShadowView` and
 * `UIView` conforms to this. Allows us to write utilities that reason about
 * trees generally.
 */
@protocol ABI28_0_0RCTComponent <NSObject>

@property (nonatomic, copy) NSNumber *ReactABI28_0_0Tag;

- (void)insertReactABI28_0_0Subview:(id<ABI28_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex;
- (void)removeReactABI28_0_0Subview:(id<ABI28_0_0RCTComponent>)subview;
- (NSArray<id<ABI28_0_0RCTComponent>> *)ReactABI28_0_0Subviews;
- (id<ABI28_0_0RCTComponent>)ReactABI28_0_0Superview;
- (NSNumber *)ReactABI28_0_0TagAtPoint:(CGPoint)point;

// View/ShadowView is a root view
- (BOOL)isReactABI28_0_0RootView;

/**
 * Called each time props have been set.
 * Not all props have to be set - ReactABI28_0_0 can set only changed ones.
 * @param changedProps String names of all set props.
 */
- (void)didSetProps:(NSArray<NSString *> *)changedProps;

/**
 * Called each time subviews have been updated
 */
- (void)didUpdateReactABI28_0_0Subviews;

@end

// TODO: this is kinda dumb - let's come up with a
// better way of identifying root ReactABI28_0_0 views please!
static inline BOOL ABI28_0_0RCTIsReactABI28_0_0RootView(NSNumber *ReactABI28_0_0Tag)
{
  return ReactABI28_0_0Tag.integerValue % 10 == 1;
}
