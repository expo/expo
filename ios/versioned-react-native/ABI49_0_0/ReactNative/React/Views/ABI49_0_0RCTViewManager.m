/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTViewManager.h"

#import "ABI49_0_0RCTAssert.h"
#import "ABI49_0_0RCTBorderCurve.h"
#import "ABI49_0_0RCTBorderStyle.h"
#import "ABI49_0_0RCTBridge.h"
#import "ABI49_0_0RCTConvert+Transform.h"
#import "ABI49_0_0RCTConvert.h"
#import "ABI49_0_0RCTLog.h"
#import "ABI49_0_0RCTShadowView.h"
#import "ABI49_0_0RCTUIManager.h"
#import "ABI49_0_0RCTUIManagerUtils.h"
#import "ABI49_0_0RCTUtils.h"
#import "ABI49_0_0RCTView.h"
#import "ABI49_0_0UIView+React.h"

@implementation ABI49_0_0RCTConvert (UIAccessibilityTraits)

ABI49_0_0RCT_MULTI_ENUM_CONVERTER(
    UIAccessibilityTraits,
    (@{
      @"none" : @(UIAccessibilityTraitNone),
      @"button" : @(UIAccessibilityTraitButton),
      @"dropdownlist" : @(UIAccessibilityTraitNone),
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
      @"pager" : @(UIAccessibilityTraitNone),
      @"scrollview" : @(UIAccessibilityTraitNone),
      @"horizontalscrollview" : @(UIAccessibilityTraitNone),
      @"viewgroup" : @(UIAccessibilityTraitNone),
      @"webview" : @(UIAccessibilityTraitNone),
      @"drawerlayout" : @(UIAccessibilityTraitNone),
      @"slidingdrawer" : @(UIAccessibilityTraitNone),
      @"iconmenu" : @(UIAccessibilityTraitNone),
      @"list" : @(UIAccessibilityTraitNone),
      @"grid" : @(UIAccessibilityTraitNone),
    }),
    UIAccessibilityTraitNone,
    unsignedLongLongValue)

@end

@implementation ABI49_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI49_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI49_0_0RCTGetUIManagerQueue();
}

- (void)setBridge:(ABI49_0_0RCTBridge *)bridge
{
  ABI49_0_0RCTErrorNewArchitectureValidation(
      ABI49_0_0RCTNotAllowedInBridgeless, self, @"ABI49_0_0RCTViewManager must not be initialized for the new architecture");
  _bridge = bridge;
}

- (UIView *)view
{
  return [ABI49_0_0RCTView new];
}

- (ABI49_0_0RCTShadowView *)shadowView
{
  return [ABI49_0_0RCTShadowView new];
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
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ABI49_0_0ReactAccessibilityElement.isAccessibilityElement, BOOL)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ABI49_0_0ReactAccessibilityElement.accessibilityActions, NSDictionaryArray)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ABI49_0_0ReactAccessibilityElement.accessibilityLabel, NSString)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ABI49_0_0ReactAccessibilityElement.accessibilityHint, NSString)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLanguage, ABI49_0_0ReactAccessibilityElement.accessibilityLanguage, NSString)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityValue, ABI49_0_0ReactAccessibilityElement.accessibilityValueInternal, NSDictionary)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ABI49_0_0ReactAccessibilityElement.accessibilityViewIsModal, BOOL)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ABI49_0_0ReactAccessibilityElement.accessibilityElementsHidden, BOOL)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(
    accessibilityIgnoresInvertColors,
    ABI49_0_0ReactAccessibilityElement.shouldAccessibilityIgnoresInvertColors,
    BOOL)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ABI49_0_0ReactAccessibilityElement.onAccessibilityAction, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ABI49_0_0ReactAccessibilityElement.onAccessibilityTap, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ABI49_0_0ReactAccessibilityElement.onMagicTap, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, ABI49_0_0ReactAccessibilityElement.onAccessibilityEscape, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(testID, ABI49_0_0ReactAccessibilityElement.accessibilityIdentifier, NSString)

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(needsOffscreenAlphaCompositing, layer.allowsGroupOpacity, BOOL)
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI49_0_0YGOverflow, ABI49_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI49_0_0RCTConvert ABI49_0_0YGOverflow:json] != ABI49_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI49_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI49_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale =
      view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI49_0_0RCTView)
{
  view.layer.transform = json ? [ABI49_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // Enable edge antialiasing in rotation, skew, or perspective transforms
  view.layer.allowsEdgeAntialiasing =
      view.layer.transform.m12 != 0.0f || view.layer.transform.m21 != 0.0f || view.layer.transform.m34 != 0.0f;
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI49_0_0RCTView)
{
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton |
      UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage |
      UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable |
      UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement | UIAccessibilityTraitTabBar |
      UIAccessibilityTraitUpdatesFrequently | SwitchAccessibilityTrait;
  view.ABI49_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI49_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask;
  UIAccessibilityTraits newTraits = json ? [ABI49_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  if (newTraits != UIAccessibilityTraitNone) {
    UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
    view.ABI49_0_0ReactAccessibilityElement.accessibilityTraits |= maskedTraits;
  } else {
    NSString *role = json ? [ABI49_0_0RCTConvert NSString:json] : @"";
    view.ABI49_0_0ReactAccessibilityElement.accessibilityRole = role;
  }
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityState, NSDictionary, ABI49_0_0RCTView)
{
  NSDictionary<NSString *, id> *state = json ? [ABI49_0_0RCTConvert NSDictionary:json] : nil;
  NSMutableDictionary<NSString *, id> *newState = [NSMutableDictionary<NSString *, id> new];

  if (!state) {
    return;
  }

  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;
  view.ABI49_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI49_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask;

  for (NSString *s in state) {
    id val = [state objectForKey:s];
    if (!val) {
      continue;
    }
    if ([s isEqualToString:@"selected"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI49_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitSelected;
    } else if ([s isEqualToString:@"disabled"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI49_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    } else {
      newState[s] = val;
    }
  }
  if (newState.count > 0) {
    view.ABI49_0_0ReactAccessibilityElement.accessibilityState = newState;
    // Post a layout change notification to make sure VoiceOver get notified for the state
    // changes that don't happen upon users' click.
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, nil);
  } else {
    view.ABI49_0_0ReactAccessibilityElement.accessibilityState = nil;
  }
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSString *, ABI49_0_0RCTView)
{
  view.nativeID = json ? [ABI49_0_0RCTConvert NSString:json] : defaultView.nativeID;
  [_bridge.uiManager setNativeID:view.nativeID forView:view];
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI49_0_0RCTPointerEvents, ABI49_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI49_0_0RCTConvert ABI49_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI49_0_0RCTConvert ABI49_0_0RCTPointerEvents:json]) {
    case ABI49_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ABI49_0_0React`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI49_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI49_0_0RCTLogInfo(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI49_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI49_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(borderCurve, ABI49_0_0RCTBorderCurve, ABI49_0_0RCTView)
{
  if (@available(iOS 13.0, *)) {
    switch ([ABI49_0_0RCTConvert ABI49_0_0RCTBorderCurve:json]) {
      case ABI49_0_0RCTBorderCurveContinuous:
        view.layer.cornerCurve = kCACornerCurveContinuous;
        break;
      case ABI49_0_0RCTBorderCurveCircular:
        view.layer.cornerCurve = kCACornerCurveCircular;
        break;
    }
  }
}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI49_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI49_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI49_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, UIColor, ABI49_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI49_0_0RCTConvert UIColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI49_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI49_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI49_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI49_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI49_0_0RCTBorderStyle, ABI49_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI49_0_0RCTConvert ABI49_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI49_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI49_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets =
          UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(collapsable, BOOL, ABI49_0_0RCTView)
{
  // Property is only to be used in the new renderer.
  // It is necessary to add it here, otherwise it gets
  // filtered by view configs.
}

#define ABI49_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                                               \
  ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI49_0_0RCTView)                                      \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {                              \
      view.border##SIDE##Width = json ? [ABI49_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
    }                                                                                                \
  }                                                                                                  \
  ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI49_0_0RCTView)                                    \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {                              \
      view.border##SIDE##Color = json ? [ABI49_0_0RCTConvert UIColor:json] : defaultView.border##SIDE##Color; \
    }                                                                                                \
  }

ABI49_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI49_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI49_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI49_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI49_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI49_0_0RCT_VIEW_BORDER_PROPERTY(End)
ABI49_0_0RCT_VIEW_BORDER_PROPERTY(Block)
ABI49_0_0RCT_VIEW_BORDER_PROPERTY(BlockEnd)
ABI49_0_0RCT_VIEW_BORDER_PROPERTY(BlockStart)

#define ABI49_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                                                          \
  ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI49_0_0RCTView)                                     \
  {                                                                                                    \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {                               \
      view.border##SIDE##Radius = json ? [ABI49_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
    }                                                                                                  \
  }

ABI49_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI49_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI49_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI49_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI49_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI49_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI49_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI49_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)
ABI49_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(EndEnd)
ABI49_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(EndStart)
ABI49_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(StartEnd)
ABI49_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(StartStart)

ABI49_0_0RCT_REMAP_VIEW_PROPERTY(display, ABI49_0_0ReactDisplay, ABI49_0_0YGDisplay)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ABI49_0_0ReactZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI49_0_0YGValue)

ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI49_0_0YGValue)

ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI49_0_0YGValue)

ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI49_0_0YGValue)

ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI49_0_0YGValue)

ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI49_0_0YGValue)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI49_0_0YGFlexDirection)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI49_0_0YGWrap)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI49_0_0YGJustify)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI49_0_0YGAlign)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI49_0_0YGAlign)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI49_0_0YGAlign)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI49_0_0YGPositionType)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(rowGap, float)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(columnGap, float)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(gap, float)

ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI49_0_0YGOverflow)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI49_0_0YGDisplay)

ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI49_0_0RCTDirectEventBlock)

ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI49_0_0YGDirection)

// The events below define the properties that are not used by native directly, but required in the view config for new
// renderer to function.
// They can be deleted after Static View Configs are rolled out.

// PanResponder handlers
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onMoveShouldSetResponder, BOOL, ABI49_0_0RCTView) {}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onMoveShouldSetResponderCapture, BOOL, ABI49_0_0RCTView) {}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onStartShouldSetResponder, BOOL, ABI49_0_0RCTView) {}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onStartShouldSetResponderCapture, BOOL, ABI49_0_0RCTView) {}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderGrant, BOOL, ABI49_0_0RCTView) {}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderReject, BOOL, ABI49_0_0RCTView) {}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderStart, BOOL, ABI49_0_0RCTView) {}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderEnd, BOOL, ABI49_0_0RCTView) {}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderRelease, BOOL, ABI49_0_0RCTView) {}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderMove, BOOL, ABI49_0_0RCTView) {}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderTerminate, BOOL, ABI49_0_0RCTView) {}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onResponderTerminationRequest, BOOL, ABI49_0_0RCTView) {}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onShouldBlockNativeResponder, BOOL, ABI49_0_0RCTView) {}

// Touch events
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onTouchStart, BOOL, ABI49_0_0RCTView) {}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onTouchMove, BOOL, ABI49_0_0RCTView) {}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onTouchEnd, BOOL, ABI49_0_0RCTView) {}
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(onTouchCancel, BOOL, ABI49_0_0RCTView) {}

// Experimental/WIP Pointer Events (not yet ready for use)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerCancel, ABI49_0_0RCTBubblingEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerDown, ABI49_0_0RCTBubblingEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerMove, ABI49_0_0RCTBubblingEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerUp, ABI49_0_0RCTBubblingEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerEnter, ABI49_0_0RCTCapturingEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerLeave, ABI49_0_0RCTCapturingEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerOver, ABI49_0_0RCTBubblingEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPointerOut, ABI49_0_0RCTBubblingEventBlock)

@end
