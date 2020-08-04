
#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>

typedef enum ABI38_0_0RNSVGMarkerType {
    kStartMarker,
    kMidMarker,
    kEndMarker
} ABI38_0_0RNSVGMarkerType;

#define ABI38_0_0RNSVGZEROPOINT CGRectZero.origin

@interface ABI38_0_0RNSVGMarkerPosition : NSObject

// Element storage
@property (nonatomic, assign) ABI38_0_0RNSVGMarkerType type;
@property (nonatomic, assign) CGPoint origin;
@property (nonatomic, assign) float angle;

// Instance creation
+ (instancetype) markerPosition:(ABI38_0_0RNSVGMarkerType)type origin:(CGPoint)origin angle:(float)angle;

+ (NSArray<ABI38_0_0RNSVGMarkerPosition*>*) fromCGPath:(CGPathRef)path;

@end
