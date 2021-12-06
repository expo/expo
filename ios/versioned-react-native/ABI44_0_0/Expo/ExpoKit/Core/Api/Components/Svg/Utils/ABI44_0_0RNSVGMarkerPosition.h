#import <Foundation/Foundation.h>

#import "ABI44_0_0RNSVGUIKit.h"

typedef enum ABI44_0_0RNSVGMarkerType {
    kStartMarker,
    kMidMarker,
    kEndMarker
} ABI44_0_0RNSVGMarkerType;

#define ABI44_0_0RNSVGZEROPOINT CGRectZero.origin

@interface ABI44_0_0RNSVGMarkerPosition : NSObject

// Element storage
@property (nonatomic, assign) ABI44_0_0RNSVGMarkerType type;
@property (nonatomic, assign) CGPoint origin;
@property (nonatomic, assign) float angle;

// Instance creation
+ (instancetype) markerPosition:(ABI44_0_0RNSVGMarkerType)type origin:(CGPoint)origin angle:(float)angle;

+ (NSArray<ABI44_0_0RNSVGMarkerPosition*>*) fromCGPath:(CGPathRef)path;

@end
