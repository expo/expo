/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "ABI7_0_0Layout.h"
#import "ABI7_0_0RCTComponent.h"
#import "ABI7_0_0RCTRootView.h"

@class ABI7_0_0RCTSparseArray;

typedef NS_ENUM(NSUInteger, ABI7_0_0RCTUpdateLifecycle) {
  ABI7_0_0RCTUpdateLifecycleUninitialized = 0,
  ABI7_0_0RCTUpdateLifecycleComputed,
  ABI7_0_0RCTUpdateLifecycleDirtied,
};

typedef void (^ABI7_0_0RCTApplierBlock)(NSDictionary<NSNumber *, UIView *> *viewRegistry);

/**
 * ShadowView tree mirrors ABI7_0_0RCT view tree. Every node is highly stateful.
 * 1. A node is in one of three lifecycles: uninitialized, computed, dirtied.
 * 1. ABI7_0_0RCTBridge may call any of the padding/margin/width/height/top/left setters. A setter would dirty
 *    the node and all of its ancestors.
 * 2. At the end of each Bridge transaction, we call collectUpdatedFrames:widthConstraint:heightConstraint
 *    at the root node to recursively lay out the entire hierarchy.
 * 3. If a node is "computed" and the constraint passed from above is identical to the constraint used to
 *    perform the last computation, we skip laying out the subtree entirely.
 */
@interface ABI7_0_0RCTShadowView : NSObject <ABI7_0_0RCTComponent>

- (NSArray<ABI7_0_0RCTShadowView *> *)ReactABI7_0_0Subviews;
- (ABI7_0_0RCTShadowView *)ReactABI7_0_0Superview;

@property (nonatomic, weak, readonly) ABI7_0_0RCTShadowView *superview;
@property (nonatomic, assign, readonly) css_node_t *cssNode;
@property (nonatomic, copy) NSString *viewName;
@property (nonatomic, strong) UIColor *backgroundColor; // Used to propagate to children
@property (nonatomic, assign) ABI7_0_0RCTUpdateLifecycle layoutLifecycle;
@property (nonatomic, copy) ABI7_0_0RCTDirectEventBlock onLayout;

/**
 * isNewView - Used to track the first time the view is introduced into the hierarchy.  It is initialized YES, then is
 * set to NO in ABI7_0_0RCTUIManager after the layout pass is done and all frames have been extracted to be applied to the
 * corresponding UIViews.
 */
@property (nonatomic, assign, getter=isNewView) BOOL newView;

/**
 * isHidden - ABI7_0_0RCTUIManager uses this to determine whether or not the UIView should be hidden. Useful if the
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
@property (nonatomic, assign) css_flex_direction_t flexDirection;
@property (nonatomic, assign) css_justify_t justifyContent;
@property (nonatomic, assign) css_align_t alignSelf;
@property (nonatomic, assign) css_align_t alignItems;
@property (nonatomic, assign) css_position_type_t position;
@property (nonatomic, assign) css_wrap_type_t flexWrap;
@property (nonatomic, assign) CGFloat flex;

/**
 * Calculate property changes that need to be propagated to the view.
 * The applierBlocks set contains ABI7_0_0RCTApplierBlock functions that must be applied
 * on the main thread in order to update the view.
 */
- (void)collectUpdatedProperties:(NSMutableSet<ABI7_0_0RCTApplierBlock> *)applierBlocks
                parentProperties:(NSDictionary<NSString *, id> *)parentProperties;

/**
 * Process the updated properties and apply them to view. Shadow view classes
 * that add additional propagating properties should override this method.
 */
- (NSDictionary<NSString *, id> *)processUpdatedProperties:(NSMutableSet<ABI7_0_0RCTApplierBlock> *)applierBlocks
                                          parentProperties:(NSDictionary<NSString *, id> *)parentProperties NS_REQUIRES_SUPER;

/**
 * Can be called by a parent on a child in order to calculate all views whose frame needs
 * updating in that branch. Adds these frames to `viewsWithNewFrame`. Useful if layout
 * enters a view where flex doesn't apply (e.g. Text) and then you want to resume flex
 * layout on a subview.
 */
- (void)collectUpdatedFrames:(NSMutableSet<ABI7_0_0RCTShadowView *> *)viewsWithNewFrame
                   withFrame:(CGRect)frame
                      hidden:(BOOL)hidden
            absolutePosition:(CGPoint)absolutePosition;

/**
 * Recursively apply layout to children.
 * The job of applyLayoutNode:viewsWithNewFrame:absolutePosition is to apply the layout to
 * this node.
 * The job of applyLayoutToChildren:viewsWithNewFrame:absolutePosition is to enumerate the
 * children and tell them to apply layout.
 * The functionality is split into two methods so subclasses can override applyLayoutToChildren
 * while using the default implementation of applyLayoutNode.
 */
- (void)applyLayoutNode:(css_node_t *)node
      viewsWithNewFrame:(NSMutableSet<ABI7_0_0RCTShadowView *> *)viewsWithNewFrame
       absolutePosition:(CGPoint)absolutePosition NS_REQUIRES_SUPER;
- (void)applyLayoutToChildren:(css_node_t *)node
            viewsWithNewFrame:(NSMutableSet<ABI7_0_0RCTShadowView *> *)viewsWithNewFrame
             absolutePosition:(CGPoint)absolutePosition;

/**
 * The following are implementation details exposed to subclasses. Do not call them directly
 */
- (void)fillCSSNode:(css_node_t *)node NS_REQUIRES_SUPER;
- (void)dirtyLayout NS_REQUIRES_SUPER;
- (BOOL)isLayoutDirty;

- (void)dirtyPropagation NS_REQUIRES_SUPER;
- (BOOL)isPropagationDirty;

- (void)dirtyText NS_REQUIRES_SUPER;
- (void)setTextComputed NS_REQUIRES_SUPER;
- (BOOL)isTextDirty;

- (void)didSetProps:(NSArray<NSString *> *)changedProps NS_REQUIRES_SUPER;

/**
 * Computes the recursive offset, meaning the sum of all descendant offsets -
 * this is the sum of all positions inset from parents. This is not merely the
 * sum of `top`/`left`s, as this function uses the *actual* positions of
 * children, not the style specified positions - it computes this based on the
 * resulting layout. It does not yet compensate for native scroll view insets or
 * transforms or anchor points.
 */
- (CGRect)measureLayoutRelativeToAncestor:(ABI7_0_0RCTShadowView *)ancestor;

@end
