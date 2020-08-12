// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<EXUpdates/EXUpdatesService.h>)

#import "EXUpdatesBinding.h"

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesBinding : EXUpdatesService

- (BOOL)isStarted
{
  return NO;
}

- (BOOL)isEmergencyLaunch
{
  return NO;
}

@end

NS_ASSUME_NONNULL_END

#endif
