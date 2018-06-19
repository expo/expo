// Copyright © 2018 650 Industries. All rights reserved.

#import <EXCore/EXUtilities.h>

@implementation EXUtilities

+ (void)performSynchronouslyOnMainThread:(void (^)(void))block
{
  if ([NSThread isMainThread]) {
    block();
  } else {
    dispatch_sync(dispatch_get_main_queue(), block);
  }
}

@end
