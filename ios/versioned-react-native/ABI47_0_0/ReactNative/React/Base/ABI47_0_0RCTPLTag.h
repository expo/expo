/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

typedef NS_ENUM(NSInteger, ABI47_0_0RCTPLTag) {
  ABI47_0_0RCTPLScriptDownload = 0,
  ABI47_0_0RCTPLScriptExecution,
  ABI47_0_0RCTPLRAMBundleLoad,
  ABI47_0_0RCTPLRAMStartupCodeSize,
  ABI47_0_0RCTPLRAMStartupNativeRequires,
  ABI47_0_0RCTPLRAMStartupNativeRequiresCount,
  ABI47_0_0RCTPLRAMNativeRequires,
  ABI47_0_0RCTPLRAMNativeRequiresCount,
  ABI47_0_0RCTPLNativeModuleInit,
  ABI47_0_0RCTPLNativeModuleMainThread,
  ABI47_0_0RCTPLNativeModulePrepareConfig,
  ABI47_0_0RCTPLNativeModuleMainThreadUsesCount,
  ABI47_0_0RCTPLNativeModuleSetup,
  ABI47_0_0RCTPLTurboModuleSetup,
  ABI47_0_0RCTPLJSCWrapperOpenLibrary,
  ABI47_0_0RCTPLBridgeStartup,
  ABI47_0_0RCTPLTTI,
  ABI47_0_0RCTPLBundleSize,
  ABI47_0_0RCTPLABI47_0_0ReactInstanceInit,
  ABI47_0_0RCTPLSize // This is used to count the size
};
