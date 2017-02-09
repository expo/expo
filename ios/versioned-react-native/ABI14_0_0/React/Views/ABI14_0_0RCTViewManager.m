/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI14_0_0RCTViewManager.h"

#import "ABI14_0_0RCTBorderStyle.h"
#import "ABI14_0_0RCTBridge.h"
#import "ABI14_0_0RCTConvert.h"
#import "ABI14_0_0RCTEventDispatcher.h"
#import "ABI14_0_0RCTLog.h"
#import "ABI14_0_0RCTShadowView.h"
#import "ABI14_0_0RCTUIManager.h"
#import "ABI14_0_0RCTUtils.h"
#import "ABI14_0_0RCTView.h"
#import "UIView+ReactABI14_0_0.h"

#if TARGET_OS_TV
#import "ABI14_0_0RCTTVView.h"
#endif

@implementation ABI14_0_0RCTConvert(UIAccessibilityTraits)

ABI14_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
  @"none": @(UIAccessibilityTraitNone),
  @"button": @(UIAccessibilityTraitButton),
  @"link": @(UIAccessibilityTraitLink),
  @"header": @(UIAccessibilityTraitHeader),
  @"search": @(UIAccessibilityTraitSearchField),
  @"image": @(UIAccessibilityTraitImage),
  @"selected": @(UIAccessibilityTraitSelected),
  @"plays": @(UIAccessibilityTraitPlaysSound),
  @"key": @(UIAccessibilityTraitKeyboardKey),
  @"text": @(UIAccessibilityTraitStaticText),
  @"summary": @(UIAccessibilityTraitSummaryElement),
  @"disabled": @(UIAccessibilityTraitNotEnabled),
  @"frequentUpdates": @(UIAccessibilityTraitUpdatesFrequently),
  @"startsMedia": @(UIAccessibilityTraitStartsMediaSession),
  @"adjustable": @(UIAccessibilityTraitAdjustable),
  @"allowsDirectInteraction": @(UIAccessibilityTraitAllowsDirectInteraction),
  @"pageTurn": @(UIAccessibilityTraitCausesPageTurn),
}), UIAccessibilityTraitNone, unsignedLongLongValue)

@end

@implementation ABI14_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI14_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI14_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI14_0_0RCTTVView new];
#else
  return [ABI14_0_0RCTView new];
#endif
}

- (ABI14_0_0RCTShadowView *)shadowView
{
  return [ABI14_0_0RCTShadowView new];
}

- (NSArray<NSString *> *)customBubblingEventTypes
{
  return @[

    // Generic events
    @"press",
    @"change",
    @"focus",
    @"blur",
    @"submitEditing",
    @"endEditing",
    @"keyPress",

    // Touch events
    @"touchStart",
    @"touchMove",
    @"touchCancel",
    @"touchEnd",
  ];
}

- (ABI14_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused ABI14_0_0RCTShadowView *)shadowView
{
  return nil;
}

- (ABI14_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, ABI14_0_0RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

#if TARGET_OS_TV
// Apple TV properties
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityLabel, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityTraits, UIAccessibilityTraits)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(accessible, isAccessibilityElement, BOOL)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI14_0_0YGOverflow, ABI14_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI14_0_0RCTConvert ABI14_0_0YGOverflow:json] != ABI14_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI14_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI14_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}
// TODO: t11041683 Remove this duplicate property name.
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(transformMatrix, CATransform3D, ABI14_0_0RCTView)
{
  view.layer.transform = json ? [ABI14_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI14_0_0RCTView)
{
  view.layer.transform = json ? [ABI14_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI14_0_0RCTPointerEvents, ABI14_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI14_0_0RCTConvert ABI14_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI14_0_0RCTConvert ABI14_0_0RCTPointerEvents:json]) {
    case ABI14_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI14_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI14_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI14_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI14_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI14_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI14_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI14_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI14_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI14_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI14_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI14_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI14_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI14_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI14_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI14_0_0RCTBorderStyle, ABI14_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI14_0_0RCTConvert ABI14_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI14_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI14_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onAccessibilityTap, ABI14_0_0RCTDirectEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onMagicTap, ABI14_0_0RCTDirectEventBlock)

#define ABI14_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI14_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI14_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI14_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI14_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI14_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI14_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI14_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI14_0_0RCT_VIEW_BORDER_PROPERTY(Left)

#define ABI14_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI14_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI14_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI14_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI14_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI14_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI14_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI14_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)

ABI14_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI14_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(top, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(right, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(left, float);

ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(width, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(height, float)

ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, float)

ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, float)

ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, float)

ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, float)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI14_0_0YGFlexDirection)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI14_0_0YGWrap)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI14_0_0YGJustify)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI14_0_0YGAlign)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI14_0_0YGAlign)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI14_0_0YGPositionType)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI14_0_0YGOverflow)

ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI14_0_0RCTDirectEventBlock)

ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(zIndex, NSInteger)

@end
