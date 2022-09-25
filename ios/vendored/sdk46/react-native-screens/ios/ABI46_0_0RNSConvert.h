#ifdef RN_FABRIC_ENABLED
#import <react/renderer/components/rnscreens/Props.h>
#import "ABI46_0_0RNSEnums.h"

@interface ABI46_0_0RNSConvert : NSObject

+ (ABI46_0_0RNSScreenStackPresentation)ABI46_0_0RNSScreenStackPresentationFromCppEquivalent:
    (ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackPresentation)stackPresentation;

+ (ABI46_0_0RNSScreenStackAnimation)ABI46_0_0RNSScreenStackAnimationFromCppEquivalent:
    (ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackAnimation)stackAnimation;

+ (ABI46_0_0RNSScreenStackHeaderSubviewType)ABI46_0_0RNSScreenStackHeaderSubviewTypeFromCppEquivalent:
    (ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenStackHeaderSubviewType)subviewType;

+ (ABI46_0_0RNSScreenReplaceAnimation)ABI46_0_0RNSScreenReplaceAnimationFromCppEquivalent:
    (ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenReplaceAnimation)replaceAnimation;

+ (ABI46_0_0RNSScreenSwipeDirection)ABI46_0_0RNSScreenSwipeDirectionFromCppEquivalent:
    (ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenSwipeDirection)swipeDirection;

+ (NSDictionary *)gestureResponseDistanceDictFromCppStruct:
    (const ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSScreenGestureResponseDistanceStruct &)gestureResponseDistance;

+ (UITextAutocapitalizationType)UITextAutocapitalizationTypeFromCppEquivalent:
    (ABI46_0_0facebook::ABI46_0_0React::ABI46_0_0RNSSearchBarAutoCapitalize)autoCapitalize;

@end

#endif // RN_FABRIC_ENABLED
