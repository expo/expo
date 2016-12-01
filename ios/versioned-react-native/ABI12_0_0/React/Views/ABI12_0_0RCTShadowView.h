/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

//Internally we reference a separate library. See https://github.com/facebook/ReactABI12_0_0-native/pull/9544
#if __has_include(<CSSLayout/ABI12_0_0CSSLayout.h>)
#import <CSSLayout/ABI12_0_0CSSLayout.h>
#else
#import "ABI12_0_0CSSLayout.h"
#endif

#import "ABI12_0_0RCTComponent.h"
#import "ABI12_0_0RCTRootView.h"

@class ABI12_0_0RCTSparseArray;

typedef NS_ENUM(NSUInteger, ABI12_0_0RCTUpdateLifecycle) {
  ABI12_0_0RCTUpdateLifecycleUninitialized = 0,
  ABI12_0_0RCTUpdateLifecycleComputed,
  ABI12_0_0RCTUpdateLifecycleDirtied,
};

typedef void (^ABI12_0_0RCTApplierBlock)(NSDictionary<NSNumber *, UIView *> *viewRegistry);

/**
 * ShadowView tree mirrors ABI12_0_0RCT view tree. Every node is highly stateful.
 * 1. A node is in one of three lifecycles: uninitialized, computed, dirtied.
 * 1. ABI12_0_0RCTBridge may call any of the padding/margin/width/height/top/left setters. A setter would dirty
 *    the node and all of its ancestors.
 * 2. At the end of each Bridge transaction, we call collectUpdatedFrames:widthConstraint:heightConstraint
 *    at the root node to recursively lay out the entire hierarchy.
 * 3. If a node is "computed" and the constraint passed from above is identical to the constraint used to
 *    perform the last computation, we skip laying out the subtree entirely.
 */
@interface ABI12_0_0RCTShadowView : NSObject <ABI12_0_0RCTComponent>

/**
 * ABI12_0_0RCTComponent interface.
 */
- (NSArray<ABI12_0_0RCTShadowView *> *)ReactABI12_0_0Subviews NS_REQUIRES_SUPER;
- (ABI12_0_0RCTShadowView *)ReactABI12_0_0Superview NS_REQUIRES_SUPER;
- (void)insertReactABI12_0_0Subview:(ABI12_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex NS_REQUIRES_SUPER;
- (void)removeReactABI12_0_0Subview:(ABI12_0_0RCTShadowView *)subview NS_REQUIRES_SUPER;

@property (nonatomic, weak, readonly) ABI12_0_0RCTShadowView *superview;
@property (nonatomic, assign, readonly) ABI12_0_0CSSNodeRef cssNode;
@property (nonatomic, copy) NSString *viewName;
@property (nonatomic, strong) UIColor *backgroundColor; // Used to propagate to children
@property (nonatomic, copy) ABI12_0_0RCTDirectEventBlock onLayout;

/**
 * isNewView - Used to track the first time the view is introduced into the hierarchy.  It is initialized YES, then is
 * set to NO in ABI12_0_0RCTUIManager after the layout pass is done and all frames have been extracted to be applied to the
 * corresponding UIViews.
 */
@property (nonatomic, assign, getter=isNewView) BOOL newView;

/**
 * isHidden - ABI12_0_0RCTUIManager uses this to determine whether or not the UIView should be hidden. Useful if the
 * ShadowView determines that its UIView will be clipped and wants to hide it.
 */
@property (nonatomic, assign, getter=isHidden) BOOL hidden;

/**
 * Position and dimensions.
 * Defaults to { 0, 0, NAN, NAN }.
 */
@property (nonatomic, assign) CGFloat top;
@property (nonatomic, assign) CGFloat left;
@property (nonatomic, assign) CGFloat bottom;
@property (nonatomic, assign) CGFloat right;

@property (nonatomic, assign) CGFloat width;
@property (nonatomic, assign) CGFloat height;

@property (nonatomic, assign) CGFloat minWidth;
@property (nonatomic, assign) CGFloat maxWidth;
@property (nonatomic, assign) CGFloat minHeight;
@property (nonatomic, assign) CGFloat maxHeight;

@property (nonatomic, assign) CGRect frame;

- (void)setTopLeft:(CGPoint)topLeft;
- (void)setSize:(CGSize)size;

/**
 * Set the natural size of the view, which is used when no explicit size is set.
 * Use UIViewNoIntrinsicMetric to ignore a dimension.
 */
- (void)setIntrinsicContentSize:(CGSize)size;

/**
 * Border. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) CGFloat borderWidth;
@property (nonatomic, assign) CGFloat borderTopWidth;
@property (nonatomic, assign) CGFloat borderLeftWidth;
@property (nonatomic, assign) CGFloat borderBottomWidth;
@property (nonatomic, assign) CGFloat borderRightWidth;

/**
 * Margin. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) CGFloat margin;
@property (nonatomic, assign) CGFloat marginVertical;
@property (nonatomic, assign) CGFloat marginHorizontal;
@property (nonatomic, assign) CGFloat marginTop;
@property (nonatomic, assign) CGFloat marginLeft;
@property (nonatomic, assign) CGFloat marginBottom;
@property (nonatomic, assign) CGFloat marginRight;

/**
 * Padding. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) CGFloat padding;
@property (nonatomic, assign) CGFloat paddingVertical;
@property (nonatomic, assign) CGFloat paddingHorizontal;
@property (nonatomic, assign) CGFloat paddingTop;
@property (nonatomic, assign) CGFloat paddingLeft;
@property (nonatomic, assign) CGFloat paddingBottom;
@property (nonatomic, assign) CGFloat paddingRight;

- (UIEdgeInsets)paddingAsInsets;

/**
 * Flexbox properties. All zero/disabled by default
 */
@property (nonatomic, assign) ABI12_0_0CSSFlexDirection flexDirection;
@property (nonatomic, assign) ABI12_0_0CSSJustify justifyContent;
@property (nonatomic, assign) ABI12_0_0CSSAlign alignSelf;
@property (nonatomic, assign) ABI12_0_0CSSAlign alignItems;
@property (nonatomic, assign) ABI12_0_0CSSPositionType position;
@property (nonatomic, assign) ABI12_0_0CSSWrapType flexWrap;
@property (nonatomic, assign) CGFloat flex;
@property (nonatomic, assign) CGFloat flexGrow;
@property (nonatomic, assign) CGFloat flexShrink;
@property (nonatomic, assign) CGFloat flexBasis;

/**
 * z-index, used to override sibling order in the view
 */
@property (nonatomic, assign) NSInteger zIndex;

/**
 * Clipping properties
 */
@property (nonatomic, assign) ABI12_0_0CSSOverflow overflow;

/**
 * Calculate property changes that need to be propagated to the view.
 * The applierBlocks set contains ABI12_0_0RCTApplierBlock functions that must be applied
 * on the main thread in order to update the view.
 */
- (void)collectUpdatedProperties:(NSMutableSet<ABI12_0_0RCTApplierBlock> *)applierBlocks
                parentProperties:(NSDictionary<NSString *, id> *)parentProperties;

/**
 * Process the updated properties and apply them to view. Shadow view classes
 * that add additional propagating properties should override this method.
 */
- (NSDictionary<NSString *, id> *)processUpdatedProperties:(NSMutableSet<ABI12_0_0RCTApplierBlock> *)applierBlocks
                                          parentProperties:(NSDictionary<NSString *, id> *)parentProperties NS_REQUIRES_SUPER;

/**
 * Can be called by a parent on a child in order to calculate all views whose frame needs
 * updating in that branch. Adds these frames to `viewsWithNewFrame`. Useful if layout
 * enters a view where flex doesn't apply (e.g. Text) and then you want to resume flex
 * layout on a subview.
 */
- (void)collectUpdatedFrames:(NSMutableSet<ABI12_0_0RCTShadowView *> *)viewsWithNewFrame
                   withFrame:(CGRect)frame
                      hidden:(BOOL)hidden
            absolutePosition:(CGPoint)absolutePosition;

/**
 * Apply the ABI12_0_0CSS layout.
 * This method also calls `applyLayoutToChildren:` internally. The functionality
 * is split into two methods so subclasses can override `applyLayoutToChildren:`
 * while using default implementation of `applyLayoutNode:`.
 */
- (void)applyLayoutNode:(ABI12_0_0CSSNodeRef)node
      viewsWithNewFrame:(NSMutableSet<ABI12_0_0RCTShadowView *> *)viewsWithNewFrame
       absolutePosition:(CGPoint)absolutePosition NS_REQUIRES_SUPER;

/**
 * Enumerate the child nodes and tell them to apply layout.
 */
- (void)applyLayoutToChildren:(ABI12_0_0CSSNodeRef)node
            viewsWithNewFrame:(NSMutableSet<ABI12_0_0RCTShadowView *> *)viewsWithNewFrame
             absolutePosition:(CGPoint)absolutePosition;

/**
 * Return whether or not this node acts as a leaf node in the eyes of ABI12_0_0CSSLayout. For example
 * ABI12_0_0RCTShadowText has children which it does not want ABI12_0_0CSSLayout to lay out so in the eyes of
 * ABI12_0_0CSSLayout it is a leaf node.
 */
- (BOOL)isABI12_0_0CSSLeafNode;

- (void)dirtyPropagation NS_REQUIRES_SUPER;
- (BOOL)isPropagationDirty;

- (void)dirtyText NS_REQUIRES_SUPER;
- (void)setTextComputed NS_REQUIRES_SUPER;
- (BOOL)isTextDirty;

/**
 * As described in ABI12_0_0RCTComponent protocol.
 */
- (void)didUpdateReactABI12_0_0Subviews NS_REQUIRES_SUPER;
- (void)didSetProps:(NSArray<NSString *> *)changedProps NS_REQUIRES_SUPER;

/**
 * Computes the recursive offset, meaning the sum of all descendant offsets -
 * this is the sum of all positions inset from parents. This is not merely the
 * sum of `top`/`left`s, as this function uses the *actual* positions of
 * children, not the style specified positions - it computes this based on the
 * resulting layout. It does not yet compensate for native scroll view insets or
 * transforms or anchor points.
 */
- (CGRect)measureLayoutRelativeToAncestor:(ABI12_0_0RCTShadowView *)ancestor;

/**
 * Checks if the current shadow view is a descendant of the provided `ancestor`
 */
- (BOOL)viewIsDescendantOf:(ABI12_0_0RCTShadowView *)ancestor;

@end
