// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXUpdates/DeferredRCTRootView.h>

@implementation DeferredRCTRootView

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-designated-initializers"

- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  // RCTRootView throws an exception for default initializers
  // and other designated initializers requires a real bridge.
  // We use a trick here to initialize a UIView and cast back to DeferredRCTRootView.
  self = (DeferredRCTRootView *)[[UIView alloc] initWithFrame:CGRectZero];
  return self;
}

#pragma clang diagnostic pop

@end

