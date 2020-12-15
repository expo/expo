//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesAsset.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI40_0_0EXUpdatesAsset

- (instancetype)initWithKey:(NSString *)key type:(NSString *)type
{
  if (self = [super init]) {
    _key = key;
    _type = type;
  }
  return self;
}

- (nullable NSString *)filename
{
  return _key;
}

@end

NS_ASSUME_NONNULL_END
