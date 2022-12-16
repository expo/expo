/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTViewManager.h"

#import "ABI46_0_0RCTAssert.h"
#import "ABI46_0_0RCTBorderStyle.h"
#import "ABI46_0_0RCTBridge.h"
#import "ABI46_0_0RCTConvert+Transform.h"
#import "ABI46_0_0RCTConvert.h"
#import "ABI46_0_0RCTLog.h"
#import "ABI46_0_0RCTShadowView.h"
#import "ABI46_0_0RCTUIManager.h"
#import "ABI46_0_0RCTUIManagerUtils.h"
#import "ABI46_0_0RCTUtils.h"
#import "ABI46_0_0RCTView.h"
#import "ABI46_0_0UIView+React.h"

@implementation ABI46_0_0RCTConvert (UIAccessibilityTraits)

ABI46_0_0RCT_MULTI_ENUM_CONVERTER(
    UIAccessibilityTraits,
    (@{
      @"none" : @(UIAccessibilityTraitNone),
      @"button" : @(UIAccessibilityTraitButton),
      @"togglebutton" : @(UIAccessibilityTraitButton),
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
      @"progressbar" : @(UIAccessibilityTraitUpdatesFrequently),
      @"radio" : @(UIAccessibilityTraitNone),
      @"radiogroup" : @(UIAccessibilityTraitNone),
      @"scrollbar" : @(UIAccessibilityTraitNone),
      @"spinbutton" : @(UIAccessibilityTraitNone),
      @"switch" : @(SwitchAccessibilityTrait),
      @"tab" : @(UIAccessibilityTraitNone),
      @"tabbar" : @(UIAccessibilityTraitTabBar),
      @"tablist" : @(UIAccessibilityTraitNone),
      @"timer" : @(UIAccessibilityTraitNone),
      @"toolbar" : @(UIAccessibilityTraitNone),
      @"list" : @(UIAccessibilityTraitNone),
    }),
    UIAccessibilityTraitNone,
    unsignedLongLongValue)

@end

@implementation ABI46_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI46_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI46_0_0RCTGetUIManagerQueue();
}

- (void)setBridge:(ABI46_0_0RCTBridge *)bridge
{
  ABI46_0_0RCTErrorNewArchitectureValidation(
      ABI46_0_0RCTNotAllowedInBridgeless, self, @"ABI46_0_0RCTViewManager must not be initialized for the new architecture");
  _bridge = bridge;
}

- (UIView *)view
{
  return [ABI46_0_0RCTView new];
}

- (ABI46_0_0RCTShadowView *)shadowView
{
  return [ABI46_0_0RCTShadowView new];
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
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ABI46_0_0ReactAccessibilityElement.isAccessibilityElement, BOOL)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ABI46_0_0ReactAccessibilityElement.accessibilityActions, NSDictionaryArray)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ABI46_0_0ReactAccessibilityElement.accessibilityLabel, NSString)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ABI46_0_0ReactAccessibilityElement.accessibilityHint, NSString)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLanguage, ABI46_0_0ReactAccessibilityElement.accessibilityLanguage, NSString)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityValue, ABI46_0_0ReactAccessibilityElement.accessibilityValueInternal, NSDictionary)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ABI46_0_0ReactAccessibilityElement.accessibilityViewIsModal, BOOL)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ABI46_0_0ReactAccessibilityElement.accessibilityElementsHidden, BOOL)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(
    accessibilityIgnoresInvertColors,
    ABI46_0_0ReactAccessibilityElement.shouldAccessibilityIgnoresInvertColors,
    BOOL)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ABI46_0_0ReactAccessibilityElement.onAccessibilityAction, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ABI46_0_0ReactAccessibilityElement.onAccessibilityTap, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ABI46_0_0ReactAccessibilityElement.onMagicTap, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, ABI46_0_0ReactAccessibilityElement.onAccessibilityEscape, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(testID, ABI46_0_0ReactAccessibilityElement.accessibilityIdentifier, NSString)

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(needsOffscreenAlphaCompositing, layer.allowsGroupOpacity, BOOL)
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI46_0_0YGOverflow, ABI46_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI46_0_0RCTConvert ABI46_0_0YGOverflow:json] != ABI46_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI46_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI46_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale =
      view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI46_0_0RCTView)
{
  view.layer.transform = json ? [ABI46_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // Enable edge antialiasing in rotation, skew, or perspective transforms
  view.layer.allowsEdgeAntialiasing =
      view.layer.transform.m12 != 0.0f || view.layer.transform.m21 != 0.0f || view.layer.transform.m34 != 0.0f;
}

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI46_0_0RCTView)
{
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton |
      UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage |
      UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable |
      UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement | UIAccessibilityTraitTabBar |
      UIAccessibilityTraitUpdatesFrequently | SwitchAccessibilityTrait;
  view.ABI46_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI46_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask;
  UIAccessibilityTraits newTraits = json ? [ABI46_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  if (newTraits != UIAccessibilityTraitNone) {
    UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
    view.ABI46_0_0ReactAccessibilityElement.accessibilityTraits |= maskedTraits;
  } else {
    NSString *role = json ? [ABI46_0_0RCTConvert NSString:json] : @"";
    view.ABI46_0_0ReactAccessibilityElement.accessibilityRole = role;
  }
}

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityState, NSDictionary, ABI46_0_0RCTView)
{
  NSDictionary<NSString *, id> *state = json ? [ABI46_0_0RCTConvert NSDictionary:json] : nil;
  NSMutableDictionary<NSString *, id> *newState = [NSMutableDictionary<NSString *, id> new];

  if (!state) {
    return;
  }

  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;
  view.ABI46_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI46_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask;

  for (NSString *s in state) {
    id val = [state objectForKey:s];
    if (!val) {
      continue;
    }
    if ([s isEqualToString:@"selected"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI46_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitSelected;
    } else if ([s isEqualToString:@"disabled"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI46_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    } else {
      newState[s] = val;
    }
  }
  if (newState.count > 0) {
    view.ABI46_0_0ReactAccessibilityElement.accessibilityState = newState;
    // Post a layout change notification to make sure VoiceOver get notified for the state
    // changes that don't happen upon users' click.
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, nil);
  } else {
    view.ABI46_0_0ReactAccessibilityElement.accessibilityState = nil;
  }
}

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSString *, ABI46_0_0RCTView)
{
  view.nativeID = json ? [ABI46_0_0RCTConvert NSString:json] : defaultView.nativeID;
  [_bridge.uiManager setNativeID:view.nativeID forView:view];
}

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI46_0_0RCTPointerEvents, ABI46_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI46_0_0RCTConvert ABI46_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI46_0_0RCTConvert ABI46_0_0RCTPointerEvents:json]) {
    case ABI46_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ABI46_0_0React`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI46_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI46_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI46_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI46_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI46_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI46_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI46_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, UIColor, ABI46_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI46_0_0RCTConvert UIColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI46_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI46_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI46_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI46_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI46_0_0RCTBorderStyle, ABI46_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI46_0_0RCTConvert ABI46_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI46_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI46_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets =
          UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(collapsable, BOOL, ABI46_0_0RCTView)
{
  // Property is only to be used in the new renderer.
  // It is necessary to add it here, otherwise it gets
  // filtered by view configs.
}

#define ABI46_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                                               \
  ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI46_0_0RCTView)                                      \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {                              \
      view.border##SIDE##Width = json ? [ABI46_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
    }                                                                                                \
  }                                                                                                  \
  ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI46_0_0RCTView)                                    \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {                              \
      view.border##SIDE##Color = json ? [ABI46_0_0RCTConvert UIColor:json] : defaultView.border##SIDE##Color; \
    }                                                                                                \
  }

ABI46_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI46_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI46_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI46_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI46_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI46_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI46_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                                                          \
  ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI46_0_0RCTView)                                     \
  {                                                                                                    \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {                               \
      view.border##SIDE##Radius = json ? [ABI46_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
    }                                                                                                  \
  }

ABI46_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI46_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI46_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI46_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI46_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI46_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI46_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI46_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI46_0_0RCT_REMAP_VIEW_PROPERTY(display, ABI46_0_0ReactDisplay, ABI46_0_0YGDisplay)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ABI46_0_0ReactZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI46_0_0YGValue)

ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI46_0_0YGValue)

ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI46_0_0YGValue)

ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI46_0_0YGValue)

ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI46_0_0YGValue)

ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI46_0_0YGValue)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI46_0_0YGFlexDirection)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI46_0_0YGWrap)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI46_0_0YGJustify)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI46_0_0YGAlign)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI46_0_0YGAlign)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI46_0_0YGAlign)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI46_0_0YGPositionType)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI46_0_0YGOverflow)
ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI46_0_0YGDisplay)

ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI46_0_0RCTDirectEventBlock)

ABI46_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI46_0_0YGDirection)

// The events below define the properties that are not used by native directly, but required in the view config for new
// renderer to function.
// They can be deleted after Static View Configs are rolled out.

// PanResponder handlers
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onMoveShouldSetResponder, BOOL, ABI46_0_0RCTView) {}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onMoveShouldSetResponderCapture, BOOL, ABI46_0_0RCTView) {}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onStartShouldSetResponder, BOOL, ABI46_0_0RCTView) {}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onStartShouldSetResponderCapture, BOOL, ABI46_0_0RCTView) {}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderGrant, BOOL, ABI46_0_0RCTView) {}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderReject, BOOL, ABI46_0_0RCTView) {}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderStart, BOOL, ABI46_0_0RCTView) {}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderEnd, BOOL, ABI46_0_0RCTView) {}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderRelease, BOOL, ABI46_0_0RCTView) {}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderMove, BOOL, ABI46_0_0RCTView) {}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderTerminate, BOOL, ABI46_0_0RCTView) {}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderTerminationRequest, BOOL, ABI46_0_0RCTView) {}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onShouldBlockNativeResponder, BOOL, ABI46_0_0RCTView) {}

// Touch events
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onTouchStart, BOOL, ABI46_0_0RCTView) {}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onTouchMove, BOOL, ABI46_0_0RCTView) {}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onTouchEnd, BOOL, ABI46_0_0RCTView) {}
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(onTouchCancel, BOOL, ABI46_0_0RCTView) {}

// Experimental/WIP Pointer Events (not yet ready for use)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerCancel, ABI46_0_0RCTBubblingEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerDown, ABI46_0_0RCTBubblingEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerMove2, ABI46_0_0RCTBubblingEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerUp, ABI46_0_0RCTBubblingEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerEnter2, ABI46_0_0RCTCapturingEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerLeave2, ABI46_0_0RCTCapturingEventBlock)

@end
