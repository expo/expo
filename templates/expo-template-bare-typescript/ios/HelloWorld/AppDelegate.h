/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <UMReactNativeAdapter/UMModuleRegistryAdapter.h>
#import <React/RCTBridgeDelegate.h>
#import <UMCore/UMAppDelegateWrapper.h>

#import <EXUpdates/EXUpdatesAppController.h>

@interface AppDelegate : UMAppDelegateWrapper <RCTBridgeDelegate, EXUpdatesAppControllerDelegate>

@property (nonatomic, strong) UMModuleRegistryAdapter *moduleRegistryAdapter;
@property (nonatomic, strong) UIWindow *window;

@end
