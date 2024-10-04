/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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
typedef void (^ABI44_0_0RCTDirectEventBlock)(NSDictionary *body);
typedef void (^ABI44_0_0RCTBubblingEventBlock)(NSDictionary *body);

/**
 * Logical node in a tree of application components. Both `ShadowView` and
 * `UIView` conforms to this. Allows us to write utilities that reason about
 * trees generally.
 */
@protocol ABI44_0_0RCTComponent <NSObject>

@property (nonatomic, copy) NSNumber *ABI44_0_0ReactTag;
@property (nonatomic, copy) NSNumber *rootTag;

- (void)insertABI44_0_0ReactSubview:(id<ABI44_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex;
- (void)removeABI44_0_0ReactSubview:(id<ABI44_0_0RCTComponent>)subview;
- (NSArray<id<ABI44_0_0RCTComponent>> *)ABI44_0_0ReactSubviews;
- (id<ABI44_0_0RCTComponent>)ABI44_0_0ReactSuperview;
- (NSNumber *)ABI44_0_0ReactTagAtPoint:(CGPoint)point;

// View/ShadowView is a root view
- (BOOL)isABI44_0_0ReactRootView;

/**
 * Called each time props have been set.
 * Not all props have to be set - ABI44_0_0React can set only changed ones.
 * @param changedProps String names of all set props.
 */
- (void)didSetProps:(NSArray<NSString *> *)changedProps;

/**
 * Called each time subviews have been updated
 */
- (void)didUpdateABI44_0_0ReactSubviews;

@end

// TODO: this is kinda dumb - let's come up with a
// better way of identifying root ABI44_0_0React views please!
static inline BOOL ABI44_0_0RCTIsABI44_0_0ReactRootView(NSNumber *ABI44_0_0ReactTag)
{
  return ABI44_0_0ReactTag.integerValue % 10 == 1;
}
