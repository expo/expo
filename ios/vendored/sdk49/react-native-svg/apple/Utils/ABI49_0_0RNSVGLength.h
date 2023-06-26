#import "ABI49_0_0RNSVGUIKit.h"

#ifndef ABI49_0_0RNSVGLength_h
#define ABI49_0_0RNSVGLength_h

// https://www.w3.org/TR/SVG/types.html#InterfaceSVGLength
typedef CF_ENUM(unsigned short, ABI49_0_0RNSVGLengthUnitType) {
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

@interface ABI49_0_0RNSVGLength : NSObject

@property (nonatomic, assign) CGFloat value;
@property (nonatomic, assign) ABI49_0_0RNSVGLengthUnitType unit;

+ (instancetype)lengthWithNumber:(CGFloat)number;
+ (instancetype)lengthWithString:(NSString *)lengthString;
- (BOOL)isEqualTo:(ABI49_0_0RNSVGLength *)other;

@end

#endif /* ABI49_0_0RNSVGLength_h */
