//  Copyright © 2022-present 650 Industries. All rights reserved.

#import <EXUpdatesInterface/EXUpdatesControllerRegistry.h>

@implementation EXUpdatesControllerRegistry

+ (instancetype)sharedInstance
{
  static EXUpdatesControllerRegistry *theRegistry;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theRegistry) {
      theRegistry = [[EXUpdatesControllerRegistry alloc] init];
    }
  });
  return theRegistry;
}

@end
