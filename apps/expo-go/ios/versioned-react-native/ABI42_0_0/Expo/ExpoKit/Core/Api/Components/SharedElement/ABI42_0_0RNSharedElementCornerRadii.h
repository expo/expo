//
//  ABI42_0_0RNSharedElementCornerRadii_h
//  ABI42_0_0React-native-shared-element
//

#import <ABI42_0_0React/ABI42_0_0RCTBorderDrawing.h>
#import <ABI42_0_0React/ABI42_0_0RCTView.h>

typedef NS_ENUM(NSInteger, ABI42_0_0RNSharedElementCorner) {
  ABI42_0_0RNSharedElementCornerAll = 0,
  ABI42_0_0RNSharedElementCornerTopLeft = 1,
  ABI42_0_0RNSharedElementCornerTopRight = 2,
  ABI42_0_0RNSharedElementCornerBottomLeft = 3,
  ABI42_0_0RNSharedElementCornerBottomRight = 4,
  ABI42_0_0RNSharedElementCornerTopStart = 5,
  ABI42_0_0RNSharedElementCornerTopEnd = 6,
  ABI42_0_0RNSharedElementCornerBottomStart = 7,
  ABI42_0_0RNSharedElementCornerBottomEnd = 8
};

@interface ABI42_0_0RNSharedElementCornerRadii : NSObject

@property (nonatomic, assign) UIUserInterfaceLayoutDirection layoutDirection;

- (instancetype)init;

- (CGFloat)radiusForCorner:(ABI42_0_0RNSharedElementCorner)corner;
- (BOOL)setRadius:(CGFloat)radius corner:(ABI42_0_0RNSharedElementCorner)corner;

- (void)updateClipMaskForLayer:(CALayer *)layer bounds:(CGRect)bounds;
- (void)updateShadowPathForLayer:(CALayer *)layer bounds:(CGRect)bounds;
- (ABI42_0_0RCTCornerRadii)radiiForBounds:(CGRect)bounds;

@end
