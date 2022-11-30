/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTReloadCommand.h"

#import "ABI47_0_0RCTAssert.h"
#import "ABI47_0_0RCTKeyCommands.h"
#import "ABI47_0_0RCTUtils.h"

static NSHashTable<id<ABI47_0_0RCTReloadListener>> *listeners;
static NSLock *listenersLock;
static NSURL *bundleURL;

NSString *const ABI47_0_0RCTTriggerReloadCommandNotification = @"ABI47_0_0RCTTriggerReloadCommandNotification";
NSString *const ABI47_0_0RCTTriggerReloadCommandReasonKey = @"reason";
NSString *const ABI47_0_0RCTTriggerReloadCommandBundleURLKey = @"bundleURL";

void ABI47_0_0RCTRegisterReloadCommandListener(id<ABI47_0_0RCTReloadListener> listener)
{
  if (!listenersLock) {
    listenersLock = [NSLock new];
  }
  [listenersLock lock];
  if (!listeners) {
    listeners = [NSHashTable weakObjectsHashTable];
  }
#if ABI47_0_0RCT_DEV
  ABI47_0_0RCTAssertMainQueue(); // because registerKeyCommandWithInput: must be called on the main thread
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [[ABI47_0_0RCTKeyCommands sharedInstance] registerKeyCommandWithInput:@"r"
                                                   modifierFlags:UIKeyModifierCommand
                                                          action:^(__unused UIKeyCommand *command) {
                                                            ABI47_0_0RCTTriggerReloadCommandListeners(@"Command + R");
                                                          }];
  });
#endif
  [listeners addObject:listener];
  [listenersLock unlock];
}

void ABI47_0_0RCTTriggerReloadCommandListeners(NSString *reason)
{
  [listenersLock lock];
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI47_0_0RCTTriggerReloadCommandNotification
                                                      object:nil
                                                    userInfo:@{
                                                      ABI47_0_0RCTTriggerReloadCommandReasonKey : ABI47_0_0RCTNullIfNil(reason),
                                                      ABI47_0_0RCTTriggerReloadCommandBundleURLKey : ABI47_0_0RCTNullIfNil(bundleURL)
                                                    }];

  for (id<ABI47_0_0RCTReloadListener> l in [listeners allObjects]) {
    [l didReceiveReloadCommand];
  }
  [listenersLock unlock];
}

void ABI47_0_0RCTReloadCommandSetBundleURL(NSURL *URL)
{
  bundleURL = URL;
}
