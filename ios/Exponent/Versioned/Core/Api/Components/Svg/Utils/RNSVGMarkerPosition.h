
#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>

typedef enum RNSVGMarkerType {
    kStartMarker,
    kMidMarker,
    kEndMarker
} RNSVGMarkerType;

#define RNSVGZEROPOINT CGRectZero.origin

@interface RNSVGMarkerPosition : NSObject

// Element storage
@property (nonatomic, assign) RNSVGMarkerType type;
@property (nonatomic, assign) CGPoint origin;
@property (nonatomic, assign) float angle;

// Instance creation
+ (instancetype) markerPosition:(RNSVGMarkerType)type origin:(CGPoint)origin angle:(float)angle;

+ (NSArray<RNSVGMarkerPosition*>*) fromCGPath:(CGPathRef)path;

@end
