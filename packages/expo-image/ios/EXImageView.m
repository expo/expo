// Copyright 2020-present 650 Industries. All rights reserved.

#import <expo-image/EXImageView.h>
#import <React/RCTConvert.h>

static NSString * const sourceUriKey = @"uri";

@implementation EXImageView

- (void)dealloc
{
  // Stop any active operations or downloads
  [self sd_setImageWithURL:nil];
}

# pragma mark -  Custom prop setters

- (void)setSource:(NSDictionary *)source
{
  NSURL *imageURL = [RCTConvert NSURL:source[sourceUriKey]];

  [self sd_setImageWithURL:imageURL];
}


- (EXImageCacheTypeEnum)convertToCacheTypeEnum:(SDImageCacheType)imageCacheType
{
  switch (imageCacheType) {
    case SDImageCacheTypeNone:
      return EXImageCacheNone;
    case SDImageCacheTypeDisk:
      return EXImageCacheDisk;
    case SDImageCacheTypeMemory:
      return EXImageCacheMemory;
    // The only other known SDImageCacheType value
    // is SDImageCacheTypeAll, which:
    // 1. doesn't make sense in the context of completion block,
    // 2. shouldn't ever end up as an argument to completion block.
    // All in all, we map other SDImageCacheType values to EXImageCacheUnknown.
    default:
      return EXImageCacheUnknown;
  }
}

@end
