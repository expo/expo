//  Copyright © 2022-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdatesInterface/ABI48_0_0EXUpdatesControllerRegistry.h>

@implementation ABI48_0_0EXUpdatesControllerRegistry

+ (instancetype)sharedInstance
{
  static ABI48_0_0EXUpdatesControllerRegistry *theRegistry;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theRegistry) {
      theRegistry = [[ABI48_0_0EXUpdatesControllerRegistry alloc] init];
    }
  });
  return theRegistry;
}

@end
