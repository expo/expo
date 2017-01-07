/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ABI13_0_0yoga/ABI13_0_0Yoga.h>
#import <ReactABI13_0_0/ABI13_0_0RCTComponent.h>
#import <ReactABI13_0_0/ABI13_0_0RCTRootView.h>

@class ABI13_0_0RCTSparseArray;

typedef NS_ENUM(NSUInteger, ABI13_0_0RCTUpdateLifecycle) {
  ABI13_0_0RCTUpdateLifecycleUninitialized = 0,
  ABI13_0_0RCTUpdateLifecycleComputed,
  ABI13_0_0RCTUpdateLifecycleDirtied,
};

typedef void (^ABI13_0_0RCTApplierBlock)(NSDictionary<NSNumber *, UIView *> *viewRegistry);

/**
 * ShadowView tree mirrors ABI13_0_0RCT view tree. Every node is highly stateful.
 * 1. A node is in one of three lifecycles: uninitialized, computed, dirtied.
 * 1. ABI13_0_0RCTBridge may call any of the padding/margin/width/height/top/left setters. A setter would dirty
 *    the node and all of its ancestors.
 * 2. At the end of each Bridge transaction, we call collectUpdatedFrames:widthConstraint:heightConstraint
 *    at the root node to recursively lay out the entire hierarchy.
 * 3. If a node is "computed" and the constraint passed from above is identical to the constraint used to
 *    perform the last computation, we skip laying out the subtree entirely.
 */
@interface ABI13_0_0RCTShadowView : NSObject <ABI13_0_0RCTComponent>

/**
 * ABI13_0_0RCTComponent interface.
 */
- (NSArray<ABI13_0_0RCTShadowView *> *)ReactABI13_0_0Subviews NS_REQUIRES_SUPER;
- (ABI13_0_0RCTShadowView *)ReactABI13_0_0Superview NS_REQUIRES_SUPER;
- (void)insertReactABI13_0_0Subview:(ABI13_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex NS_REQUIRES_SUPER;
- (void)removeReactABI13_0_0Subview:(ABI13_0_0RCTShadowView *)subview NS_REQUIRES_SUPER;

@property (nonatomic, weak, readonly) ABI13_0_0RCTShadowView *superview;
@property (nonatomic, assign, readonly) ABI13_0_0YGNodeRef cssNode;
@property (nonatomic, copy) NSString *viewName;
@property (nonatomic, strong) UIColor *backgroundColor; // Used to propagate to children
@property (nonatomic, copy) ABI13_0_0RCTDirectEventBlock onLayout;

/**
 * isNewView - Used to track the first time the view is introduced into the hierarchy.  It is initialized YES, then is
 * set to NO in ABI13_0_0RCTUIManager after the layout pass is done and all frames have been extracted to be applied to the
 * corresponding UIViews.
 */
@property (nonatomic, assign, getter=isNewView) BOOL newView;

/**
 * isHidden - ABI13_0_0RCTUIManager uses this to determine whether or not the UIView should be hidden. Useful if the
 * ShadowView determines that its UIView will be clipped and wants to hide it.
 */
@property (nonatomic, assign, getter=isHidden) BOOL hidden;

/**
 * Position and dimensions.
 * Defaults to { 0, 0, NAN, NAN }.
 */
@property (nonatomic, assign) float top;
@property (nonatomic, assign) float left;
@property (nonatomic, assign) float bottom;
@property (nonatomic, assign) float right;

@property (nonatomic, assign) float width;
@property (nonatomic, assign) float height;

@property (nonatomic, assign) float minWidth;
@property (nonatomic, assign) float maxWidth;
@property (nonatomic, assign) float minHeight;
@property (nonatomic, assign) float maxHeight;

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
@property (nonatomic, assign) float borderWidth;
@property (nonatomic, assign) float borderTopWidth;
@property (nonatomic, assign) float borderLeftWidth;
@property (nonatomic, assign) float borderBottomWidth;
@property (nonatomic, assign) float borderRightWidth;

/**
 * Margin. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) float margin;
@property (nonatomic, assign) float marginVertical;
@property (nonatomic, assign) float marginHorizontal;
@property (nonatomic, assign) float marginTop;
@property (nonatomic, assign) float marginLeft;
@property (nonatomic, assign) float marginBottom;
@property (nonatomic, assign) float marginRight;

/**
 * Padding. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) float padding;
@property (nonatomic, assign) float paddingVertical;
@property (nonatomic, assign) float paddingHorizontal;
@property (nonatomic, assign) float paddingTop;
@property (nonatomic, assign) float paddingLeft;
@property (nonatomic, assign) float paddingBottom;
@property (nonatomic, assign) float paddingRight;

- (UIEdgeInsets)paddingAsInsets;

/**
 * Flexbox properties. All zero/disabled by default
 */
@property (nonatomic, assign) ABI13_0_0YGFlexDirection flexDirection;
@property (nonatomic, assign) ABI13_0_0YGJustify justifyContent;
@property (nonatomic, assign) ABI13_0_0YGAlign alignSelf;
@property (nonatomic, assign) ABI13_0_0YGAlign alignItems;
@property (nonatomic, assign) ABI13_0_0YGPositionType position;
@property (nonatomic, assign) ABI13_0_0YGWrap flexWrap;

@property (nonatomic, assign) float flexGrow;
@property (nonatomic, assign) float flexShrink;
@property (nonatomic, assign) float flexBasis;

@property (nonatomic, assign) float aspectRatio;

- (void)setFlex:(float)flex;

/**
 * z-index, used to override sibling order in the view
 */
@property (nonatomic, assign) NSInteger zIndex;

/**
 * Clipping properties
 */
@property (nonatomic, assign) ABI13_0_0YGOverflow overflow;

/**
 * Calculate property changes that need to be propagated to the view.
 * The applierBlocks set contains ABI13_0_0RCTApplierBlock functions that must be applied
 * on the main thread in order to update the view.
 */
- (void)collectUpdatedProperties:(NSMutableSet<ABI13_0_0RCTApplierBlock> *)applierBlocks
                parentProperties:(NSDictionary<NSString *, id> *)parentProperties;

/**
 * Process the updated properties and apply them to view. Shadow view classes
 * that add additional propagating properties should override this method.
 */
- (NSDictionary<NSString *, id> *)processUpdatedProperties:(NSMutableSet<ABI13_0_0RCTApplierBlock> *)applierBlocks
                                          parentProperties:(NSDictionary<NSString *, id> *)parentProperties NS_REQUIRES_SUPER;

/**
 * Can be called by a parent on a child in order to calculate all views whose frame needs
 * updating in that branch. Adds these frames to `viewsWithNewFrame`. Useful if layout
 * enters a view where flex doesn't apply (e.g. Text) and then you want to resume flex
 * layout on a subview.
 */
- (void)collectUpdatedFrames:(NSMutableSet<ABI13_0_0RCTShadowView *> *)viewsWithNewFrame
                   withFrame:(CGRect)frame
                      hidden:(BOOL)hidden
            absolutePosition:(CGPoint)absolutePosition;

/**
 * Apply the CSS layout.
 * This method also calls `applyLayoutToChildren:` internally. The functionality
 * is split into two methods so subclasses can override `applyLayoutToChildren:`
 * while using default implementation of `applyLayoutNode:`.
 */
- (void)applyLayoutNode:(ABI13_0_0YGNodeRef)node
      viewsWithNewFrame:(NSMutableSet<ABI13_0_0RCTShadowView *> *)viewsWithNewFrame
       absolutePosition:(CGPoint)absolutePosition NS_REQUIRES_SUPER;

/**
 * Enumerate the child nodes and tell them to apply layout.
 */
- (void)applyLayoutToChildren:(ABI13_0_0YGNodeRef)node
            viewsWithNewFrame:(NSMutableSet<ABI13_0_0RCTShadowView *> *)viewsWithNewFrame
             absolutePosition:(CGPoint)absolutePosition;

/**
 * Return whether or not this node acts as a leaf node in the eyes of Yoga. For example
 * ABI13_0_0RCTShadowText has children which it does not want Yoga to lay out so in the eyes of
 * Yoga it is a leaf node.
 */
- (BOOL)isCSSLeafNode;

- (void)dirtyPropagation NS_REQUIRES_SUPER;
- (BOOL)isPropagationDirty;

- (void)dirtyText NS_REQUIRES_SUPER;
- (void)setTextComputed NS_REQUIRES_SUPER;
- (BOOL)isTextDirty;

/**
 * As described in ABI13_0_0RCTComponent protocol.
 */
- (void)didUpdateReactABI13_0_0Subviews NS_REQUIRES_SUPER;
- (void)didSetProps:(NSArray<NSString *> *)changedProps NS_REQUIRES_SUPER;

/**
 * Computes the recursive offset, meaning the sum of all descendant offsets -
 * this is the sum of all positions inset from parents. This is not merely the
 * sum of `top`/`left`s, as this function uses the *actual* positions of
 * children, not the style specified positions - it computes this based on the
 * resulting layout. It does not yet compensate for native scroll view insets or
 * transforms or anchor points.
 */
- (CGRect)measureLayoutRelativeToAncestor:(ABI13_0_0RCTShadowView *)ancestor;

/**
 * Checks if the current shadow view is a descendant of the provided `ancestor`
 */
- (BOOL)viewIsDescendantOf:(ABI13_0_0RCTShadowView *)ancestor;

@end
