/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import <UIKit/UIKit.h>

#import "SKInvalidation.h"
#import "UICollectionView+SKInvalidation.h"
#import "UIView+SKInvalidation.h"

@implementation SKInvalidation

+ (instancetype)sharedInstance {
  static SKInvalidation* sInstance = nil;

  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sInstance = [SKInvalidation new];
  });

  return sInstance;
}

+ (void)enableInvalidations {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [UIView enableInvalidation];
    [UICollectionView enableInvalidations];

    [[NSNotificationCenter defaultCenter]
        addObserver:self
           selector:@selector(windowDidBecomeVisible:)
               name:UIWindowDidBecomeVisibleNotification
             object:nil];

    [[NSNotificationCenter defaultCenter]
        addObserver:self
           selector:@selector(windowDidBecomeHidden:)
               name:UIWindowDidBecomeHiddenNotification
             object:nil];
  });
}

+ (void)windowDidBecomeVisible:(NSNotification*)notification {
  [[SKInvalidation sharedInstance].delegate
      invalidateNode:[notification.object nextResponder]];
}

+ (void)windowDidBecomeHidden:(NSNotification*)notification {
  [[SKInvalidation sharedInstance].delegate
      invalidateNode:[notification.object nextResponder]];
}

@end

#endif
