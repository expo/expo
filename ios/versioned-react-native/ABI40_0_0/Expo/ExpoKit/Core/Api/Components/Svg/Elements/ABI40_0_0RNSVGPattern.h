
#import "ABI40_0_0RNSVGGroup.h"
#import "ABI40_0_0RNSVGLength.h"

@interface ABI40_0_0RNSVGPattern : ABI40_0_0RNSVGGroup

@property (nonatomic, strong) ABI40_0_0RNSVGLength *x;
@property (nonatomic, strong) ABI40_0_0RNSVGLength *y;
@property (nonatomic, strong) ABI40_0_0RNSVGLength *patternwidth;
@property (nonatomic, strong) ABI40_0_0RNSVGLength *patternheight;
@property (nonatomic, assign) ABI40_0_0RNSVGUnits patternUnits;
@property (nonatomic, assign) ABI40_0_0RNSVGUnits patternContentUnits;
@property (nonatomic, assign) CGAffineTransform patternTransform;

@property (nonatomic, assign) CGFloat minX;
@property (nonatomic, assign) CGFloat minY;
@property (nonatomic, assign) CGFloat vbWidth;
@property (nonatomic, assign) CGFloat vbHeight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) ABI40_0_0RNSVGVBMOS meetOrSlice;

@end
