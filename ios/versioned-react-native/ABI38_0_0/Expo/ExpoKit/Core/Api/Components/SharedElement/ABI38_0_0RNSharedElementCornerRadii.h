//
//  ABI38_0_0RNSharedElementCornerRadii_h
//  ABI38_0_0React-native-shared-element
//

#import <ABI38_0_0React/ABI38_0_0RCTBorderDrawing.h>
#import <ABI38_0_0React/ABI38_0_0RCTView.h>

typedef NS_ENUM(NSInteger, ABI38_0_0RNSharedElementCorner) {
  ABI38_0_0RNSharedElementCornerAll = 0,
  ABI38_0_0RNSharedElementCornerTopLeft = 1,
  ABI38_0_0RNSharedElementCornerTopRight = 2,
  ABI38_0_0RNSharedElementCornerBottomLeft = 3,
  ABI38_0_0RNSharedElementCornerBottomRight = 4,
  ABI38_0_0RNSharedElementCornerTopStart = 5,
  ABI38_0_0RNSharedElementCornerTopEnd = 6,
  ABI38_0_0RNSharedElementCornerBottomStart = 7,
  ABI38_0_0RNSharedElementCornerBottomEnd = 8
};

@interface ABI38_0_0RNSharedElementCornerRadii : NSObject

@property (nonatomic, assign) UIUserInterfaceLayoutDirection layoutDirection;

- (instancetype)init;

- (CGFloat)radiusForCorner:(ABI38_0_0RNSharedElementCorner)corner;
- (BOOL)setRadius:(CGFloat)radius corner:(ABI38_0_0RNSharedElementCorner)corner;

- (void)updateClipMaskForLayer:(CALayer *)layer bounds:(CGRect)bounds;
- (void)updateShadowPathForLayer:(CALayer *)layer bounds:(CGRect)bounds;
- (ABI38_0_0RCTCornerRadii)radiiForBounds:(CGRect)bounds;

@end
