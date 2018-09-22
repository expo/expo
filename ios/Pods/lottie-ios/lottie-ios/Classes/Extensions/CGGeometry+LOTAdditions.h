
#import "LOTPlatformCompat.h"

#import <CoreGraphics/CoreGraphics.h>

//
// Core Graphics Geometry Additions
//

extern const CGSize CGSizeMax;

CGRect LOT_RectIntegral(CGRect rect);

// Centering

// Returns a rectangle of the given size, centered at a point
CGRect LOT_RectCenteredAtPoint(CGPoint center, CGSize size, BOOL integral);

// Returns the center point of a CGRect
CGPoint LOT_RectGetCenterPoint(CGRect rect);

// Insetting

// Inset the rectangle on a single edge
CGRect LOT_RectInsetLeft(CGRect rect, CGFloat inset);
CGRect LOT_RectInsetRight(CGRect rect, CGFloat inset);
CGRect LOT_RectInsetTop(CGRect rect, CGFloat inset);
CGRect LOT_RectInsetBottom(CGRect rect, CGFloat inset);

// Inset the rectangle on two edges
CGRect LOT_RectInsetHorizontal(CGRect rect, CGFloat leftInset, CGFloat rightInset);
CGRect LOT_RectInsetVertical(CGRect rect, CGFloat topInset, CGFloat bottomInset);

// Inset the rectangle on all edges
CGRect LOT_RectInsetAll(CGRect rect, CGFloat leftInset, CGFloat rightInset, CGFloat topInset, CGFloat bottomInset);

// Framing

// Returns a rectangle of size framed in the center of the given rectangle
CGRect LOT_RectFramedCenteredInRect(CGRect rect, CGSize size, BOOL integral);

// Returns a rectangle of size framed in the given rectangle and inset
CGRect LOT_RectFramedLeftInRect(CGRect rect, CGSize size, CGFloat inset, BOOL integral);
CGRect LOT_RectFramedRightInRect(CGRect rect, CGSize size, CGFloat inset, BOOL integral);
CGRect LOT_RectFramedTopInRect(CGRect rect, CGSize size, CGFloat inset, BOOL integral);
CGRect LOT_RectFramedBottomInRect(CGRect rect, CGSize size, CGFloat inset, BOOL integral);

CGRect LOT_RectFramedTopLeftInRect(CGRect rect, CGSize size, CGFloat insetWidth, CGFloat insetHeight, BOOL integral);
CGRect LOT_RectFramedTopRightInRect(CGRect rect, CGSize size, CGFloat insetWidth, CGFloat insetHeight, BOOL integral);
CGRect LOT_RectFramedBottomLeftInRect(CGRect rect, CGSize size, CGFloat insetWidth, CGFloat insetHeight, BOOL integral);
CGRect LOT_RectFramedBottomRightInRect(CGRect rect, CGSize size, CGFloat insetWidth, CGFloat insetHeight, BOOL integral);

// Divides a rect into sections and returns the section at specified index

CGRect LOT_RectDividedSection(CGRect rect, NSInteger sections, NSInteger index, CGRectEdge fromEdge);

// Returns a rectangle of size attached to the given rectangle
CGRect LOT_RectAttachedLeftToRect(CGRect rect, CGSize size, CGFloat margin, BOOL integral);
CGRect LOT_RectAttachedRightToRect(CGRect rect, CGSize size, CGFloat margin, BOOL integral);
CGRect LOT_RectAttachedTopToRect(CGRect rect, CGSize size, CGFloat margin, BOOL integral);
CGRect LOT_RectAttachedBottomToRect(CGRect rect, CGSize size, CGFloat margin, BOOL integral);

CGRect LOT_RectAttachedBottomLeftToRect(CGRect rect, CGSize size, CGFloat marginWidth, CGFloat marginHeight, BOOL integral);
CGRect LOT_RectAttachedBottomRightToRect(CGRect rect, CGSize size, CGFloat marginWidth, CGFloat marginHeight, BOOL integral);
CGRect LOT_RectAttachedTopRightToRect(CGRect rect, CGSize size, CGFloat marginWidth, CGFloat marginHeight, BOOL integral);
CGRect LOT_RectAttachedTopLeftToRect(CGRect rect, CGSize size, CGFloat marginWidth, CGFloat marginHeight, BOOL integral);

BOOL LOT_CGPointIsZero(CGPoint point);

// Combining
// Adds all values of the 2nd rect to the first rect
CGRect LOT_RectAddRect(CGRect rect, CGRect other);
CGRect LOT_RectAddPoint(CGRect rect, CGPoint point);
CGRect LOT_RectAddSize(CGRect rect, CGSize size);
CGRect LOT_RectBounded(CGRect rect);

CGPoint LOT_PointAddedToPoint(CGPoint point1, CGPoint point2);

CGRect LOT_RectSetHeight(CGRect rect, CGFloat height);

CGFloat LOT_PointDistanceFromPoint(CGPoint point1, CGPoint point2);
CGFloat LOT_DegreesToRadians(CGFloat degrees);

CGFloat LOT_RemapValue(CGFloat value, CGFloat low1, CGFloat high1, CGFloat low2, CGFloat high2 );
CGPoint LOT_PointByLerpingPoints(CGPoint point1, CGPoint point2, CGFloat value);

CGPoint LOT_PointInLine(CGPoint A, CGPoint B, CGFloat T);
CGPoint LOT_PointInCubicCurve(CGPoint start, CGPoint cp1, CGPoint cp2, CGPoint end, CGFloat T);

CGFloat LOT_CubicBezeirInterpolate(CGPoint P0, CGPoint P1, CGPoint P2, CGPoint P3, CGFloat x);
CGFloat LOT_SolveCubic(CGFloat a, CGFloat b, CGFloat c, CGFloat d);
CGFloat LOT_SolveQuadratic(CGFloat a, CGFloat b, CGFloat c);
CGFloat LOT_Squared(CGFloat f);
CGFloat LOT_Cubed(CGFloat f);
CGFloat LOT_CubicRoot(CGFloat f);

CGFloat LOT_CubicLength(CGPoint fromPoint, CGPoint toPoint, CGPoint controlPoint1, CGPoint controlPoint2);
CGFloat LOT_CubicLengthWithPrecision(CGPoint fromPoint, CGPoint toPoint, CGPoint controlPoint1, CGPoint controlPoint2, CGFloat iterations);
