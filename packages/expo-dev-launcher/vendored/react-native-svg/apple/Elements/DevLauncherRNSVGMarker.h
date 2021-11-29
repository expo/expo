
#import "DevLauncherRNSVGGroup.h"
#import "DevLauncherRNSVGLength.h"
#import "DevLauncherRNSVGMarkerPosition.h"

@interface DevLauncherRNSVGMarker : DevLauncherRNSVGGroup

@property (nonatomic, strong) DevLauncherRNSVGLength *refX;
@property (nonatomic, strong) DevLauncherRNSVGLength *refY;
@property (nonatomic, strong) DevLauncherRNSVGLength *markerWidth;
@property (nonatomic, strong) DevLauncherRNSVGLength *markerHeight;
@property (nonatomic, strong) NSString *markerUnits;
@property (nonatomic, strong) NSString *orient;

@property (nonatomic, assign) CGFloat minX;
@property (nonatomic, assign) CGFloat minY;
@property (nonatomic, assign) CGFloat vbWidth;
@property (nonatomic, assign) CGFloat vbHeight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) DevLauncherRNSVGVBMOS meetOrSlice;

- (void)renderMarker:(CGContextRef)context rect:(CGRect)rect position:(DevLauncherRNSVGMarkerPosition*)position strokeWidth:(CGFloat)strokeWidth;

@end
