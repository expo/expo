// Copyright 2020-present 650 Industries. All rights reserved.

#import <SDWebImage/SDWebImage.h>
#import <React/RCTComponent.h>
#import <React/UIView+React.h>
#import <React/RCTResizeMode.h>

@class RCTBridge;

typedef NS_ENUM(NSInteger, EXImageCacheTypeEnum) {
  EXImageCacheUnknown = 0,
  EXImageCacheNone,
  EXImageCacheDisk,
  EXImageCacheMemory
};

@interface EXImageView : SDAnimatedImageView

@property (nonatomic, copy) RCTDirectEventBlock onLoadStart;
@property (nonatomic, copy) RCTDirectEventBlock onProgress;
@property (nonatomic, copy) RCTDirectEventBlock onError;
@property (nonatomic, copy) RCTDirectEventBlock onLoad;

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (void)setSource:(NSDictionary *)sourceMap;
- (void)setResizeMode:(RCTResizeMode)resizeMode;

- (void)didSetProps:(NSArray<NSString *> *)changedProps;

@end
