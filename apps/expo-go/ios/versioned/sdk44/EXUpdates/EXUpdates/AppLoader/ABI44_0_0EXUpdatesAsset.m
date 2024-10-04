//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAsset.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesUtils.h>

#include <stdlib.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI44_0_0EXUpdatesAsset

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
    NSString *fileExtension = @"";
    if (_type){
      fileExtension = [_type hasPrefix:@"."] ? _type : [NSString stringWithFormat:@".%@", _type];
    }
    
    if (!_key) {
      // create a filename that's unlikely to collide with any other asset
      _filename = [NSString stringWithFormat:@"asset-%d-%u%@", (int)[NSDate date].timeIntervalSince1970, arc4random(), fileExtension];
    } else {
      _filename = [NSString stringWithFormat:@"%@%@", _key, fileExtension];
    }
  }
  return _filename;
}

@end

NS_ASSUME_NONNULL_END
