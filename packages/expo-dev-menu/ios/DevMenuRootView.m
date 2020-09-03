/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <EXDevMenu/DevMenuRootView.h>

#import <React/RCTAssert.h>
#import <React/RCTRootContentView.h>

@implementation DevMenuRootView

- (void)javaScriptDidLoad:(NSNotification *)notification
{
  RCTAssertMainQueue();

  // Use the (batched) bridge that's sent in the notification payload, so the
  // RCTRootContentView is scoped to the right bridge
  RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != ((RCTRootContentView *)self.contentView).bridge) {
    [super bundleFinishedLoading:bridge];
  }
}

- (void)bundleFinishedLoading:(RCTBridge *)bridge
{
  
}

@end
