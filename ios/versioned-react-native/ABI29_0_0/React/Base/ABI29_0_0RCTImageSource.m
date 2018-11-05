/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTImageSource.h"
#import "ABI29_0_0RCTUtils.h"

@interface ABI29_0_0RCTImageSource ()

@property (nonatomic, assign) BOOL packagerAsset;

@end

@implementation ABI29_0_0RCTImageSource

- (instancetype)initWithURLRequest:(NSURLRequest *)request size:(CGSize)size scale:(CGFloat)scale
{
  if ((self = [super init])) {
    _request = [request copy];
    _size = size;
    _scale = scale;
  }
  return self;
}

- (instancetype)imageSourceWithSize:(CGSize)size scale:(CGFloat)scale
{
  ABI29_0_0RCTImageSource *imageSource = [[ABI29_0_0RCTImageSource alloc] initWithURLRequest:_request
                                                                      size:size
                                                                     scale:scale];
  imageSource.packagerAsset = _packagerAsset;
  return imageSource;
}

- (BOOL)isEqual:(ABI29_0_0RCTImageSource *)object
{
  if (![object isKindOfClass:[ABI29_0_0RCTImageSource class]]) {
    return NO;
  }
  return [_request isEqual:object.request] && _scale == object.scale &&
  (CGSizeEqualToSize(_size, object.size) || CGSizeEqualToSize(object.size, CGSizeZero));
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<ABI29_0_0RCTImageSource: %p URL=%@, size=%@, scale=%0.f>",
          self, _request.URL, NSStringFromCGSize(_size), _scale];
}

@end

@implementation ABI29_0_0RCTConvert (ImageSource)

+ (ABI29_0_0RCTImageSource *)ABI29_0_0RCTImageSource:(id)json
{
  if (!json) {
    return nil;
  }

  NSURLRequest *request;
  CGSize size = CGSizeZero;
  CGFloat scale = 1.0;
  BOOL packagerAsset = NO;
  if ([json isKindOfClass:[NSDictionary class]]) {
    if (!(request = [self NSURLRequest:json])) {
      return nil;
    }
    size = [self CGSize:json];
    scale = [self CGFloat:json[@"scale"]] ?: [self BOOL:json[@"deprecated"]] ? 0.0 : 1.0;
    packagerAsset = [self BOOL:json[@"__packager_asset"]];
  } else if ([json isKindOfClass:[NSString class]]) {
    request = [self NSURLRequest:json];
  } else {
    ABI29_0_0RCTLogConvertError(json, @"an image. Did you forget to call resolveAssetSource() on the JS side?");
    return nil;
  }

  ABI29_0_0RCTImageSource *imageSource = [[ABI29_0_0RCTImageSource alloc] initWithURLRequest:request
                                                                      size:size
                                                                     scale:scale];
  imageSource.packagerAsset = packagerAsset;
  return imageSource;
}

ABI29_0_0RCT_ARRAY_CONVERTER(ABI29_0_0RCTImageSource)

@end
