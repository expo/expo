// Copyright 2020-present 650 Industries. All rights reserved.

#import <React/RCTBorderDrawing.h>
#import <React/RCTView.h>

typedef NS_ENUM(NSInteger, EXImageCorner) {
  EXImageCornerAll = 0,
  EXImageCornerTopLeft = 1,
  EXImageCornerTopRight = 2,
  EXImageCornerBottomLeft = 3,
  EXImageCornerBottomRight = 4,
  EXImageCornerTopStart = 5,
  EXImageCornerTopEnd = 6,
  EXImageCornerBottomStart = 7,
  EXImageCornerBottomEnd = 8
};

@interface EXImageCornerRadii : NSObject

@property (nonatomic, assign) UIUserInterfaceLayoutDirection layoutDirection;

- (instancetype)init;

- (CGFloat)radiusForCorner:(EXImageCorner)corner;
- (BOOL)setRadius:(CGFloat)radius corner:(EXImageCorner)corner;

- (void)updateClipMaskForLayer:(CALayer *)layer bounds:(CGRect)bounds;
- (void)updateShadowPathForLayer:(CALayer *)layer bounds:(CGRect)bounds;
- (RCTCornerRadii)radiiForBounds:(CGRect)bounds;

@end

