
#import "DevLauncherRNSVGGroup.h"
#import "DevLauncherRNSVGLength.h"

@interface DevLauncherRNSVGPattern : DevLauncherRNSVGGroup

@property (nonatomic, strong) DevLauncherRNSVGLength *x;
@property (nonatomic, strong) DevLauncherRNSVGLength *y;
@property (nonatomic, strong) DevLauncherRNSVGLength *patternwidth;
@property (nonatomic, strong) DevLauncherRNSVGLength *patternheight;
@property (nonatomic, assign) DevLauncherRNSVGUnits patternUnits;
@property (nonatomic, assign) DevLauncherRNSVGUnits patternContentUnits;
@property (nonatomic, assign) CGAffineTransform patternTransform;

@property (nonatomic, assign) CGFloat minX;
@property (nonatomic, assign) CGFloat minY;
@property (nonatomic, assign) CGFloat vbWidth;
@property (nonatomic, assign) CGFloat vbHeight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) DevLauncherRNSVGVBMOS meetOrSlice;

@end
