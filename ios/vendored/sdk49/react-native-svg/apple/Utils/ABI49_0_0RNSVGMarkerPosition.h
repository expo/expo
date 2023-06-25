#import <Foundation/Foundation.h>

#import "ABI49_0_0RNSVGUIKit.h"

typedef enum ABI49_0_0RNSVGMarkerType { kStartMarker, kMidMarker, kEndMarker } ABI49_0_0RNSVGMarkerType;

#define ABI49_0_0RNSVGZEROPOINT CGRectZero.origin

@interface ABI49_0_0RNSVGMarkerPosition : NSObject

// Element storage
@property (nonatomic, assign) ABI49_0_0RNSVGMarkerType type;
@property (nonatomic, assign) CGPoint origin;
@property (nonatomic, assign) float angle;

// Instance creation
+ (instancetype)markerPosition:(ABI49_0_0RNSVGMarkerType)type origin:(CGPoint)origin angle:(float)angle;

+ (NSArray<ABI49_0_0RNSVGMarkerPosition *> *)fromCGPath:(CGPathRef)path;

@end
