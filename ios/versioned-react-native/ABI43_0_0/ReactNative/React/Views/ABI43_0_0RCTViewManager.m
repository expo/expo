/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTViewManager.h"

#import "ABI43_0_0RCTBorderStyle.h"
#import "ABI43_0_0RCTBridge.h"
#import "ABI43_0_0RCTConvert+Transform.h"
#import "ABI43_0_0RCTConvert.h"
#import "ABI43_0_0RCTLog.h"
#import "ABI43_0_0RCTShadowView.h"
#import "ABI43_0_0RCTUIManager.h"
#import "ABI43_0_0RCTUIManagerUtils.h"
#import "ABI43_0_0RCTUtils.h"
#import "ABI43_0_0RCTView.h"
#import "ABI43_0_0UIView+React.h"

@implementation ABI43_0_0RCTConvert (UIAccessibilityTraits)

ABI43_0_0RCT_MULTI_ENUM_CONVERTER(
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

@implementation ABI43_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI43_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI43_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
  return [ABI43_0_0RCTView new];
}

- (ABI43_0_0RCTShadowView *)shadowView
{
  return [ABI43_0_0RCTShadowView new];
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

// Accessibility related properties
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ABI43_0_0ReactAccessibilityElement.isAccessibilityElement, BOOL)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ABI43_0_0ReactAccessibilityElement.accessibilityActions, NSDictionaryArray)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ABI43_0_0ReactAccessibilityElement.accessibilityLabel, NSString)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ABI43_0_0ReactAccessibilityElement.accessibilityHint, NSString)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityValue, ABI43_0_0ReactAccessibilityElement.accessibilityValueInternal, NSDictionary)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ABI43_0_0ReactAccessibilityElement.accessibilityViewIsModal, BOOL)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ABI43_0_0ReactAccessibilityElement.accessibilityElementsHidden, BOOL)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(
    accessibilityIgnoresInvertColors,
    ABI43_0_0ReactAccessibilityElement.shouldAccessibilityIgnoresInvertColors,
    BOOL)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ABI43_0_0ReactAccessibilityElement.onAccessibilityAction, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ABI43_0_0ReactAccessibilityElement.onAccessibilityTap, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ABI43_0_0ReactAccessibilityElement.onMagicTap, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, ABI43_0_0ReactAccessibilityElement.onAccessibilityEscape, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(testID, ABI43_0_0ReactAccessibilityElement.accessibilityIdentifier, NSString)

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(needsOffscreenAlphaCompositing, layer.allowsGroupOpacity, BOOL)
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI43_0_0YGOverflow, ABI43_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI43_0_0RCTConvert ABI43_0_0YGOverflow:json] != ABI43_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI43_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI43_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale =
      view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI43_0_0RCTView)
{
  view.layer.transform = json ? [ABI43_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // Enable edge antialiasing in perspective transforms
  view.layer.allowsEdgeAntialiasing = !(view.layer.transform.m34 == 0.0f);
}

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI43_0_0RCTView)
{
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton |
      UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage |
      UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable |
      UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement | SwitchAccessibilityTrait;
  view.ABI43_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI43_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask;
  UIAccessibilityTraits newTraits = json ? [ABI43_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  if (newTraits != UIAccessibilityTraitNone) {
    UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
    view.ABI43_0_0ReactAccessibilityElement.accessibilityTraits |= maskedTraits;
  } else {
    NSString *role = json ? [ABI43_0_0RCTConvert NSString:json] : @"";
    view.ABI43_0_0ReactAccessibilityElement.accessibilityRole = role;
  }
}

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityState, NSDictionary, ABI43_0_0RCTView)
{
  NSDictionary<NSString *, id> *state = json ? [ABI43_0_0RCTConvert NSDictionary:json] : nil;
  NSMutableDictionary<NSString *, id> *newState = [[NSMutableDictionary<NSString *, id> alloc] init];

  if (!state) {
    return;
  }

  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;
  view.ABI43_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI43_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask;

  for (NSString *s in state) {
    id val = [state objectForKey:s];
    if (!val) {
      continue;
    }
    if ([s isEqualToString:@"selected"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI43_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitSelected;
    } else if ([s isEqualToString:@"disabled"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI43_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    } else {
      newState[s] = val;
    }
  }
  if (newState.count > 0) {
    view.ABI43_0_0ReactAccessibilityElement.accessibilityState = newState;
    // Post a layout change notification to make sure VoiceOver get notified for the state
    // changes that don't happen upon users' click.
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, nil);
  } else {
    view.ABI43_0_0ReactAccessibilityElement.accessibilityState = nil;
  }
}

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSString *, ABI43_0_0RCTView)
{
  view.nativeID = json ? [ABI43_0_0RCTConvert NSString:json] : defaultView.nativeID;
  [_bridge.uiManager setNativeID:view.nativeID forView:view];
}

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI43_0_0RCTPointerEvents, ABI43_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI43_0_0RCTConvert ABI43_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI43_0_0RCTConvert ABI43_0_0RCTPointerEvents:json]) {
    case ABI43_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ABI43_0_0React`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI43_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI43_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI43_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI43_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI43_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI43_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI43_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI43_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI43_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI43_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI43_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI43_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI43_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI43_0_0RCTBorderStyle, ABI43_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI43_0_0RCTConvert ABI43_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI43_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI43_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets =
          UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI43_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                                               \
  ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI43_0_0RCTView)                                      \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {                              \
      view.border##SIDE##Width = json ? [ABI43_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
    }                                                                                                \
  }                                                                                                  \
  ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI43_0_0RCTView)                                    \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {                              \
      view.border##SIDE##Color = json ? [ABI43_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
    }                                                                                                \
  }

ABI43_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI43_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI43_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI43_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI43_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI43_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI43_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                                                          \
  ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI43_0_0RCTView)                                     \
  {                                                                                                    \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {                               \
      view.border##SIDE##Radius = json ? [ABI43_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
    }                                                                                                  \
  }

ABI43_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI43_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI43_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI43_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI43_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI43_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI43_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI43_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI43_0_0RCT_REMAP_VIEW_PROPERTY(display, ABI43_0_0ReactDisplay, ABI43_0_0YGDisplay)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ABI43_0_0ReactZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI43_0_0YGValue)

ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI43_0_0YGValue)

ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI43_0_0YGValue)

ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI43_0_0YGValue)

ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI43_0_0YGValue)

ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI43_0_0YGValue)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI43_0_0YGFlexDirection)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI43_0_0YGWrap)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI43_0_0YGJustify)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI43_0_0YGAlign)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI43_0_0YGAlign)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI43_0_0YGAlign)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI43_0_0YGPositionType)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI43_0_0YGOverflow)
ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI43_0_0YGDisplay)

ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI43_0_0RCTDirectEventBlock)

ABI43_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI43_0_0YGDirection)

@end
