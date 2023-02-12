//
//  ABI47_0_0RNSharedElementCornerRadii_h
//  ABI47_0_0React-native-shared-element
//

#import <ABI47_0_0React/ABI47_0_0RCTBorderDrawing.h>
#import <ABI47_0_0React/ABI47_0_0RCTView.h>

typedef NS_ENUM(NSInteger, ABI47_0_0RNSharedElementCorner) {
  ABI47_0_0RNSharedElementCornerAll = 0,
  ABI47_0_0RNSharedElementCornerTopLeft = 1,
  ABI47_0_0RNSharedElementCornerTopRight = 2,
  ABI47_0_0RNSharedElementCornerBottomLeft = 3,
  ABI47_0_0RNSharedElementCornerBottomRight = 4,
  ABI47_0_0RNSharedElementCornerTopStart = 5,
  ABI47_0_0RNSharedElementCornerTopEnd = 6,
  ABI47_0_0RNSharedElementCornerBottomStart = 7,
  ABI47_0_0RNSharedElementCornerBottomEnd = 8
};

@interface ABI47_0_0RNSharedElementCornerRadii : NSObject

@property (nonatomic, assign) UIUserInterfaceLayoutDirection layoutDirection;

- (instancetype)init;

- (CGFloat)radiusForCorner:(ABI47_0_0RNSharedElementCorner)corner;
- (BOOL)setRadius:(CGFloat)radius corner:(ABI47_0_0RNSharedElementCorner)corner;

- (void)updateClipMaskForLayer:(CALayer *)layer bounds:(CGRect)bounds;
- (void)updateShadowPathForLayer:(CALayer *)layer bounds:(CGRect)bounds;
- (ABI47_0_0RCTCornerRadii)radiiForBounds:(CGRect)bounds;

@end
