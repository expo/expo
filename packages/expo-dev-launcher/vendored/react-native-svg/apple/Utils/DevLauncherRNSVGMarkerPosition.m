
#import "DevLauncherRNSVGMarkerPosition.h"

@implementation DevLauncherRNSVGMarkerPosition
- (instancetype) init
{
    self = [super init];
    if (self)
    {
        _type = kStartMarker;
        _origin = DevLauncherRNSVGZEROPOINT;
        _angle = 0;
    }
    return self;
}

+ (instancetype) markerPosition:(DevLauncherRNSVGMarkerType)type origin:(CGPoint)origin angle:(float)angle {
    DevLauncherRNSVGMarkerPosition *newElement = [[self alloc] init];
    newElement.type = type;
    newElement.origin = origin;
    newElement.angle = angle;
    return newElement;
}

+ (NSArray<DevLauncherRNSVGMarkerPosition*>*) fromCGPath:(CGPathRef)path {
    __positions__ = [[NSMutableArray alloc] init];
    __element_index__ = 0;
    __origin__ = DevLauncherRNSVGZEROPOINT;
    __subpath_start__ = DevLauncherRNSVGZEROPOINT;
    CGPathApply(path, (__bridge void *)__positions__, __UpdateFromPathElement__);
    __PathIsDone__();
    return __positions__;
}

void __PathIsDone__() {
    float angle = __CurrentAngle__(kEndMarker);
    [__positions__ addObject:[DevLauncherRNSVGMarkerPosition markerPosition:kEndMarker origin:__origin__ angle:angle]];
}

static double __BisectingAngle__(double in_angle, double out_angle) {
    // WK193015: Prevent bugs due to angles being non-continuous.
    if (fabs(in_angle - out_angle) > 180)
        in_angle += 360;
    return (in_angle + out_angle) / 2;
}

static CGFloat DevLauncherRNSVG_radToDeg = 180 / (CGFloat)M_PI;

double __rad2deg__(CGFloat rad) {
    return rad * DevLauncherRNSVG_radToDeg;
}

CGFloat __SlopeAngleRadians__(CGSize p) {
    CGFloat angle = atan2(p.height, p.width);
    return angle;
}

double __CurrentAngle__(DevLauncherRNSVGMarkerType type) {
    // For details of this calculation, see:
    // http://www.w3.org/TR/SVG/single-page.html#painting-MarkerElement
    double in_angle = __rad2deg__(__SlopeAngleRadians__(__in_slope__));
    double out_angle = __rad2deg__(__SlopeAngleRadians__(__out_slope__));
    switch (type) {
        case kStartMarker:
            if (__auto_start_reverse__)
                out_angle += 180;
            return out_angle;
        case kMidMarker:
            return __BisectingAngle__(in_angle, out_angle);
        case kEndMarker:
            return in_angle;
    }
    return 0;
}

typedef struct SegmentData {
    CGSize start_tangent;  // Tangent in the start point of the segment.
    CGSize end_tangent;    // Tangent in the end point of the segment.
    CGPoint position;      // The end point of the segment.
} SegmentData;

CGSize __subtract__(CGPoint* p1, CGPoint* p2) {
    return CGSizeMake(p2->x - p1->x, p2->y - p1->y);
}

static void ComputeQuadTangents(SegmentData* data,
                                CGPoint* start,
                                CGPoint* control,
                                CGPoint* end) {
    data->start_tangent = __subtract__(control, start);
    data->end_tangent = __subtract__(end, control);
    if (CGSizeEqualToSize(CGSizeZero, data->start_tangent))
        data->start_tangent = data->end_tangent;
    else if (CGSizeEqualToSize(CGSizeZero, data->end_tangent))
        data->end_tangent = data->start_tangent;
}

SegmentData __ExtractElementPathFeatures__(const CGPathElement* element) {
    SegmentData data;
    CGPoint* points = element->points;
    switch (element->type) {
        case kCGPathElementAddCurveToPoint:
            data.position = points[2];
            data.start_tangent = __subtract__(&points[0], &__origin__);
            data.end_tangent = __subtract__(&points[2], &points[1]);
            if (CGSizeEqualToSize(CGSizeZero, data.start_tangent))
                ComputeQuadTangents(&data, &points[0], &points[1], &points[2]);
            else if (CGSizeEqualToSize(CGSizeZero, data.end_tangent))
                ComputeQuadTangents(&data, &__origin__, &points[0], &points[1]);
            break;
        case kCGPathElementAddQuadCurveToPoint:
            data.position = points[1];
            ComputeQuadTangents(&data, &__origin__, &points[0], &points[1]);
            break;
        case kCGPathElementMoveToPoint:
        case kCGPathElementAddLineToPoint:
            data.position = points[0];
            data.start_tangent = __subtract__(&data.position, &__origin__);
            data.end_tangent = __subtract__(&data.position, &__origin__);
            break;
        case kCGPathElementCloseSubpath:
            data.position = __subpath_start__;
            data.start_tangent = __subtract__(&data.position, &__origin__);
            data.end_tangent = __subtract__(&data.position, &__origin__);
            break;
    }
    return data;
}

void __UpdateFromPathElement__(void *info, const CGPathElement *element) {
    SegmentData segment_data = __ExtractElementPathFeatures__(element);
    // First update the outgoing slope for the previous element.
    __out_slope__ = segment_data.start_tangent;
    // Record the marker for the previous element.
    if (__element_index__ > 0) {
        DevLauncherRNSVGMarkerType marker_type =
        __element_index__ == 1 ? kStartMarker : kMidMarker;
        float angle = __CurrentAngle__(marker_type);
        [__positions__ addObject:[DevLauncherRNSVGMarkerPosition markerPosition:marker_type origin:__origin__ angle:angle]];
    }
    // Update the incoming slope for this marker position.
    __in_slope__ = segment_data.end_tangent;
    // Update marker position.
    __origin__ = segment_data.position;
    // If this is a 'move to' segment, save the point for use with 'close'.
    if (element->type == kCGPathElementMoveToPoint)
        __subpath_start__ = element->points[0];
    else if (element->type == kCGPathElementCloseSubpath)
        __subpath_start__ = CGPointZero;
    ++__element_index__;
}

NSMutableArray<DevLauncherRNSVGMarkerPosition*>* __positions__;
unsigned __element_index__;
CGPoint __origin__;
CGPoint __subpath_start__;
CGSize __in_slope__;
CGSize __out_slope__;
bool __auto_start_reverse__;

@end
