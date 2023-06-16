
#import "RNSVGGroup.h"
#import "RNSVGLength.h"

@interface RNSVGMask : RNSVGGroup

@property (nonatomic, strong) RNSVGLength *x;
@property (nonatomic, strong) RNSVGLength *y;
@property (nonatomic, strong) RNSVGLength *maskwidth;
@property (nonatomic, strong) RNSVGLength *maskheight;
@property (nonatomic, assign) RNSVGUnits maskUnits;
@property (nonatomic, assign) RNSVGUnits maskContentUnits;

@end
