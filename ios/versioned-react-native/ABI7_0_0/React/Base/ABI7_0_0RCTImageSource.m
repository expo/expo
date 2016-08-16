/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTImageSource.h"
#import "ABI7_0_0RCTUtils.h"

@interface ABI7_0_0RCTImageSource ()

@property (nonatomic, assign) BOOL packagerAsset;

@end

@implementation ABI7_0_0RCTImageSource

- (instancetype)initWithURL:(NSURL *)url size:(CGSize)size scale:(CGFloat)scale
{
  if ((self = [super init])) {
    _imageURL  = url;
    _size = size;
    _scale = scale;
  }
  return self;
}

- (instancetype)imageSourceWithSize:(CGSize)size scale:(CGFloat)scale
{
  ABI7_0_0RCTImageSource *imageSource = [[ABI7_0_0RCTImageSource alloc] initWithURL:_imageURL
                                                               size:size
                                                              scale:scale];
  imageSource.packagerAsset = _packagerAsset;
  return imageSource;
}

- (BOOL)isEqual:(ABI7_0_0RCTImageSource *)object
{
  if (![object isKindOfClass:[ABI7_0_0RCTImageSource class]]) {
    return NO;
  }
  return [_imageURL isEqual:object.imageURL] && _scale == object.scale &&
  (CGSizeEqualToSize(_size, object.size) || CGSizeEqualToSize(object.size, CGSizeZero));
}

@end

@implementation ABI7_0_0RCTConvert (ImageSource)

+ (ABI7_0_0RCTImageSource *)ABI7_0_0RCTImageSource:(id)json
{
  if (!json) {
    return nil;
  }

  NSURL *imageURL;
  CGSize size = CGSizeZero;
  CGFloat scale = 1.0;
  BOOL packagerAsset = NO;
  if ([json isKindOfClass:[NSDictionary class]]) {
    if (!(imageURL = [self NSURL:ABI7_0_0RCTNilIfNull(json[@"uri"])])) {
      return nil;
    }
    size = [self CGSize:json];
    scale = [self CGFloat:json[@"scale"]] ?: [self BOOL:json[@"deprecated"]] ? 0.0 : 1.0;
    packagerAsset = [self BOOL:json[@"__packager_asset"]];
  } else if ([json isKindOfClass:[NSString class]]) {
    imageURL = [self NSURL:json];
  } else {
    ABI7_0_0RCTLogConvertError(json, @"an image. Did you forget to call resolveAssetSource() on the JS side?");
    return nil;
  }

  ABI7_0_0RCTImageSource *imageSource = [[ABI7_0_0RCTImageSource alloc] initWithURL:imageURL
                                                               size:size
                                                              scale:scale];
  imageSource.packagerAsset = packagerAsset;
  return imageSource;
}

@end
