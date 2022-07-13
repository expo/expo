//  Copyright © 2022-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXUpdatesInterface/ABI45_0_0EXUpdatesControllerRegistry.h>

@implementation ABI45_0_0EXUpdatesControllerRegistry

+ (instancetype)sharedInstance
{
  static ABI45_0_0EXUpdatesControllerRegistry *theRegistry;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theRegistry) {
      theRegistry = [[ABI45_0_0EXUpdatesControllerRegistry alloc] init];
    }
  });
  return theRegistry;
}

@end
