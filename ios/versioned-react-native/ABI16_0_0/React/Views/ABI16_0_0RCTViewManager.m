/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0RCTViewManager.h"

#import "ABI16_0_0RCTBorderStyle.h"
#import "ABI16_0_0RCTBridge.h"
#import "ABI16_0_0RCTConvert.h"
#import "ABI16_0_0RCTEventDispatcher.h"
#import "ABI16_0_0RCTLog.h"
#import "ABI16_0_0RCTShadowView.h"
#import "ABI16_0_0RCTUIManager.h"
#import "ABI16_0_0RCTUtils.h"
#import "ABI16_0_0RCTView.h"
#import "UIView+ReactABI16_0_0.h"
#import "ABI16_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI16_0_0RCTTVView.h"
#endif

@implementation ABI16_0_0RCTConvert(UIAccessibilityTraits)

ABI16_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI16_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI16_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI16_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI16_0_0RCTTVView new];
#else
  return [ABI16_0_0RCTView new];
#endif
}

- (ABI16_0_0RCTShadowView *)shadowView
{
  return [ABI16_0_0RCTShadowView new];
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

- (ABI16_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused ABI16_0_0RCTShadowView *)shadowView
{
  return nil;
}

- (ABI16_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, ABI16_0_0RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

#if TARGET_OS_TV
// Apple TV properties
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI16_0_0RCT_REMAP_VIEW_PROPERTY(accessible, isAccessibilityElement, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityLabel, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityTraits, UIAccessibilityTraits)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityViewIsModal, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI16_0_0YGOverflow, ABI16_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI16_0_0RCTConvert ABI16_0_0YGOverflow:json] != ABI16_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI16_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI16_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI16_0_0RCTView)
{
  view.layer.transform = json ? [ABI16_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI16_0_0RCTPointerEvents, ABI16_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI16_0_0RCTConvert ABI16_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI16_0_0RCTConvert ABI16_0_0RCTPointerEvents:json]) {
    case ABI16_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI16_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI16_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI16_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI16_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI16_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI16_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI16_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI16_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI16_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI16_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI16_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI16_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI16_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI16_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI16_0_0RCTBorderStyle, ABI16_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI16_0_0RCTConvert ABI16_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI16_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI16_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onAccessibilityTap, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onMagicTap, ABI16_0_0RCTDirectEventBlock)

#define ABI16_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI16_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI16_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI16_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI16_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI16_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI16_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI16_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI16_0_0RCT_VIEW_BORDER_PROPERTY(Left)

#define ABI16_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI16_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI16_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI16_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI16_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI16_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI16_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI16_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)

ABI16_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI16_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI16_0_0YGValue);

ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI16_0_0YGValue)

ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI16_0_0YGValue)

ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI16_0_0YGValue)

ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI16_0_0YGValue)

ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI16_0_0YGValue)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI16_0_0YGFlexDirection)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI16_0_0YGWrap)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI16_0_0YGJustify)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI16_0_0YGAlign)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI16_0_0YGAlign)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI16_0_0YGAlign)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI16_0_0YGPositionType)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI16_0_0YGOverflow)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI16_0_0YGDisplay)

ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI16_0_0RCTDirectEventBlock)

ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(zIndex, NSInteger)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI16_0_0YGDirection)

@end
