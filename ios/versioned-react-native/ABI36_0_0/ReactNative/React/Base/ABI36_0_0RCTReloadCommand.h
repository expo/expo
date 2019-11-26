/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI36_0_0React/ABI36_0_0RCTDefines.h>

@protocol ABI36_0_0RCTReloadListener
- (void)didReceiveReloadCommand;
@end

/** Registers a weakly-held observer of the Command+R reload key command. */
ABI36_0_0RCT_EXTERN void ABI36_0_0RCTRegisterReloadCommandListener(id<ABI36_0_0RCTReloadListener> listener);

/** Triggers a reload for all current listeners. You shouldn't need to use this directly in most cases. */
ABI36_0_0RCT_EXTERN void ABI36_0_0RCTTriggerReloadCommandListeners(void);
