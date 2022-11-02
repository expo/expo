package com.horcrux.svg;

import java.util.ArrayList;

enum RNSVGMarkerType {
  kStartMarker,
  kMidMarker,
  kEndMarker
}

enum ElementType {
  kCGPathElementAddCurveToPoint,
  kCGPathElementAddQuadCurveToPoint,
  kCGPathElementMoveToPoint,
  kCGPathElementAddLineToPoint,
  kCGPathElementCloseSubpath
}

class Point {
  double x;
  double y;

  Point(double x, double y) {
    this.x = x;
    this.y = y;
  }
}

class SegmentData {
  Point start_tangent; // Tangent in the start point of the segment.
  Point end_tangent; // Tangent in the end point of the segment.
  Point position; // The end point of the segment.
}

class RNSVGMarkerPosition {

  private static ArrayList<RNSVGMarkerPosition> positions_;
  private static int element_index_;
  private static Point origin_;
  private static Point subpath_start_;
  private static Point in_slope_;
  private static Point out_slope_;

  @SuppressWarnings("unused")
  private static boolean auto_start_reverse_; // TODO

  RNSVGMarkerType type;
  Point origin;
  double angle;

  private RNSVGMarkerPosition(RNSVGMarkerType type, Point origin, double angle) {
    this.type = type;
    this.origin = origin;
    this.angle = angle;
  }

  static ArrayList<RNSVGMarkerPosition> fromPath(ArrayList<PathElement> elements) {
    positions_ = new ArrayList<>();
    element_index_ = 0;
    origin_ = new Point(0, 0);
    subpath_start_ = new Point(0, 0);
    for (PathElement e : elements) {
      UpdateFromPathElement(e);
    }
    PathIsDone();
    return positions_;
  }

  private static void PathIsDone() {
    double angle = CurrentAngle(RNSVGMarkerType.kEndMarker);
    positions_.add(new RNSVGMarkerPosition(RNSVGMarkerType.kEndMarker, origin_, angle));
  }

  private static double BisectingAngle(double in_angle, double out_angle) {
    // WK193015: Prevent bugs due to angles being non-continuous.
    if (Math.abs(in_angle - out_angle) > 180) in_angle += 360;
    return (in_angle + out_angle) / 2;
  }

  private static double rad2deg(double rad) {
    double RNSVG_radToDeg = 180 / Math.PI;
    return rad * RNSVG_radToDeg;
  }

  private static double SlopeAngleRadians(Point p) {
    return Math.atan2(p.y, p.x);
  }

  private static double CurrentAngle(RNSVGMarkerType type) {
    // For details of this calculation, see:
    // http://www.w3.org/TR/SVG/single-page.html#painting-MarkerElement
    double in_angle = rad2deg(SlopeAngleRadians(in_slope_));
    double out_angle = rad2deg(SlopeAngleRadians(out_slope_));
    switch (type) {
      case kStartMarker:
        if (auto_start_reverse_) out_angle += 180;
        return out_angle;
      case kMidMarker:
        return BisectingAngle(in_angle, out_angle);
      case kEndMarker:
        return in_angle;
    }
    return 0;
  }

  private static Point subtract(Point p1, Point p2) {
    return new Point(p2.x - p1.x, p2.y - p1.y);
  }

  private static boolean isZero(Point p) {
    return p.x == 0 && p.y == 0;
  }

  private static void ComputeQuadTangents(SegmentData data, Point start, Point control, Point end) {
    data.start_tangent = subtract(control, start);
    data.end_tangent = subtract(end, control);
    if (isZero(data.start_tangent)) data.start_tangent = data.end_tangent;
    else if (isZero(data.end_tangent)) data.end_tangent = data.start_tangent;
  }

  private static SegmentData ExtractPathElementFeatures(PathElement element) {
    SegmentData data = new SegmentData();
    Point[] points = element.points;
    switch (element.type) {
      case kCGPathElementAddCurveToPoint:
        data.position = points[2];
        data.start_tangent = subtract(points[0], origin_);
        data.end_tangent = subtract(points[2], points[1]);
        if (isZero(data.start_tangent)) ComputeQuadTangents(data, points[0], points[1], points[2]);
        else if (isZero(data.end_tangent)) ComputeQuadTangents(data, origin_, points[0], points[1]);
        break;
      case kCGPathElementAddQuadCurveToPoint:
        data.position = points[1];
        ComputeQuadTangents(data, origin_, points[0], points[1]);
        break;
      case kCGPathElementMoveToPoint:
      case kCGPathElementAddLineToPoint:
        data.position = points[0];
        data.start_tangent = subtract(data.position, origin_);
        data.end_tangent = subtract(data.position, origin_);
        break;
      case kCGPathElementCloseSubpath:
        data.position = subpath_start_;
        data.start_tangent = subtract(data.position, origin_);
        data.end_tangent = subtract(data.position, origin_);
        break;
    }
    return data;
  }

  private static void UpdateFromPathElement(PathElement element) {
    SegmentData segment_data = ExtractPathElementFeatures(element);
    // First update the outgoing slope for the previous element.
    out_slope_ = segment_data.start_tangent;
    // Record the marker for the previous element.
    if (element_index_ > 0) {
      RNSVGMarkerType marker_type =
          element_index_ == 1 ? RNSVGMarkerType.kStartMarker : RNSVGMarkerType.kMidMarker;
      double angle = CurrentAngle(marker_type);
      positions_.add(new RNSVGMarkerPosition(marker_type, origin_, angle));
    }
    // Update the incoming slope for this marker position.
    in_slope_ = segment_data.end_tangent;
    // Update marker position.
    origin_ = segment_data.position;
    // If this is a 'move to' segment, save the point for use with 'close'.
    if (element.type == ElementType.kCGPathElementMoveToPoint) subpath_start_ = element.points[0];
    else if (element.type == ElementType.kCGPathElementCloseSubpath)
      subpath_start_ = new Point(0, 0);
    ++element_index_;
  }
}
