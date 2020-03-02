//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAsset.h>
#import <EXUpdates/EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesAsset

- (instancetype)initWithUrl:(NSURL *)url type:(NSString *)type
{
  if (self = [super init]) {
    _url = url;
    _type = type;
  }
  return self;
}

- (nullable NSString *)localAssetsKey
{
  if (!_localAssetsKey) {
    NSString *remoteFilename = _url.lastPathComponent;
    if (remoteFilename) {
      _localAssetsKey = [NSString stringWithFormat:@"%@.%@", remoteFilename, _type];
    }
  }
  return _localAssetsKey;
}

@end

NS_ASSUME_NONNULL_END
