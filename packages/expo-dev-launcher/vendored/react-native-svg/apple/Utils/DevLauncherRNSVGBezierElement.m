/*

 Erica Sadun, http://ericasadun.com
 https://github.com/erica/iOS-Drawing/tree/master/C08/Quartz%20Book%20Pack/Bezier
 */

#import "DevLauncherRNSVGBezierElement.h"

#pragma mark - Bezier Element -

@implementation DevLauncherRNSVGBezierElement
- (instancetype) init
{
    self = [super init];
    if (self)
    {
        _elementType = kCGPathElementMoveToPoint;
        _point = DevLauncherRNSVGNULLPOINT;
        _controlPoint1 = DevLauncherRNSVGNULLPOINT;
        _controlPoint2 = DevLauncherRNSVGNULLPOINT;
    }
    return self;
}

+ (instancetype) elementWithPathElement: (CGPathElement) element
{
    DevLauncherRNSVGBezierElement *newElement = [[self alloc] init];
    newElement.elementType = element.type;

    switch (newElement.elementType)
    {
        case kCGPathElementCloseSubpath:
            break;
        case kCGPathElementMoveToPoint:
        case kCGPathElementAddLineToPoint:
        {
            newElement.point = element.points[0];
            break;
        }
        case kCGPathElementAddQuadCurveToPoint:
        {
            newElement.point = element.points[1];
            newElement.controlPoint1 = element.points[0];
            break;
        }
        case kCGPathElementAddCurveToPoint:
        {
            newElement.point = element.points[2];
            newElement.controlPoint1 = element.points[0];
            newElement.controlPoint2 = element.points[1];
            break;
        }
        default:
            break;
    }

    return newElement;
}

// Convert one element to DevLauncherRNSVGBezierElement and save to array
void DevLauncherRNSVGBezierElement_getBezierElements(void *info, const CGPathElement *element)
{
    NSMutableArray *bezierElements = (__bridge NSMutableArray *)info;
    if (element)
        [bezierElements addObject:[DevLauncherRNSVGBezierElement elementWithPathElement:*element]];
}

// Retrieve array of component elements
+ (NSArray *) elementsFromCGPath:(CGPathRef)path
{
    NSMutableArray *elements = [NSMutableArray array];
    CGPathApply(path, (__bridge void *)elements, DevLauncherRNSVGBezierElement_getBezierElements);
    return elements;
}

@end

