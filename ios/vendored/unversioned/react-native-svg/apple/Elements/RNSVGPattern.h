
#import "RNSVGGroup.h"
#import "RNSVGLength.h"

@interface RNSVGPattern : RNSVGGroup

@property (nonatomic, strong) RNSVGLength *x;
@property (nonatomic, strong) RNSVGLength *y;
@property (nonatomic, strong) RNSVGLength *patternwidth;
@property (nonatomic, strong) RNSVGLength *patternheight;
@property (nonatomic, assign) RNSVGUnits patternUnits;
@property (nonatomic, assign) RNSVGUnits patternContentUnits;
@property (nonatomic, assign) CGAffineTransform patternTransform;

@property (nonatomic, assign) CGFloat minX;
@property (nonatomic, assign) CGFloat minY;
@property (nonatomic, assign) CGFloat vbWidth;
@property (nonatomic, assign) CGFloat vbHeight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) RNSVGVBMOS meetOrSlice;

@end
