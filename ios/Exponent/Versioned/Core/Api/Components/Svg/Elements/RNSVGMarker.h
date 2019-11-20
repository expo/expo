
#import "RNSVGGroup.h"
#import "RNSVGLength.h"
#import "RNSVGMarkerPosition.h"

@interface RNSVGMarker : RNSVGGroup

@property (nonatomic, strong) RNSVGLength *refX;
@property (nonatomic, strong) RNSVGLength *refY;
@property (nonatomic, strong) RNSVGLength *markerWidth;
@property (nonatomic, strong) RNSVGLength *markerHeight;
@property (nonatomic, strong) NSString *markerUnits;
@property (nonatomic, strong) NSString *orient;

@property (nonatomic, assign) CGFloat minX;
@property (nonatomic, assign) CGFloat minY;
@property (nonatomic, assign) CGFloat vbWidth;
@property (nonatomic, assign) CGFloat vbHeight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) RNSVGVBMOS meetOrSlice;

- (void)renderMarker:(CGContextRef)context rect:(CGRect)rect position:(RNSVGMarkerPosition*)position strokeWidth:(CGFloat)strokeWidth;

@end
