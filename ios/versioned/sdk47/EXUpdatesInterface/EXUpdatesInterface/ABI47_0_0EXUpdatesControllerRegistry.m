//  Copyright © 2022-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdatesInterface/ABI47_0_0EXUpdatesControllerRegistry.h>

@implementation ABI47_0_0EXUpdatesControllerRegistry

+ (instancetype)sharedInstance
{
  static ABI47_0_0EXUpdatesControllerRegistry *theRegistry;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theRegistry) {
      theRegistry = [[ABI47_0_0EXUpdatesControllerRegistry alloc] init];
    }
  });
  return theRegistry;
}

@end
