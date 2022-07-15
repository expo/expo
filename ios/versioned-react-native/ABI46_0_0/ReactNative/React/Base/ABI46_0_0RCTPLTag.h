/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

typedef NS_ENUM(NSInteger, ABI46_0_0RCTPLTag) {
  ABI46_0_0RCTPLScriptDownload = 0,
  ABI46_0_0RCTPLScriptExecution,
  ABI46_0_0RCTPLRAMBundleLoad,
  ABI46_0_0RCTPLRAMStartupCodeSize,
  ABI46_0_0RCTPLRAMStartupNativeRequires,
  ABI46_0_0RCTPLRAMStartupNativeRequiresCount,
  ABI46_0_0RCTPLRAMNativeRequires,
  ABI46_0_0RCTPLRAMNativeRequiresCount,
  ABI46_0_0RCTPLNativeModuleInit,
  ABI46_0_0RCTPLNativeModuleMainThread,
  ABI46_0_0RCTPLNativeModulePrepareConfig,
  ABI46_0_0RCTPLNativeModuleMainThreadUsesCount,
  ABI46_0_0RCTPLNativeModuleSetup,
  ABI46_0_0RCTPLTurboModuleSetup,
  ABI46_0_0RCTPLJSCWrapperOpenLibrary,
  ABI46_0_0RCTPLBridgeStartup,
  ABI46_0_0RCTPLTTI,
  ABI46_0_0RCTPLBundleSize,
  ABI46_0_0RCTPLABI46_0_0ReactInstanceInit,
  ABI46_0_0RCTPLSize // This is used to count the size
};
