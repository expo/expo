#import "RNSConvert.h"

#ifdef RCT_NEW_ARCH_ENABLED
@implementation RNSConvert

+ (RNSScreenStackPresentation)RNSScreenStackPresentationFromCppEquivalent:
    (react::RNSScreenStackPresentation)stackPresentation
{
  switch (stackPresentation) {
    case react::RNSScreenStackPresentation::Push:
      return RNSScreenStackPresentationPush;
    case react::RNSScreenStackPresentation::Modal:
      return RNSScreenStackPresentationModal;
    case react::RNSScreenStackPresentation::FullScreenModal:
      return RNSScreenStackPresentationFullScreenModal;
    case react::RNSScreenStackPresentation::FormSheet:
      return RNSScreenStackPresentationFormSheet;
    case react::RNSScreenStackPresentation::ContainedModal:
      return RNSScreenStackPresentationContainedModal;
    case react::RNSScreenStackPresentation::TransparentModal:
      return RNSScreenStackPresentationTransparentModal;
    case react::RNSScreenStackPresentation::ContainedTransparentModal:
      return RNSScreenStackPresentationContainedTransparentModal;
  }
}

+ (RNSScreenStackAnimation)RNSScreenStackAnimationFromCppEquivalent:(react::RNSScreenStackAnimation)stackAnimation
{
  switch (stackAnimation) {
    // these four are intentionally grouped
    case react::RNSScreenStackAnimation::Slide_from_right:
    case react::RNSScreenStackAnimation::Slide_from_left:
    case react::RNSScreenStackAnimation::Ios:
    case react::RNSScreenStackAnimation::Default:
      return RNSScreenStackAnimationDefault;
    case react::RNSScreenStackAnimation::Flip:
      return RNSScreenStackAnimationFlip;
    case react::RNSScreenStackAnimation::Simple_push:
      return RNSScreenStackAnimationSimplePush;
    case react::RNSScreenStackAnimation::None:
      return RNSScreenStackAnimationNone;
    case react::RNSScreenStackAnimation::Fade:
      return RNSScreenStackAnimationFade;
    case react::RNSScreenStackAnimation::Slide_from_bottom:
      return RNSScreenStackAnimationSlideFromBottom;
    case react::RNSScreenStackAnimation::Fade_from_bottom:
      return RNSScreenStackAnimationFadeFromBottom;
  }
}

+ (RNSScreenStackHeaderSubviewType)RNSScreenStackHeaderSubviewTypeFromCppEquivalent:
    (react::RNSScreenStackHeaderSubviewType)subviewType
{
  switch (subviewType) {
    case react::RNSScreenStackHeaderSubviewType::Left:
      return RNSScreenStackHeaderSubviewTypeLeft;
    case react::RNSScreenStackHeaderSubviewType::Right:
      return RNSScreenStackHeaderSubviewTypeRight;
    case react::RNSScreenStackHeaderSubviewType::Title:
      return RNSScreenStackHeaderSubviewTypeTitle;
    case react::RNSScreenStackHeaderSubviewType::Center:
      return RNSScreenStackHeaderSubviewTypeCenter;
    case react::RNSScreenStackHeaderSubviewType::SearchBar:
      return RNSScreenStackHeaderSubviewTypeSearchBar;
    case react::RNSScreenStackHeaderSubviewType::Back:
      return RNSScreenStackHeaderSubviewTypeBackButton;
  }
}

+ (RNSScreenReplaceAnimation)RNSScreenReplaceAnimationFromCppEquivalent:
    (react::RNSScreenReplaceAnimation)replaceAnimation
{
  switch (replaceAnimation) {
    case react::RNSScreenReplaceAnimation::Pop:
      return RNSScreenReplaceAnimationPop;
    case react::RNSScreenReplaceAnimation::Push:
      return RNSScreenReplaceAnimationPush;
  }
}

+ (RNSScreenSwipeDirection)RNSScreenSwipeDirectionFromCppEquivalent:(react::RNSScreenSwipeDirection)swipeDirection
{
  switch (swipeDirection) {
    case react::RNSScreenSwipeDirection::Horizontal:
      return RNSScreenSwipeDirectionHorizontal;
    case react::RNSScreenSwipeDirection::Vertical:
      return RNSScreenSwipeDirectionVertical;
  }
}

+ (RNSScreenDetentType)RNSScreenDetentTypeFromAllowedDetents:(react::RNSScreenSheetAllowedDetents)allowedDetents
{
  switch (allowedDetents) {
    case react::RNSScreenSheetAllowedDetents::All:
      return RNSScreenDetentTypeAll;
    case react::RNSScreenSheetAllowedDetents::Large:
      return RNSScreenDetentTypeLarge;
    case react::RNSScreenSheetAllowedDetents::Medium:
      return RNSScreenDetentTypeMedium;
  }
}

+ (RNSScreenDetentType)RNSScreenDetentTypeFromLargestUndimmedDetent:(react::RNSScreenSheetLargestUndimmedDetent)detent
{
  switch (detent) {
    case react::RNSScreenSheetLargestUndimmedDetent::All:
      return RNSScreenDetentTypeAll;
    case react::RNSScreenSheetLargestUndimmedDetent::Large:
      return RNSScreenDetentTypeLarge;
    case react::RNSScreenSheetLargestUndimmedDetent::Medium:
      return RNSScreenDetentTypeMedium;
  }
}

+ (NSDictionary *)gestureResponseDistanceDictFromCppStruct:
    (const react::RNSScreenGestureResponseDistanceStruct &)gestureResponseDistance
{
  return @{
    @"start" : @(gestureResponseDistance.start),
    @"end" : @(gestureResponseDistance.end),
    @"top" : @(gestureResponseDistance.top),
    @"bottom" : @(gestureResponseDistance.bottom),
  };
}

+ (UITextAutocapitalizationType)UITextAutocapitalizationTypeFromCppEquivalent:
    (react::RNSSearchBarAutoCapitalize)autoCapitalize
{
  switch (autoCapitalize) {
    case react::RNSSearchBarAutoCapitalize::Words:
      return UITextAutocapitalizationTypeWords;
    case react::RNSSearchBarAutoCapitalize::Sentences:
      return UITextAutocapitalizationTypeSentences;
    case react::RNSSearchBarAutoCapitalize::Characters:
      return UITextAutocapitalizationTypeAllCharacters;
    case react::RNSSearchBarAutoCapitalize::None:
      return UITextAutocapitalizationTypeNone;
  }
}

+ (RNSSearchBarPlacement)RNSScreenSearchBarPlacementFromCppEquivalent:(react::RNSSearchBarPlacement)placement
{
  switch (placement) {
    case react::RNSSearchBarPlacement::Stacked:
      return RNSSearchBarPlacementStacked;
    case react::RNSSearchBarPlacement::Automatic:
      return RNSSearchBarPlacementAutomatic;
    case react::RNSSearchBarPlacement::Inline:
      return RNSSearchBarPlacementInline;
  }
}

@end

#endif // RCT_NEW_ARCH_ENABLED
