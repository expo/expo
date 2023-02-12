#ifdef RN_FABRIC_ENABLED
#import <react/renderer/components/rnscreens/Props.h>
#import "ABI47_0_0RNSEnums.h"

@interface ABI47_0_0RNSConvert : NSObject

+ (ABI47_0_0RNSScreenStackPresentation)ABI47_0_0RNSScreenStackPresentationFromCppEquivalent:
    (ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackPresentation)stackPresentation;

+ (ABI47_0_0RNSScreenStackAnimation)ABI47_0_0RNSScreenStackAnimationFromCppEquivalent:
    (ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackAnimation)stackAnimation;

+ (ABI47_0_0RNSScreenStackHeaderSubviewType)ABI47_0_0RNSScreenStackHeaderSubviewTypeFromCppEquivalent:
    (ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackHeaderSubviewType)subviewType;

+ (ABI47_0_0RNSScreenReplaceAnimation)ABI47_0_0RNSScreenReplaceAnimationFromCppEquivalent:
    (ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenReplaceAnimation)replaceAnimation;

+ (ABI47_0_0RNSScreenSwipeDirection)ABI47_0_0RNSScreenSwipeDirectionFromCppEquivalent:
    (ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenSwipeDirection)swipeDirection;

+ (NSDictionary *)gestureResponseDistanceDictFromCppStruct:
    (const ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenGestureResponseDistanceStruct &)gestureResponseDistance;

+ (UITextAutocapitalizationType)UITextAutocapitalizationTypeFromCppEquivalent:
    (ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSSearchBarAutoCapitalize)autoCapitalize;

@end

#endif // RN_FABRIC_ENABLED
