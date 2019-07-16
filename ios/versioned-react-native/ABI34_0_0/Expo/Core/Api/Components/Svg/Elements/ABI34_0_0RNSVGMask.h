
#import "ABI34_0_0RNSVGGroup.h"
#import "ABI34_0_0RNSVGLength.h"

@interface ABI34_0_0RNSVGMask : ABI34_0_0RNSVGGroup

@property (nonatomic, strong) ABI34_0_0RNSVGLength *x;
@property (nonatomic, strong) ABI34_0_0RNSVGLength *y;
@property (nonatomic, strong) ABI34_0_0RNSVGLength *maskwidth;
@property (nonatomic, strong) ABI34_0_0RNSVGLength *maskheight;
@property (nonatomic, assign) ABI34_0_0RNSVGUnits maskUnits;
@property (nonatomic, assign) ABI34_0_0RNSVGUnits maskContentUnits;
@property (nonatomic, assign) CGAffineTransform maskTransform;

@end
