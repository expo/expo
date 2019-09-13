
#import "ABI35_0_0RNSVGGroup.h"
#import "ABI35_0_0RNSVGLength.h"

@interface ABI35_0_0RNSVGMask : ABI35_0_0RNSVGGroup

@property (nonatomic, strong) ABI35_0_0RNSVGLength *x;
@property (nonatomic, strong) ABI35_0_0RNSVGLength *y;
@property (nonatomic, strong) ABI35_0_0RNSVGLength *maskwidth;
@property (nonatomic, strong) ABI35_0_0RNSVGLength *maskheight;
@property (nonatomic, assign) ABI35_0_0RNSVGUnits maskUnits;
@property (nonatomic, assign) ABI35_0_0RNSVGUnits maskContentUnits;
@property (nonatomic, assign) CGAffineTransform maskTransform;

@end
