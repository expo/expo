//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncAsset.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncUtils.h>

#include <stdlib.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI41_0_0EXSyncAsset

- (instancetype)initWithKey:(nullable NSString *)key type:(NSString *)type
{
  if (self = [super init]) {
    _key = key;
    _type = type;
  }
  return self;
}

- (nullable NSString *)filename
{
  if (!_filename) {
    if (_key) {
      _filename = _key;
    } else {
      // create a filename that's unlikely to collide with any other asset
      _filename = [NSString stringWithFormat:@"asset-%d-%u", (int)[NSDate date].timeIntervalSince1970, arc4random()];
    }
  }
  return _filename;
}

@end

NS_ASSUME_NONNULL_END
