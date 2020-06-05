// Copyright 2020-present 650 Industries. All rights reserved.

#import <React/RCTBorderStyle.h>
#import <React/RCTBorderDrawing.h>

typedef NS_ENUM(NSInteger, EXImageBorder) {
  EXImageBorderAll,
  EXImageBorderTop,
  EXImageBorderRight,
  EXImageBorderBottom,
  EXImageBorderLeft,
  EXImageBorderStart,
  EXImageBorderEnd,
};

typedef struct {
  CGFloat width;
  CGColorRef color;
  RCTBorderStyle style;
} EXImageBorderDef;

typedef struct {
  EXImageBorderDef top;
  EXImageBorderDef left;
  EXImageBorderDef bottom;
  EXImageBorderDef right;
} EXImageBordersDef;

@interface EXImageBorders : NSObject

@property (nonatomic, assign) UIUserInterfaceLayoutDirection layoutDirection;

- (instancetype)init;

- (CGFloat)widthForBorder:(EXImageBorder)border;
- (RCTBorderStyle)styleForBorder:(EXImageBorder)border;
- (CGColorRef)colorForBorder:(EXImageBorder)border;

- (BOOL)setWidth:(CGFloat)width border:(EXImageBorder)border;
- (BOOL)setStyle:(RCTBorderStyle)style border:(EXImageBorder)border;
- (BOOL)setColor:(CGColorRef)color border:(EXImageBorder)border;

- (void)updateLayersForView:(UIView *)view
                cornerRadii:(RCTCornerRadii)cornerRadii
                     bounds:(CGRect)bounds
               cachedLayers:(NSMutableDictionary<NSString *, CALayer *> *)cachedLayers;

@end

