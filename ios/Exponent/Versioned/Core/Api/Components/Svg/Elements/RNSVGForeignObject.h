
#import "RNSVGGroup.h"
#import "RNSVGLength.h"
#import "RCTEventDispatcher.h"

@interface RNSVGForeignObject : RNSVGGroup

@property (nonatomic, strong) RNSVGLength *x;
@property (nonatomic, strong) RNSVGLength *y;
@property (nonatomic, strong) RNSVGLength *foreignObjectwidth;
@property (nonatomic, strong) RNSVGLength *foreignObjectheight;

@end
