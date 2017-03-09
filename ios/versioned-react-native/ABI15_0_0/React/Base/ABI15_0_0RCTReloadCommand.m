/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI15_0_0RCTReloadCommand.h"

#import "ABI15_0_0RCTKeyCommands.h"

void ABI15_0_0RCTRegisterReloadCommandListener(id<ABI15_0_0RCTReloadListener> listener)
{
  static NSHashTable<id<ABI15_0_0RCTReloadListener>> *listeners;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    listeners = [NSHashTable weakObjectsHashTable];
    [[ABI15_0_0RCTKeyCommands sharedInstance] registerKeyCommandWithInput:@"r"
                                                   modifierFlags:UIKeyModifierCommand
                                                          action:
     ^(__unused UIKeyCommand *command) {
       NSArray<id<ABI15_0_0RCTReloadListener>> *copiedListeners;
       @synchronized (listeners) { // avoid mutation-while-enumerating
         copiedListeners = [listeners allObjects];
       }
       for (id<ABI15_0_0RCTReloadListener> l in copiedListeners) {
         [l didReceiveReloadCommand];
       }
     }];
  });

  @synchronized (listeners) {
    [listeners addObject:listener];
  }
}
