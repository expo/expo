#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <react/renderer/components/rnscreens/Props.h>
#import "ABI49_0_0RNSEnums.h"

@interface ABI49_0_0RNSConvert : NSObject

+ (ABI49_0_0RNSScreenStackPresentation)ABI49_0_0RNSScreenStackPresentationFromCppEquivalent:
    (ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackPresentation)stackPresentation;

+ (ABI49_0_0RNSScreenStackAnimation)ABI49_0_0RNSScreenStackAnimationFromCppEquivalent:
    (ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackAnimation)stackAnimation;

+ (ABI49_0_0RNSScreenStackHeaderSubviewType)ABI49_0_0RNSScreenStackHeaderSubviewTypeFromCppEquivalent:
    (ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenStackHeaderSubviewType)subviewType;

+ (ABI49_0_0RNSScreenReplaceAnimation)ABI49_0_0RNSScreenReplaceAnimationFromCppEquivalent:
    (ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenReplaceAnimation)replaceAnimation;

+ (ABI49_0_0RNSScreenSwipeDirection)ABI49_0_0RNSScreenSwipeDirectionFromCppEquivalent:
    (ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenSwipeDirection)swipeDirection;

+ (ABI49_0_0RNSScreenDetentType)ABI49_0_0RNSScreenDetentTypeFromAllowedDetents:
    (ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenSheetAllowedDetents)allowedDetents;

+ (ABI49_0_0RNSScreenDetentType)ABI49_0_0RNSScreenDetentTypeFromLargestUndimmedDetent:
    (ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenSheetLargestUndimmedDetent)detent;

+ (NSDictionary *)gestureResponseDistanceDictFromCppStruct:
    (const ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenGestureResponseDistanceStruct &)gestureResponseDistance;

+ (UITextAutocapitalizationType)UITextAutocapitalizationTypeFromCppEquivalent:
    (ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSSearchBarAutoCapitalize)autoCapitalize;

@end

#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
