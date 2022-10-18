
#import "RNSVGMarkerPosition.h"

@implementation RNSVGMarkerPosition
- (instancetype)init
{
  self = [super init];
  if (self) {
    _type = kStartMarker;
    _origin = RNSVGZEROPOINT;
    _angle = 0;
  }
  return self;
}

+ (instancetype)markerPosition:(RNSVGMarkerType)type origin:(CGPoint)origin angle:(float)angle
{
  RNSVGMarkerPosition *newElement = [[self alloc] init];
  newElement.type = type;
  newElement.origin = origin;
  newElement.angle = angle;
  return newElement;
}

+ (NSArray<RNSVGMarkerPosition *> *)fromCGPath:(CGPathRef)path
{
  positions_ = [[NSMutableArray alloc] init];
  element_index_ = 0;
  origin_ = RNSVGZEROPOINT;
  subpath_start_ = RNSVGZEROPOINT;
  CGPathApply(path, (__bridge void *)positions_, UpdateFromPathElement);
  PathIsDone();
  return positions_;
}

void PathIsDone()
{
  float angle = CurrentAngle(kEndMarker);
  [positions_ addObject:[RNSVGMarkerPosition markerPosition:kEndMarker origin:origin_ angle:angle]];
}

static double BisectingAngle(double in_angle, double out_angle)
{
  // WK193015: Prevent bugs due to angles being non-continuous.
  if (fabs(in_angle - out_angle) > 180)
    in_angle += 360;
  return (in_angle + out_angle) / 2;
}

static CGFloat RNSVG_radToDeg = 180 / (CGFloat)M_PI;

double rad2deg(CGFloat rad)
{
  return rad * RNSVG_radToDeg;
}

CGFloat SlopeAngleRadians(CGSize p)
{
  CGFloat angle = atan2(p.height, p.width);
  return angle;
}

double CurrentAngle(RNSVGMarkerType type)
{
  // For details of this calculation, see:
  // http://www.w3.org/TR/SVG/single-page.html#painting-MarkerElement
  double in_angle = rad2deg(SlopeAngleRadians(in_slope_));
  double out_angle = rad2deg(SlopeAngleRadians(out_slope_));
  switch (type) {
    case kStartMarker:
      if (auto_start_reverse_)
        out_angle += 180;
      return out_angle;
    case kMidMarker:
      return BisectingAngle(in_angle, out_angle);
    case kEndMarker:
      return in_angle;
  }
  return 0;
}

typedef struct SegmentData {
  CGSize start_tangent; // Tangent in the start point of the segment.
  CGSize end_tangent; // Tangent in the end point of the segment.
  CGPoint position; // The end point of the segment.
} SegmentData;

CGSize subtract(CGPoint *p1, CGPoint *p2)
{
  return CGSizeMake(p2->x - p1->x, p2->y - p1->y);
}

static void ComputeQuadTangents(SegmentData *data, CGPoint *start, CGPoint *control, CGPoint *end)
{
  data->start_tangent = subtract(control, start);
  data->end_tangent = subtract(end, control);
  if (CGSizeEqualToSize(CGSizeZero, data->start_tangent))
    data->start_tangent = data->end_tangent;
  else if (CGSizeEqualToSize(CGSizeZero, data->end_tangent))
    data->end_tangent = data->start_tangent;
}

SegmentData ExtractPathElementFeatures(const CGPathElement *element)
{
  SegmentData data;
  CGPoint *points = element->points;
  switch (element->type) {
    case kCGPathElementAddCurveToPoint:
      data.position = points[2];
      data.start_tangent = subtract(&points[0], &origin_);
      data.end_tangent = subtract(&points[2], &points[1]);
      if (CGSizeEqualToSize(CGSizeZero, data.start_tangent))
        ComputeQuadTangents(&data, &points[0], &points[1], &points[2]);
      else if (CGSizeEqualToSize(CGSizeZero, data.end_tangent))
        ComputeQuadTangents(&data, &origin_, &points[0], &points[1]);
      break;
    case kCGPathElementAddQuadCurveToPoint:
      data.position = points[1];
      ComputeQuadTangents(&data, &origin_, &points[0], &points[1]);
      break;
    case kCGPathElementMoveToPoint:
    case kCGPathElementAddLineToPoint:
      data.position = points[0];
      data.start_tangent = subtract(&data.position, &origin_);
      data.end_tangent = subtract(&data.position, &origin_);
      break;
    case kCGPathElementCloseSubpath:
      data.position = subpath_start_;
      data.start_tangent = subtract(&data.position, &origin_);
      data.end_tangent = subtract(&data.position, &origin_);
      break;
  }
  return data;
}

void UpdateFromPathElement(void *info, const CGPathElement *element)
{
  SegmentData segment_data = ExtractPathElementFeatures(element);
  // First update the outgoing slope for the previous element.
  out_slope_ = segment_data.start_tangent;
  // Record the marker for the previous element.
  if (element_index_ > 0) {
    RNSVGMarkerType marker_type = element_index_ == 1 ? kStartMarker : kMidMarker;
    float angle = CurrentAngle(marker_type);
    [positions_ addObject:[RNSVGMarkerPosition markerPosition:marker_type origin:origin_ angle:angle]];
  }
  // Update the incoming slope for this marker position.
  in_slope_ = segment_data.end_tangent;
  // Update marker position.
  origin_ = segment_data.position;
  // If this is a 'move to' segment, save the point for use with 'close'.
  if (element->type == kCGPathElementMoveToPoint)
    subpath_start_ = element->points[0];
  else if (element->type == kCGPathElementCloseSubpath)
    subpath_start_ = CGPointZero;
  ++element_index_;
}

NSMutableArray<RNSVGMarkerPosition *> *positions_;
unsigned element_index_;
CGPoint origin_;
CGPoint subpath_start_;
CGSize in_slope_;
CGSize out_slope_;
bool auto_start_reverse_;

@end
