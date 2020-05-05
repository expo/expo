/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "NSBezierPath+RoundedCorners.h"

#if SD_MAC

@implementation NSBezierPath (RoundedCorners)

+ (instancetype)sd_bezierPathWithRoundedRect:(NSRect)rect byRoundingCorners:(SDRectCorner)corners cornerRadius:(CGFloat)cornerRadius {
    NSBezierPath *path = [NSBezierPath bezierPath];
    
    CGFloat maxCorner = MIN(NSWidth(rect), NSHeight(rect)) / 2;
    
    CGFloat topLeftRadius = MIN(maxCorner, (corners & SDRectCornerTopLeft) ? cornerRadius : 0);
    CGFloat topRightRadius = MIN(maxCorner, (corners & SDRectCornerTopRight) ? cornerRadius : 0);
    CGFloat bottomLeftRadius = MIN(maxCorner, (corners & SDRectCornerBottomLeft) ? cornerRadius : 0);
    CGFloat bottomRightRadius = MIN(maxCorner, (corners & SDRectCornerBottomRight) ? cornerRadius : 0);
    
    NSPoint topLeft = NSMakePoint(NSMinX(rect), NSMaxY(rect));
    NSPoint topRight = NSMakePoint(NSMaxX(rect), NSMaxY(rect));
    NSPoint bottomLeft = NSMakePoint(NSMinX(rect), NSMinY(rect));
    NSPoint bottomRight = NSMakePoint(NSMaxX(rect), NSMinY(rect));
    
    [path moveToPoint:NSMakePoint(NSMidX(rect), NSMaxY(rect))];
    [path appendBezierPathWithArcFromPoint:topLeft toPoint:bottomLeft radius:topLeftRadius];
    [path appendBezierPathWithArcFromPoint:bottomLeft toPoint:bottomRight radius:bottomLeftRadius];
    [path appendBezierPathWithArcFromPoint:bottomRight toPoint:topRight radius:bottomRightRadius];
    [path appendBezierPathWithArcFromPoint:topRight toPoint:topLeft radius:topRightRadius];
    [path closePath];
    
    return path;
}

@end

#endif
