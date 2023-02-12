/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

typedef NS_ENUM(NSInteger, ABI48_0_0RCTPLTag) {
  ABI48_0_0RCTPLScriptDownload = 0,
  ABI48_0_0RCTPLScriptExecution,
  ABI48_0_0RCTPLRAMBundleLoad,
  ABI48_0_0RCTPLRAMStartupCodeSize,
  ABI48_0_0RCTPLRAMStartupNativeRequires,
  ABI48_0_0RCTPLRAMStartupNativeRequiresCount,
  ABI48_0_0RCTPLRAMNativeRequires,
  ABI48_0_0RCTPLRAMNativeRequiresCount,
  ABI48_0_0RCTPLNativeModuleInit,
  ABI48_0_0RCTPLNativeModuleMainThread,
  ABI48_0_0RCTPLNativeModulePrepareConfig,
  ABI48_0_0RCTPLNativeModuleMainThreadUsesCount,
  ABI48_0_0RCTPLNativeModuleSetup,
  ABI48_0_0RCTPLTurboModuleSetup,
  ABI48_0_0RCTPLJSCWrapperOpenLibrary,
  ABI48_0_0RCTPLBridgeStartup,
  ABI48_0_0RCTPLTTI,
  ABI48_0_0RCTPLBundleSize,
  ABI48_0_0RCTPLABI48_0_0ReactInstanceInit,
  ABI48_0_0RCTPLSize // This is used to count the size
};
