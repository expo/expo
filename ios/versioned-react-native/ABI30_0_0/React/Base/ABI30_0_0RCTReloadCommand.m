/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTReloadCommand.h"

#import "ABI30_0_0RCTAssert.h"
#import "ABI30_0_0RCTKeyCommands.h"

/** main queue only */
static NSHashTable<id<ABI30_0_0RCTReloadListener>> *listeners;

void ABI30_0_0RCTRegisterReloadCommandListener(id<ABI30_0_0RCTReloadListener> listener)
{
  ABI30_0_0RCTAssertMainQueue(); // because registerKeyCommandWithInput: must be called on the main thread
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    listeners = [NSHashTable weakObjectsHashTable];
    [[ABI30_0_0RCTKeyCommands sharedInstance] registerKeyCommandWithInput:@"r"
                                                   modifierFlags:UIKeyModifierCommand
                                                          action:
     ^(__unused UIKeyCommand *command) {
       ABI30_0_0RCTTriggerReloadCommandListeners();
     }];
  });
  [listeners addObject:listener];
}

void ABI30_0_0RCTTriggerReloadCommandListeners(void)
{
  ABI30_0_0RCTAssertMainQueue();
  // Copy to protect against mutation-during-enumeration.
  // If listeners hasn't been initialized yet we get nil, which works just fine.
  NSArray<id<ABI30_0_0RCTReloadListener>> *copiedListeners = [listeners allObjects];
  for (id<ABI30_0_0RCTReloadListener> l in copiedListeners) {
    [l didReceiveReloadCommand];
  }
}
