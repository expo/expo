#import <Foundation/Foundation.h>

#import "ABI47_0_0RNSVGUIKit.h"

typedef enum ABI47_0_0RNSVGMarkerType { kStartMarker, kMidMarker, kEndMarker } ABI47_0_0RNSVGMarkerType;

#define ABI47_0_0RNSVGZEROPOINT CGRectZero.origin

@interface ABI47_0_0RNSVGMarkerPosition : NSObject

// Element storage
@property (nonatomic, assign) ABI47_0_0RNSVGMarkerType type;
@property (nonatomic, assign) CGPoint origin;
@property (nonatomic, assign) float angle;

// Instance creation
+ (instancetype)markerPosition:(ABI47_0_0RNSVGMarkerType)type origin:(CGPoint)origin angle:(float)angle;

+ (NSArray<ABI47_0_0RNSVGMarkerPosition *> *)fromCGPath:(CGPathRef)path;

@end
