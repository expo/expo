/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0RCTReloadCommand.h"

#import "ABI23_0_0RCTAssert.h"
#import "ABI23_0_0RCTKeyCommands.h"

/** main queue only */
static NSHashTable<id<ABI23_0_0RCTReloadListener>> *listeners;

void ABI23_0_0RCTRegisterReloadCommandListener(id<ABI23_0_0RCTReloadListener> listener)
{
  ABI23_0_0RCTAssertMainQueue(); // because registerKeyCommandWithInput: must be called on the main thread
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    listeners = [NSHashTable weakObjectsHashTable];
    [[ABI23_0_0RCTKeyCommands sharedInstance] registerKeyCommandWithInput:@"r"
                                                   modifierFlags:UIKeyModifierCommand
                                                          action:
     ^(__unused UIKeyCommand *command) {
       ABI23_0_0RCTTriggerReloadCommandListeners();
     }];
  });
  [listeners addObject:listener];
}

void ABI23_0_0RCTTriggerReloadCommandListeners(void)
{
  ABI23_0_0RCTAssertMainQueue();
  // Copy to protect against mutation-during-enumeration.
  // If listeners hasn't been initialized yet we get nil, which works just fine.
  NSArray<id<ABI23_0_0RCTReloadListener>> *copiedListeners = [listeners allObjects];
  for (id<ABI23_0_0RCTReloadListener> l in copiedListeners) {
    [l didReceiveReloadCommand];
  }
}
