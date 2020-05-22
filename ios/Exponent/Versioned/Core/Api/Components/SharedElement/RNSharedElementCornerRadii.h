//
//  RNSharedElementCornerRadii_h
//  react-native-shared-element
//

#import <React/RCTBorderDrawing.h>
#import <React/RCTView.h>

typedef NS_ENUM(NSInteger, RNSharedElementCorner) {
  RNSharedElementCornerAll = 0,
  RNSharedElementCornerTopLeft = 1,
  RNSharedElementCornerTopRight = 2,
  RNSharedElementCornerBottomLeft = 3,
  RNSharedElementCornerBottomRight = 4,
  RNSharedElementCornerTopStart = 5,
  RNSharedElementCornerTopEnd = 6,
  RNSharedElementCornerBottomStart = 7,
  RNSharedElementCornerBottomEnd = 8
};

@interface RNSharedElementCornerRadii : NSObject

@property (nonatomic, assign) UIUserInterfaceLayoutDirection layoutDirection;

- (instancetype)init;

- (CGFloat)radiusForCorner:(RNSharedElementCorner)corner;
- (BOOL)setRadius:(CGFloat)radius corner:(RNSharedElementCorner)corner;

- (void)updateClipMaskForLayer:(CALayer *)layer bounds:(CGRect)bounds;
- (void)updateShadowPathForLayer:(CALayer *)layer bounds:(CGRect)bounds;
- (RCTCornerRadii)radiiForBounds:(CGRect)bounds;

@end
