/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTViewManager.h"

#import "ABI41_0_0RCTBorderStyle.h"
#import "ABI41_0_0RCTBridge.h"
#import "ABI41_0_0RCTConvert+Transform.h"
#import "ABI41_0_0RCTConvert.h"
#import "ABI41_0_0RCTEventDispatcher.h"
#import "ABI41_0_0RCTLog.h"
#import "ABI41_0_0RCTShadowView.h"
#import "ABI41_0_0RCTUIManager.h"
#import "ABI41_0_0RCTUIManagerUtils.h"
#import "ABI41_0_0RCTUtils.h"
#import "ABI41_0_0RCTView.h"
#import "ABI41_0_0UIView+React.h"

#if TARGET_OS_TV
#import "ABI41_0_0RCTTVView.h"
#endif

@implementation ABI41_0_0RCTConvert (UIAccessibilityTraits)

ABI41_0_0RCT_MULTI_ENUM_CONVERTER(
    UIAccessibilityTraits,
    (@{
      @"none" : @(UIAccessibilityTraitNone),
      @"button" : @(UIAccessibilityTraitButton),
      @"link" : @(UIAccessibilityTraitLink),
      @"header" : @(UIAccessibilityTraitHeader),
      @"search" : @(UIAccessibilityTraitSearchField),
      @"image" : @(UIAccessibilityTraitImage),
      @"imagebutton" : @(UIAccessibilityTraitImage | UIAccessibilityTraitButton),
      @"selected" : @(UIAccessibilityTraitSelected),
      @"plays" : @(UIAccessibilityTraitPlaysSound),
      @"key" : @(UIAccessibilityTraitKeyboardKey),
      @"keyboardkey" : @(UIAccessibilityTraitKeyboardKey),
      @"text" : @(UIAccessibilityTraitStaticText),
      @"summary" : @(UIAccessibilityTraitSummaryElement),
      @"disabled" : @(UIAccessibilityTraitNotEnabled),
      @"frequentUpdates" : @(UIAccessibilityTraitUpdatesFrequently),
      @"startsMedia" : @(UIAccessibilityTraitStartsMediaSession),
      @"adjustable" : @(UIAccessibilityTraitAdjustable),
      @"allowsDirectInteraction" : @(UIAccessibilityTraitAllowsDirectInteraction),
      @"pageTurn" : @(UIAccessibilityTraitCausesPageTurn),
      @"alert" : @(UIAccessibilityTraitNone),
      @"checkbox" : @(UIAccessibilityTraitNone),
      @"combobox" : @(UIAccessibilityTraitNone),
      @"menu" : @(UIAccessibilityTraitNone),
      @"menubar" : @(UIAccessibilityTraitNone),
      @"menuitem" : @(UIAccessibilityTraitNone),
      @"progressbar" : @(UIAccessibilityTraitNone),
      @"radio" : @(UIAccessibilityTraitNone),
      @"radiogroup" : @(UIAccessibilityTraitNone),
      @"scrollbar" : @(UIAccessibilityTraitNone),
      @"spinbutton" : @(UIAccessibilityTraitNone),
      @"switch" : @(SwitchAccessibilityTrait),
      @"tab" : @(UIAccessibilityTraitNone),
      @"tablist" : @(UIAccessibilityTraitNone),
      @"timer" : @(UIAccessibilityTraitNone),
      @"toolbar" : @(UIAccessibilityTraitNone),
    }),
    UIAccessibilityTraitNone,
    unsignedLongLongValue)

@end

@implementation ABI41_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI41_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI41_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI41_0_0RCTTVView new];
#else
  return [ABI41_0_0RCTView new];
#endif
}

- (ABI41_0_0RCTShadowView *)shadowView
{
  return [ABI41_0_0RCTShadowView new];
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
// TODO: Delete props for Apple TV.
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

// Accessibility related properties
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ABI41_0_0ReactAccessibilityElement.isAccessibilityElement, BOOL)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ABI41_0_0ReactAccessibilityElement.accessibilityActions, NSDictionaryArray)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ABI41_0_0ReactAccessibilityElement.accessibilityLabel, NSString)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ABI41_0_0ReactAccessibilityElement.accessibilityHint, NSString)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityValue, ABI41_0_0ReactAccessibilityElement.accessibilityValueInternal, NSDictionary)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ABI41_0_0ReactAccessibilityElement.accessibilityViewIsModal, BOOL)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ABI41_0_0ReactAccessibilityElement.accessibilityElementsHidden, BOOL)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(
    accessibilityIgnoresInvertColors,
    ABI41_0_0ReactAccessibilityElement.shouldAccessibilityIgnoresInvertColors,
    BOOL)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ABI41_0_0ReactAccessibilityElement.onAccessibilityAction, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ABI41_0_0ReactAccessibilityElement.onAccessibilityTap, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ABI41_0_0ReactAccessibilityElement.onMagicTap, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, ABI41_0_0ReactAccessibilityElement.onAccessibilityEscape, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(testID, ABI41_0_0ReactAccessibilityElement.accessibilityIdentifier, NSString)

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(needsOffscreenAlphaCompositing, layer.allowsGroupOpacity, BOOL)
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI41_0_0YGOverflow, ABI41_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI41_0_0RCTConvert ABI41_0_0YGOverflow:json] != ABI41_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI41_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI41_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale =
      view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI41_0_0RCTView)
{
  view.layer.transform = json ? [ABI41_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // Enable edge antialiasing in perspective transforms
  view.layer.allowsEdgeAntialiasing = !(view.layer.transform.m34 == 0.0f);
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI41_0_0RCTView)
{
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton |
      UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage |
      UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable |
      UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement | SwitchAccessibilityTrait;
  view.ABI41_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI41_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask;
  UIAccessibilityTraits newTraits = json ? [ABI41_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  if (newTraits != UIAccessibilityTraitNone) {
    UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
    view.ABI41_0_0ReactAccessibilityElement.accessibilityTraits |= maskedTraits;
  } else {
    NSString *role = json ? [ABI41_0_0RCTConvert NSString:json] : @"";
    view.ABI41_0_0ReactAccessibilityElement.accessibilityRole = role;
  }
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityState, NSDictionary, ABI41_0_0RCTView)
{
  NSDictionary<NSString *, id> *state = json ? [ABI41_0_0RCTConvert NSDictionary:json] : nil;
  NSMutableDictionary<NSString *, id> *newState = [[NSMutableDictionary<NSString *, id> alloc] init];

  if (!state) {
    return;
  }

  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;
  view.ABI41_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI41_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask;

  for (NSString *s in state) {
    id val = [state objectForKey:s];
    if (!val) {
      continue;
    }
    if ([s isEqualToString:@"selected"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI41_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitSelected;
    } else if ([s isEqualToString:@"disabled"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI41_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    } else {
      newState[s] = val;
    }
  }
  if (newState.count > 0) {
    view.ABI41_0_0ReactAccessibilityElement.accessibilityState = newState;
    // Post a layout change notification to make sure VoiceOver get notified for the state
    // changes that don't happen upon users' click.
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, nil);
  } else {
    view.ABI41_0_0ReactAccessibilityElement.accessibilityState = nil;
  }
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSString *, ABI41_0_0RCTView)
{
  view.nativeID = json ? [ABI41_0_0RCTConvert NSString:json] : defaultView.nativeID;
  [_bridge.uiManager setNativeID:view.nativeID forView:view];
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI41_0_0RCTPointerEvents, ABI41_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI41_0_0RCTConvert ABI41_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI41_0_0RCTConvert ABI41_0_0RCTPointerEvents:json]) {
    case ABI41_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ABI41_0_0React`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI41_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI41_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI41_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI41_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI41_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI41_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI41_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI41_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI41_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI41_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI41_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI41_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI41_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI41_0_0RCTBorderStyle, ABI41_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI41_0_0RCTConvert ABI41_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI41_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI41_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets =
          UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI41_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                                               \
  ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI41_0_0RCTView)                                      \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {                              \
      view.border##SIDE##Width = json ? [ABI41_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
    }                                                                                                \
  }                                                                                                  \
  ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI41_0_0RCTView)                                    \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {                              \
      view.border##SIDE##Color = json ? [ABI41_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
    }                                                                                                \
  }

ABI41_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI41_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI41_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI41_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI41_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI41_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI41_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                                                          \
  ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI41_0_0RCTView)                                     \
  {                                                                                                    \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {                               \
      view.border##SIDE##Radius = json ? [ABI41_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
    }                                                                                                  \
  }

ABI41_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI41_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI41_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI41_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI41_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI41_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI41_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI41_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI41_0_0RCT_REMAP_VIEW_PROPERTY(display, ABI41_0_0ReactDisplay, ABI41_0_0YGDisplay)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ABI41_0_0ReactZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI41_0_0YGValue)

ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI41_0_0YGValue)

ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI41_0_0YGValue)

ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI41_0_0YGValue)

ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI41_0_0YGValue)

ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI41_0_0YGValue)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI41_0_0YGFlexDirection)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI41_0_0YGWrap)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI41_0_0YGJustify)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI41_0_0YGAlign)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI41_0_0YGAlign)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI41_0_0YGAlign)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI41_0_0YGPositionType)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI41_0_0YGOverflow)
ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI41_0_0YGDisplay)

ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI41_0_0RCTDirectEventBlock)

ABI41_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI41_0_0YGDirection)

@end
