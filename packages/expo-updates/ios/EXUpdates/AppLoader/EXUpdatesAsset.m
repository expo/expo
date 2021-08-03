//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAsset.h>
#import <EXUpdates/EXUpdatesUtils.h>

#include <stdlib.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesAsset

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
    if (!_key) {
      // create a filename that's unlikely to collide with any other asset
      _filename = [NSString stringWithFormat:@"asset-%d-%u", (int)[NSDate date].timeIntervalSince1970, arc4random()];
    } 
    if (!_type){
      _filename = _key
    }
    if ([_type hasPrefix:@"."]){
      _filename = [NSString stringWithFormat:@"%@%@", _key, _type]
    }
    _filename = [NSString stringWithFormat:@"%@.%@", _key, _type];
  }
  return _filename;
}

@end

NS_ASSUME_NONNULL_END
