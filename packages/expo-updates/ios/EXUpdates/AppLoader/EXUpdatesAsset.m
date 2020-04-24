//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAsset.h>
#import <EXUpdates/EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesAsset

- (instancetype)initWithPackagerKey:(NSString *)packagerKey type:(NSString *)type
{
  if (self = [super init]) {
    _packagerKey = packagerKey;
    _type = type;
  }
  return self;
}

- (nullable NSString *)localAssetsKey
{
  return _packagerKey;
}

- (nullable NSString *)filename
{
  if (!_filename) {
    // for legacy purposes, we try to use the asset URL as the basis for the filename on disk
    // and fall back to the packagerKey if it doesn't exist
    if (_url) {
      _filename = [NSString stringWithFormat:@"%@.%@",
                   [EXUpdatesUtils sha256WithData:[_url.absoluteString dataUsingEncoding:NSUTF8StringEncoding]],
                   _type];
    } else {
      _filename = _packagerKey;
    }
  }
  return _filename;
}

@end

NS_ASSUME_NONNULL_END
