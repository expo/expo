//  Copyright © 2022-present 650 Industries. All rights reserved.

#import <ABI46_0_0EXUpdatesInterface/ABI46_0_0EXUpdatesControllerRegistry.h>

@implementation ABI46_0_0EXUpdatesControllerRegistry

+ (instancetype)sharedInstance
{
  static ABI46_0_0EXUpdatesControllerRegistry *theRegistry;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theRegistry) {
      theRegistry = [[ABI46_0_0EXUpdatesControllerRegistry alloc] init];
    }
  });
  return theRegistry;
}

@end
