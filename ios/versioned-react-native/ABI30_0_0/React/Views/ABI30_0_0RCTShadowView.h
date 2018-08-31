/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI30_0_0/ABI30_0_0RCTComponent.h>
#import <ReactABI30_0_0/ABI30_0_0RCTLayout.h>
#import <ReactABI30_0_0/ABI30_0_0RCTRootView.h>
#import <ABI30_0_0yoga/ABI30_0_0Yoga.h>

@class ABI30_0_0RCTRootShadowView;
@class ABI30_0_0RCTSparseArray;

typedef void (^ABI30_0_0RCTApplierBlock)(NSDictionary<NSNumber *, UIView *> *viewRegistry);

/**
 * ShadowView tree mirrors ABI30_0_0RCT view tree. Every node is highly stateful.
 * 1. A node is in one of three lifecycles: uninitialized, computed, dirtied.
 * 1. ABI30_0_0RCTBridge may call any of the padding/margin/width/height/top/left setters. A setter would dirty
 *    the node and all of its ancestors.
 * 2. At the end of each Bridge transaction, we call collectUpdatedFrames:widthConstraint:heightConstraint
 *    at the root node to recursively lay out the entire hierarchy.
 * 3. If a node is "computed" and the constraint passed from above is identical to the constraint used to
 *    perform the last computation, we skip laying out the subtree entirely.
 */
@interface ABI30_0_0RCTShadowView : NSObject <ABI30_0_0RCTComponent>

/**
 * Yoga Config which will be used to create `yogaNode` property.
 * Override in subclass to enable special Yoga features.
 * Defaults to suitable to current device configuration.
 */
+ (ABI30_0_0YGConfigRef)yogaConfig;

/**
 * ABI30_0_0RCTComponent interface.
 */
- (NSArray<ABI30_0_0RCTShadowView *> *)ReactABI30_0_0Subviews NS_REQUIRES_SUPER;
- (ABI30_0_0RCTShadowView *)ReactABI30_0_0Superview NS_REQUIRES_SUPER;
- (void)insertReactABI30_0_0Subview:(ABI30_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex NS_REQUIRES_SUPER;
- (void)removeReactABI30_0_0Subview:(ABI30_0_0RCTShadowView *)subview NS_REQUIRES_SUPER;

@property (nonatomic, weak, readonly) ABI30_0_0RCTRootShadowView *rootView;
@property (nonatomic, weak, readonly) ABI30_0_0RCTShadowView *superview;
@property (nonatomic, assign, readonly) ABI30_0_0YGNodeRef yogaNode;
@property (nonatomic, copy) NSString *viewName;
@property (nonatomic, copy) ABI30_0_0RCTDirectEventBlock onLayout;

/**
 * Computed layout of the view.
 */
@property (nonatomic, assign) ABI30_0_0RCTLayoutMetrics layoutMetrics;

/**
 * In some cases we need a way to specify some environmental data to shadow view
 * to improve layout (or do something similar), so `localData` serves these needs.
 * For example, any stateful embedded native views may benefit from this.
 * Have in mind that this data is not supposed to interfere with the state of
 * the shadow view.
 * Please respect one-directional data flow of ReactABI30_0_0.
 * Use `-[ABI30_0_0RCTUIManager setLocalData:forView:]` to set this property
 * (to provide local/environmental data for a shadow view) from the main thread.
 */
- (void)setLocalData:(NSObject *)localData;

/**
 * isNewView - Used to track the first time the view is introduced into the hierarchy.  It is initialized YES, then is
 * set to NO in ABI30_0_0RCTUIManager after the layout pass is done and all frames have been extracted to be applied to the
 * corresponding UIViews.
 */
@property (nonatomic, assign, getter=isNewView) BOOL newView;

/**
 * Position and dimensions.
 * Defaults to { 0, 0, NAN, NAN }.
 */
@property (nonatomic, assign) ABI30_0_0YGValue top;
@property (nonatomic, assign) ABI30_0_0YGValue left;
@property (nonatomic, assign) ABI30_0_0YGValue bottom;
@property (nonatomic, assign) ABI30_0_0YGValue right;
@property (nonatomic, assign) ABI30_0_0YGValue start;
@property (nonatomic, assign) ABI30_0_0YGValue end;

@property (nonatomic, assign) ABI30_0_0YGValue width;
@property (nonatomic, assign) ABI30_0_0YGValue height;

@property (nonatomic, assign) ABI30_0_0YGValue minWidth;
@property (nonatomic, assign) ABI30_0_0YGValue maxWidth;
@property (nonatomic, assign) ABI30_0_0YGValue minHeight;
@property (nonatomic, assign) ABI30_0_0YGValue maxHeight;

/**
 * Convenient alias to `width` and `height` in pixels.
 * Defaults to NAN in case of non-pixel dimension.
 */
@property (nonatomic, assign) CGSize size;

/**
 * Border. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) float borderWidth;
@property (nonatomic, assign) float borderTopWidth;
@property (nonatomic, assign) float borderLeftWidth;
@property (nonatomic, assign) float borderBottomWidth;
@property (nonatomic, assign) float borderRightWidth;
@property (nonatomic, assign) float borderStartWidth;
@property (nonatomic, assign) float borderEndWidth;

/**
 * Margin. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) ABI30_0_0YGValue margin;
@property (nonatomic, assign) ABI30_0_0YGValue marginVertical;
@property (nonatomic, assign) ABI30_0_0YGValue marginHorizontal;
@property (nonatomic, assign) ABI30_0_0YGValue marginTop;
@property (nonatomic, assign) ABI30_0_0YGValue marginLeft;
@property (nonatomic, assign) ABI30_0_0YGValue marginBottom;
@property (nonatomic, assign) ABI30_0_0YGValue marginRight;
@property (nonatomic, assign) ABI30_0_0YGValue marginStart;
@property (nonatomic, assign) ABI30_0_0YGValue marginEnd;

/**
 * Padding. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) ABI30_0_0YGValue padding;
@property (nonatomic, assign) ABI30_0_0YGValue paddingVertical;
@property (nonatomic, assign) ABI30_0_0YGValue paddingHorizontal;
@property (nonatomic, assign) ABI30_0_0YGValue paddingTop;
@property (nonatomic, assign) ABI30_0_0YGValue paddingLeft;
@property (nonatomic, assign) ABI30_0_0YGValue paddingBottom;
@property (nonatomic, assign) ABI30_0_0YGValue paddingRight;
@property (nonatomic, assign) ABI30_0_0YGValue paddingStart;
@property (nonatomic, assign) ABI30_0_0YGValue paddingEnd;

/**
 * Flexbox properties. All zero/disabled by default
 */
@property (nonatomic, assign) ABI30_0_0YGFlexDirection flexDirection;
@property (nonatomic, assign) ABI30_0_0YGJustify justifyContent;
@property (nonatomic, assign) ABI30_0_0YGAlign alignSelf;
@property (nonatomic, assign) ABI30_0_0YGAlign alignItems;
@property (nonatomic, assign) ABI30_0_0YGAlign alignContent;
@property (nonatomic, assign) ABI30_0_0YGPositionType position;
@property (nonatomic, assign) ABI30_0_0YGWrap flexWrap;
@property (nonatomic, assign) ABI30_0_0YGDisplay display;

@property (nonatomic, assign) float flex;
@property (nonatomic, assign) float flexGrow;
@property (nonatomic, assign) float flexShrink;
@property (nonatomic, assign) ABI30_0_0YGValue flexBasis;

@property (nonatomic, assign) float aspectRatio;

/**
 * Interface direction (LTR or RTL)
 */
@property (nonatomic, assign) ABI30_0_0YGDirection direction;

/**
 * Clipping properties
 */
@property (nonatomic, assign) ABI30_0_0YGOverflow overflow;

/**
 * Represents the natural size of the view, which is used when explicit size is not set or is ambiguous.
 * Defaults to `{UIViewNoIntrinsicMetric, UIViewNoIntrinsicMetric}`.
 */
@property (nonatomic, assign) CGSize intrinsicContentSize;

#pragma mark - Layout

/**
 * Initiates layout starts from the view.
 */
- (void)layoutWithMinimumSize:(CGSize)minimumSize
                  maximumSize:(CGSize)maximumSize
              layoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
                layoutContext:(ABI30_0_0RCTLayoutContext)layoutContext;

/**
 * Applies computed layout metrics to the view.
 */
- (void)layoutWithMetrics:(ABI30_0_0RCTLayoutMetrics)layoutMetrics
            layoutContext:(ABI30_0_0RCTLayoutContext)layoutContext;

/**
 * Calculates (if needed) and applies layout to subviews.
 */
- (void)layoutSubviewsWithContext:(ABI30_0_0RCTLayoutContext)layoutContext;

/**
 * Measures shadow view without side-effects.
 * Default implementation uses Yoga for measuring.
 */
- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize;

/**
 * Returns whether or not this view can have any subviews.
 * Adding/inserting a child view to leaf view (`canHaveSubviews` equals `NO`)
 * will throw an error.
 * Return `NO` for components which must not have any descendants
 * (like <Image>, for example.)
 * Defaults to `YES`. Can be overridden in subclasses.
 * Don't confuse this with `isYogaLeafNode`.
 */
- (BOOL)canHaveSubviews;

/**
 * Returns whether or not this node acts as a leaf node in the eyes of Yoga.
 * For example `ABI30_0_0RCTTextShadowView` has children which it does not want Yoga
 * to lay out so in the eyes of Yoga it is a leaf node.
 * Defaults to `NO`. Can be overridden in subclasses.
 * Don't confuse this with `canHaveSubviews`.
 */
- (BOOL)isYogaLeafNode;

/**
 * As described in ABI30_0_0RCTComponent protocol.
 */
- (void)didUpdateReactABI30_0_0Subviews NS_REQUIRES_SUPER;
- (void)didSetProps:(NSArray<NSString *> *)changedProps NS_REQUIRES_SUPER;

/**
 * Computes the recursive offset, meaning the sum of all descendant offsets -
 * this is the sum of all positions inset from parents. This is not merely the
 * sum of `top`/`left`s, as this function uses the *actual* positions of
 * children, not the style specified positions - it computes this based on the
 * resulting layout. It does not yet compensate for native scroll view insets or
 * transforms or anchor points.
 */
- (CGRect)measureLayoutRelativeToAncestor:(ABI30_0_0RCTShadowView *)ancestor;

/**
 * Checks if the current shadow view is a descendant of the provided `ancestor`
 */
- (BOOL)viewIsDescendantOf:(ABI30_0_0RCTShadowView *)ancestor;

@end
