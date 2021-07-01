#import <Foundation/Foundation.h>

#import "ABI42_0_0RNSVGUIKit.h"

typedef enum ABI42_0_0RNSVGMarkerType {
    kStartMarker,
    kMidMarker,
    kEndMarker
} ABI42_0_0RNSVGMarkerType;

#define ABI42_0_0RNSVGZEROPOINT CGRectZero.origin

@interface ABI42_0_0RNSVGMarkerPosition : NSObject

// Element storage
@property (nonatomic, assign) ABI42_0_0RNSVGMarkerType type;
@property (nonatomic, assign) CGPoint origin;
@property (nonatomic, assign) float angle;

// Instance creation
+ (instancetype) markerPosition:(ABI42_0_0RNSVGMarkerType)type origin:(CGPoint)origin angle:(float)angle;

+ (NSArray<ABI42_0_0RNSVGMarkerPosition*>*) fromCGPath:(CGPathRef)path;

@end
