#import "ABI47_0_0RNSConvert.h"

#ifdef RN_FABRIC_ENABLED
@implementation ABI47_0_0RNSConvert

+ (ABI47_0_0RNSScreenStackPresentation)ABI47_0_0RNSScreenStackPresentationFromCppEquivalent:
    (ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackPresentation)stackPresentation
{
  switch (stackPresentation) {
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackPresentation::Push:
      return ABI47_0_0RNSScreenStackPresentationPush;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackPresentation::Modal:
      return ABI47_0_0RNSScreenStackPresentationModal;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackPresentation::FullScreenModal:
      return ABI47_0_0RNSScreenStackPresentationFullScreenModal;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackPresentation::FormSheet:
      return ABI47_0_0RNSScreenStackPresentationFormSheet;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackPresentation::ContainedModal:
      return ABI47_0_0RNSScreenStackPresentationContainedModal;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackPresentation::TransparentModal:
      return ABI47_0_0RNSScreenStackPresentationTransparentModal;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackPresentation::ContainedTransparentModal:
      return ABI47_0_0RNSScreenStackPresentationContainedTransparentModal;
  }
}

+ (ABI47_0_0RNSScreenStackAnimation)ABI47_0_0RNSScreenStackAnimationFromCppEquivalent:
    (ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackAnimation)stackAnimation
{
  switch (stackAnimation) {
    // these three are intentionally grouped
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackAnimation::Slide_from_right:
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackAnimation::Slide_from_left:
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackAnimation::Default:
      return ABI47_0_0RNSScreenStackAnimationDefault;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackAnimation::Flip:
      return ABI47_0_0RNSScreenStackAnimationFlip;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackAnimation::Simple_push:
      return ABI47_0_0RNSScreenStackAnimationSimplePush;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackAnimation::None:
      return ABI47_0_0RNSScreenStackAnimationNone;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackAnimation::Fade:
      return ABI47_0_0RNSScreenStackAnimationFade;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackAnimation::Slide_from_bottom:
      return ABI47_0_0RNSScreenStackAnimationSlideFromBottom;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackAnimation::Fade_from_bottom:
      return ABI47_0_0RNSScreenStackAnimationFadeFromBottom;
  }
}

+ (ABI47_0_0RNSScreenStackHeaderSubviewType)ABI47_0_0RNSScreenStackHeaderSubviewTypeFromCppEquivalent:
    (ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackHeaderSubviewType)subviewType
{
  switch (subviewType) {
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackHeaderSubviewType::Left:
      return ABI47_0_0RNSScreenStackHeaderSubviewTypeLeft;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackHeaderSubviewType::Right:
      return ABI47_0_0RNSScreenStackHeaderSubviewTypeRight;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackHeaderSubviewType::Title:
      return ABI47_0_0RNSScreenStackHeaderSubviewTypeTitle;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackHeaderSubviewType::Center:
      return ABI47_0_0RNSScreenStackHeaderSubviewTypeCenter;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackHeaderSubviewType::SearchBar:
      return ABI47_0_0RNSScreenStackHeaderSubviewTypeSearchBar;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackHeaderSubviewType::Back:
      return ABI47_0_0RNSScreenStackHeaderSubviewTypeBackButton;
  }
}

+ (ABI47_0_0RNSScreenReplaceAnimation)ABI47_0_0RNSScreenReplaceAnimationFromCppEquivalent:
    (ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenReplaceAnimation)replaceAnimation
{
  switch (replaceAnimation) {
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenReplaceAnimation::Pop:
      return ABI47_0_0RNSScreenReplaceAnimationPop;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenReplaceAnimation::Push:
      return ABI47_0_0RNSScreenReplaceAnimationPush;
  }
}

+ (ABI47_0_0RNSScreenSwipeDirection)ABI47_0_0RNSScreenSwipeDirectionFromCppEquivalent:
    (ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenSwipeDirection)swipeDirection
{
  switch (swipeDirection) {
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenSwipeDirection::Horizontal:
      return ABI47_0_0RNSScreenSwipeDirectionHorizontal;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenSwipeDirection::Vertical:
      return ABI47_0_0RNSScreenSwipeDirectionVertical;
  }
}

+ (NSDictionary *)gestureResponseDistanceDictFromCppStruct:
    (const ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenGestureResponseDistanceStruct &)gestureResponseDistance
{
  return @{
    @"start" : @(gestureResponseDistance.start),
    @"end" : @(gestureResponseDistance.end),
    @"top" : @(gestureResponseDistance.top),
    @"bottom" : @(gestureResponseDistance.bottom),
  };
}

+ (UITextAutocapitalizationType)UITextAutocapitalizationTypeFromCppEquivalent:
    (ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarAutoCapitalize)autoCapitalize
{
  switch (autoCapitalize) {
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarAutoCapitalize::Words:
      return UITextAutocapitalizationTypeWords;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarAutoCapitalize::Sentences:
      return UITextAutocapitalizationTypeSentences;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarAutoCapitalize::Characters:
      return UITextAutocapitalizationTypeAllCharacters;
    case ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarAutoCapitalize::None:
      return UITextAutocapitalizationTypeNone;
  }
}

@end

#endif // RN_FABRIC_ENABLED
