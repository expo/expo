
#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>

typedef enum ABI36_0_0RNSVGMarkerType {
    kStartMarker,
    kMidMarker,
    kEndMarker
} ABI36_0_0RNSVGMarkerType;

#define ABI36_0_0RNSVGZEROPOINT CGRectZero.origin

@interface ABI36_0_0RNSVGMarkerPosition : NSObject

// Element storage
@property (nonatomic, assign) ABI36_0_0RNSVGMarkerType type;
@property (nonatomic, assign) CGPoint origin;
@property (nonatomic, assign) float angle;

// Instance creation
+ (instancetype) markerPosition:(ABI36_0_0RNSVGMarkerType)type origin:(CGPoint)origin angle:(float)angle;

+ (NSArray<ABI36_0_0RNSVGMarkerPosition*>*) fromCGPath:(CGPathRef)path;

@end
