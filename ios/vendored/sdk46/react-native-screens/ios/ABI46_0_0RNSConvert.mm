#import "ABI46_0_0RNSConvert.h"

#ifdef RN_FABRIC_ENABLED
@implementation ABI46_0_0RNSConvert

+ (ABI46_0_0RNSScreenStackPresentation)ABI46_0_0RNSScreenStackPresentationFromCppEquivalent:
    (ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackPresentation)stackPresentation
{
  switch (stackPresentation) {
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackPresentation::Push:
      return ABI46_0_0RNSScreenStackPresentationPush;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackPresentation::Modal:
      return ABI46_0_0RNSScreenStackPresentationModal;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackPresentation::FullScreenModal:
      return ABI46_0_0RNSScreenStackPresentationFullScreenModal;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackPresentation::FormSheet:
      return ABI46_0_0RNSScreenStackPresentationFormSheet;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackPresentation::ContainedModal:
      return ABI46_0_0RNSScreenStackPresentationContainedModal;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackPresentation::TransparentModal:
      return ABI46_0_0RNSScreenStackPresentationTransparentModal;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackPresentation::ContainedTransparentModal:
      return ABI46_0_0RNSScreenStackPresentationContainedTransparentModal;
  }
}

+ (ABI46_0_0RNSScreenStackAnimation)ABI46_0_0RNSScreenStackAnimationFromCppEquivalent:
    (ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackAnimation)stackAnimation
{
  switch (stackAnimation) {
    // these three are intentionally grouped
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackAnimation::Slide_from_right:
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackAnimation::Slide_from_left:
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackAnimation::Default:
      return ABI46_0_0RNSScreenStackAnimationDefault;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackAnimation::Flip:
      return ABI46_0_0RNSScreenStackAnimationFlip;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackAnimation::Simple_push:
      return ABI46_0_0RNSScreenStackAnimationSimplePush;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackAnimation::None:
      return ABI46_0_0RNSScreenStackAnimationNone;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackAnimation::Fade:
      return ABI46_0_0RNSScreenStackAnimationFade;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackAnimation::Slide_from_bottom:
      return ABI46_0_0RNSScreenStackAnimationSlideFromBottom;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackAnimation::Fade_from_bottom:
      return ABI46_0_0RNSScreenStackAnimationFadeFromBottom;
  }
}

+ (ABI46_0_0RNSScreenStackHeaderSubviewType)ABI46_0_0RNSScreenStackHeaderSubviewTypeFromCppEquivalent:
    (ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackHeaderSubviewType)subviewType
{
  switch (subviewType) {
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackHeaderSubviewType::Left:
      return ABI46_0_0RNSScreenStackHeaderSubviewTypeLeft;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackHeaderSubviewType::Right:
      return ABI46_0_0RNSScreenStackHeaderSubviewTypeRight;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackHeaderSubviewType::Title:
      return ABI46_0_0RNSScreenStackHeaderSubviewTypeTitle;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackHeaderSubviewType::Center:
      return ABI46_0_0RNSScreenStackHeaderSubviewTypeCenter;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackHeaderSubviewType::SearchBar:
      return ABI46_0_0RNSScreenStackHeaderSubviewTypeSearchBar;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackHeaderSubviewType::Back:
      return ABI46_0_0RNSScreenStackHeaderSubviewTypeBackButton;
  }
}

+ (ABI46_0_0RNSScreenReplaceAnimation)ABI46_0_0RNSScreenReplaceAnimationFromCppEquivalent:
    (ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenReplaceAnimation)replaceAnimation
{
  switch (replaceAnimation) {
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenReplaceAnimation::Pop:
      return ABI46_0_0RNSScreenReplaceAnimationPop;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenReplaceAnimation::Push:
      return ABI46_0_0RNSScreenReplaceAnimationPush;
  }
}

+ (ABI46_0_0RNSScreenSwipeDirection)ABI46_0_0RNSScreenSwipeDirectionFromCppEquivalent:
    (ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenSwipeDirection)swipeDirection
{
  switch (swipeDirection) {
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenSwipeDirection::Horizontal:
      return ABI46_0_0RNSScreenSwipeDirectionHorizontal;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenSwipeDirection::Vertical:
      return ABI46_0_0RNSScreenSwipeDirectionVertical;
  }
}

+ (NSDictionary *)gestureResponseDistanceDictFromCppStruct:
    (const ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenGestureResponseDistanceStruct &)gestureResponseDistance
{
  return @{
    @"start" : @(gestureResponseDistance.start),
    @"end" : @(gestureResponseDistance.end),
    @"top" : @(gestureResponseDistance.top),
    @"bottom" : @(gestureResponseDistance.bottom),
  };
}

+ (UITextAutocapitalizationType)UITextAutocapitalizationTypeFromCppEquivalent:
    (ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSSearchBarAutoCapitalize)autoCapitalize
{
  switch (autoCapitalize) {
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSSearchBarAutoCapitalize::Words:
      return UITextAutocapitalizationTypeWords;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSSearchBarAutoCapitalize::Sentences:
      return UITextAutocapitalizationTypeSentences;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSSearchBarAutoCapitalize::Characters:
      return UITextAutocapitalizationTypeAllCharacters;
    case ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSSearchBarAutoCapitalize::None:
      return UITextAutocapitalizationTypeNone;
  }
}

@end

#endif // RN_FABRIC_ENABLED
