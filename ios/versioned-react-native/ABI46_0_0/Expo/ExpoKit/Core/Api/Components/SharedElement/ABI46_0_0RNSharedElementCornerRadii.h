//
//  ABI46_0_0RNSharedElementCornerRadii_h
//  ABI46_0_0React-native-shared-element
//

#import <ABI46_0_0React/ABI46_0_0RCTBorderDrawing.h>
#import <ABI46_0_0React/ABI46_0_0RCTView.h>

typedef NS_ENUM(NSInteger, ABI46_0_0RNSharedElementCorner) {
  ABI46_0_0RNSharedElementCornerAll = 0,
  ABI46_0_0RNSharedElementCornerTopLeft = 1,
  ABI46_0_0RNSharedElementCornerTopRight = 2,
  ABI46_0_0RNSharedElementCornerBottomLeft = 3,
  ABI46_0_0RNSharedElementCornerBottomRight = 4,
  ABI46_0_0RNSharedElementCornerTopStart = 5,
  ABI46_0_0RNSharedElementCornerTopEnd = 6,
  ABI46_0_0RNSharedElementCornerBottomStart = 7,
  ABI46_0_0RNSharedElementCornerBottomEnd = 8
};

@interface ABI46_0_0RNSharedElementCornerRadii : NSObject

@property (nonatomic, assign) UIUserInterfaceLayoutDirection layoutDirection;

- (instancetype)init;

- (CGFloat)radiusForCorner:(ABI46_0_0RNSharedElementCorner)corner;
- (BOOL)setRadius:(CGFloat)radius corner:(ABI46_0_0RNSharedElementCorner)corner;

- (void)updateClipMaskForLayer:(CALayer *)layer bounds:(CGRect)bounds;
- (void)updateShadowPathForLayer:(CALayer *)layer bounds:(CGRect)bounds;
- (ABI46_0_0RCTCornerRadii)radiiForBounds:(CGRect)bounds;

@end
