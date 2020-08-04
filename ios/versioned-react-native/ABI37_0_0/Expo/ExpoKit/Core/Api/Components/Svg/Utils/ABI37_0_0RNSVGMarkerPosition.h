
#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>

typedef enum ABI37_0_0RNSVGMarkerType {
    kStartMarker,
    kMidMarker,
    kEndMarker
} ABI37_0_0RNSVGMarkerType;

#define ABI37_0_0RNSVGZEROPOINT CGRectZero.origin

@interface ABI37_0_0RNSVGMarkerPosition : NSObject

// Element storage
@property (nonatomic, assign) ABI37_0_0RNSVGMarkerType type;
@property (nonatomic, assign) CGPoint origin;
@property (nonatomic, assign) float angle;

// Instance creation
+ (instancetype) markerPosition:(ABI37_0_0RNSVGMarkerType)type origin:(CGPoint)origin angle:(float)angle;

+ (NSArray<ABI37_0_0RNSVGMarkerPosition*>*) fromCGPath:(CGPathRef)path;

@end
