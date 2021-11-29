
#import "DevLauncherRNSVGGroup.h"
#import "DevLauncherRNSVGLength.h"

@interface DevLauncherRNSVGMask : DevLauncherRNSVGGroup

@property (nonatomic, strong) DevLauncherRNSVGLength *x;
@property (nonatomic, strong) DevLauncherRNSVGLength *y;
@property (nonatomic, strong) DevLauncherRNSVGLength *maskwidth;
@property (nonatomic, strong) DevLauncherRNSVGLength *maskheight;
@property (nonatomic, assign) DevLauncherRNSVGUnits maskUnits;
@property (nonatomic, assign) DevLauncherRNSVGUnits maskContentUnits;
@property (nonatomic, assign) CGAffineTransform maskTransform;

@end
