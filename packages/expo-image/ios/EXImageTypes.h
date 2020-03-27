// Copyright 2020-present 650 Industries. All rights reserved.

#import <SDWebImage/SDWebImage.h>
#import <React/RCTResizeMode.h>

typedef NS_ENUM(NSInteger, EXImageCacheTypeEnum) {
  EXImageCacheUnknown = 0,
  EXImageCacheNone,
  EXImageCacheDisk,
  EXImageCacheMemory
};

@interface EXImageTypes : NSObject

+ (EXImageCacheTypeEnum)convertToCacheTypeEnum:(SDImageCacheType)imageCacheType;
+ (nullable NSString *)sdImageFormatToMediaType:(SDImageFormat)imageFormat;
+ (UIViewContentMode)resizeModeToContentMode:(RCTResizeMode)resizeMode;

@end

