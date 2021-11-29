#import "DevLauncherRNSVGUIKit.h"

#ifndef DevLauncherRNSVGLength_h
#define DevLauncherRNSVGLength_h

// https://www.w3.org/TR/SVG/types.html#InterfaceSVGLength
typedef CF_ENUM(unsigned short, DevLauncherRNSVGLengthUnitType) {
    SVG_LENGTHTYPE_UNKNOWN,
    SVG_LENGTHTYPE_NUMBER,
    SVG_LENGTHTYPE_PERCENTAGE,
    SVG_LENGTHTYPE_EMS,
    SVG_LENGTHTYPE_EXS,
    SVG_LENGTHTYPE_PX,
    SVG_LENGTHTYPE_CM,
    SVG_LENGTHTYPE_MM,
    SVG_LENGTHTYPE_IN,
    SVG_LENGTHTYPE_PT,
    SVG_LENGTHTYPE_PC,
};

@interface DevLauncherRNSVGLength : NSObject

@property (nonatomic, assign) CGFloat value;
@property (nonatomic, assign) DevLauncherRNSVGLengthUnitType unit;

+ (instancetype) lengthWithNumber: (CGFloat) number;
+ (instancetype) lengthWithString: (NSString *) lengthString;
- (BOOL) isEqualTo: (DevLauncherRNSVGLength *)other;

@end

#endif /* DevLauncherRNSVGLength_h */
