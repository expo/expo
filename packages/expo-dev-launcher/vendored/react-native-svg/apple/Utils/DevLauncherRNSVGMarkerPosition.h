#import <Foundation/Foundation.h>

#import "DevLauncherRNSVGUIKit.h"

typedef enum DevLauncherRNSVGMarkerType {
    kStartMarker,
    kMidMarker,
    kEndMarker
} DevLauncherRNSVGMarkerType;

#define DevLauncherRNSVGZEROPOINT CGRectZero.origin

@interface DevLauncherRNSVGMarkerPosition : NSObject

// Element storage
@property (nonatomic, assign) DevLauncherRNSVGMarkerType type;
@property (nonatomic, assign) CGPoint origin;
@property (nonatomic, assign) float angle;

// Instance creation
+ (instancetype) markerPosition:(DevLauncherRNSVGMarkerType)type origin:(CGPoint)origin angle:(float)angle;

+ (NSArray<DevLauncherRNSVGMarkerPosition*>*) fromCGPath:(CGPathRef)path;

@end
