/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

typedef NS_ENUM(NSInteger, ABI45_0_0RCTPLTag) {
  ABI45_0_0RCTPLScriptDownload = 0,
  ABI45_0_0RCTPLScriptExecution,
  ABI45_0_0RCTPLRAMBundleLoad,
  ABI45_0_0RCTPLRAMStartupCodeSize,
  ABI45_0_0RCTPLRAMStartupNativeRequires,
  ABI45_0_0RCTPLRAMStartupNativeRequiresCount,
  ABI45_0_0RCTPLRAMNativeRequires,
  ABI45_0_0RCTPLRAMNativeRequiresCount,
  ABI45_0_0RCTPLNativeModuleInit,
  ABI45_0_0RCTPLNativeModuleMainThread,
  ABI45_0_0RCTPLNativeModulePrepareConfig,
  ABI45_0_0RCTPLNativeModuleMainThreadUsesCount,
  ABI45_0_0RCTPLNativeModuleSetup,
  ABI45_0_0RCTPLTurboModuleSetup,
  ABI45_0_0RCTPLJSCWrapperOpenLibrary,
  ABI45_0_0RCTPLBridgeStartup,
  ABI45_0_0RCTPLTTI,
  ABI45_0_0RCTPLBundleSize,
  ABI45_0_0RCTPLABI45_0_0ReactInstanceInit,
  ABI45_0_0RCTPLSize // This is used to count the size
};
