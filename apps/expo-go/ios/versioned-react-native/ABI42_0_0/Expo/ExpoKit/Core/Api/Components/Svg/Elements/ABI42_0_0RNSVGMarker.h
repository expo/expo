
#import "ABI42_0_0RNSVGGroup.h"
#import "ABI42_0_0RNSVGLength.h"
#import "ABI42_0_0RNSVGMarkerPosition.h"

@interface ABI42_0_0RNSVGMarker : ABI42_0_0RNSVGGroup

@property (nonatomic, strong) ABI42_0_0RNSVGLength *refX;
@property (nonatomic, strong) ABI42_0_0RNSVGLength *refY;
@property (nonatomic, strong) ABI42_0_0RNSVGLength *markerWidth;
@property (nonatomic, strong) ABI42_0_0RNSVGLength *markerHeight;
@property (nonatomic, strong) NSString *markerUnits;
@property (nonatomic, strong) NSString *orient;

@property (nonatomic, assign) CGFloat minX;
@property (nonatomic, assign) CGFloat minY;
@property (nonatomic, assign) CGFloat vbWidth;
@property (nonatomic, assign) CGFloat vbHeight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) ABI42_0_0RNSVGVBMOS meetOrSlice;

- (void)renderMarker:(CGContextRef)context rect:(CGRect)rect position:(ABI42_0_0RNSVGMarkerPosition*)position strokeWidth:(CGFloat)strokeWidth;

@end
