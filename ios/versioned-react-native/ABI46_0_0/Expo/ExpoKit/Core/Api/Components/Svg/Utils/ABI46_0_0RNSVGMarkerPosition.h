#import <Foundation/Foundation.h>

#import "ABI46_0_0RNSVGUIKit.h"

typedef enum ABI46_0_0RNSVGMarkerType {
    kStartMarker,
    kMidMarker,
    kEndMarker
} ABI46_0_0RNSVGMarkerType;

#define ABI46_0_0RNSVGZEROPOINT CGRectZero.origin

@interface ABI46_0_0RNSVGMarkerPosition : NSObject

// Element storage
@property (nonatomic, assign) ABI46_0_0RNSVGMarkerType type;
@property (nonatomic, assign) CGPoint origin;
@property (nonatomic, assign) float angle;

// Instance creation
+ (instancetype) markerPosition:(ABI46_0_0RNSVGMarkerType)type origin:(CGPoint)origin angle:(float)angle;

+ (NSArray<ABI46_0_0RNSVGMarkerPosition*>*) fromCGPath:(CGPathRef)path;

@end
