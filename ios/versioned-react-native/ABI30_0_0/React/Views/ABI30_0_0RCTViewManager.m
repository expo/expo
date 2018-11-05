/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTViewManager.h"

#import "ABI30_0_0RCTBorderStyle.h"
#import "ABI30_0_0RCTBridge.h"
#import "ABI30_0_0RCTConvert.h"
#import "ABI30_0_0RCTEventDispatcher.h"
#import "ABI30_0_0RCTLog.h"
#import "ABI30_0_0RCTShadowView.h"
#import "ABI30_0_0RCTUIManager.h"
#import "ABI30_0_0RCTUIManagerUtils.h"
#import "ABI30_0_0RCTUtils.h"
#import "ABI30_0_0RCTView.h"
#import "UIView+ReactABI30_0_0.h"
#import "ABI30_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI30_0_0RCTTVView.h"
#endif

@implementation ABI30_0_0RCTConvert(UIAccessibilityTraits)

ABI30_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI30_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI30_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI30_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI30_0_0RCTTVView new];
#else
  return [ABI30_0_0RCTView new];
#endif
}

- (ABI30_0_0RCTShadowView *)shadowView
{
  return [ABI30_0_0RCTShadowView new];
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

#pragma mark - View properties

#if TARGET_OS_TV
// Apple TV properties
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(nativeID, NSString)

// Acessibility related properties
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ReactABI30_0_0AccessibilityElement.isAccessibilityElement, BOOL)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ReactABI30_0_0AccessibilityElement.accessibilityActions, NSString)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ReactABI30_0_0AccessibilityElement.accessibilityLabel, NSString)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityTraits, ReactABI30_0_0AccessibilityElement.accessibilityTraits, UIAccessibilityTraits)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ReactABI30_0_0AccessibilityElement.accessibilityViewIsModal, BOOL)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ReactABI30_0_0AccessibilityElement.accessibilityElementsHidden, BOOL)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ReactABI30_0_0AccessibilityElement.onAccessibilityAction, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ReactABI30_0_0AccessibilityElement.onAccessibilityTap, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ReactABI30_0_0AccessibilityElement.onMagicTap, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(testID, ReactABI30_0_0AccessibilityElement.accessibilityIdentifier, NSString)

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI30_0_0YGOverflow, ABI30_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI30_0_0RCTConvert ABI30_0_0YGOverflow:json] != ABI30_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI30_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI30_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI30_0_0RCTView)
{
  view.layer.transform = json ? [ABI30_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI30_0_0RCTPointerEvents, ABI30_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI30_0_0RCTConvert ABI30_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI30_0_0RCTConvert ABI30_0_0RCTPointerEvents:json]) {
    case ABI30_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI30_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI30_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI30_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI30_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI30_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI30_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI30_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI30_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI30_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI30_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI30_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI30_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI30_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI30_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI30_0_0RCTBorderStyle, ABI30_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI30_0_0RCTConvert ABI30_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI30_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI30_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI30_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI30_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI30_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI30_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI30_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI30_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI30_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI30_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI30_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI30_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI30_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI30_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI30_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI30_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI30_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI30_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI30_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI30_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI30_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI30_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI30_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI30_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI30_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI30_0_0RCT_REMAP_VIEW_PROPERTY(display, ReactABI30_0_0Display, ABI30_0_0YGDisplay)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI30_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI30_0_0YGValue)

ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI30_0_0YGValue)

ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI30_0_0YGValue)

ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI30_0_0YGValue)

ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI30_0_0YGValue)

ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI30_0_0YGValue)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI30_0_0YGFlexDirection)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI30_0_0YGWrap)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI30_0_0YGJustify)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI30_0_0YGAlign)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI30_0_0YGAlign)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI30_0_0YGAlign)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI30_0_0YGPositionType)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI30_0_0YGOverflow)
ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI30_0_0YGDisplay)

ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI30_0_0RCTDirectEventBlock)

ABI30_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI30_0_0YGDirection)

@end
