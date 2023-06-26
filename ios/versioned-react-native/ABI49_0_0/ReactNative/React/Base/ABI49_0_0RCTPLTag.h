/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

typedef NS_ENUM(NSInteger, ABI49_0_0RCTPLTag) {
  ABI49_0_0RCTPLScriptDownload = 0,
  ABI49_0_0RCTPLScriptExecution,
  ABI49_0_0RCTPLRAMBundleLoad,
  ABI49_0_0RCTPLRAMStartupCodeSize,
  ABI49_0_0RCTPLRAMStartupNativeRequires,
  ABI49_0_0RCTPLRAMStartupNativeRequiresCount,
  ABI49_0_0RCTPLRAMNativeRequires,
  ABI49_0_0RCTPLRAMNativeRequiresCount,
  ABI49_0_0RCTPLNativeModuleInit,
  ABI49_0_0RCTPLNativeModuleMainThread,
  ABI49_0_0RCTPLNativeModulePrepareConfig,
  ABI49_0_0RCTPLNativeModuleMainThreadUsesCount,
  ABI49_0_0RCTPLNativeModuleSetup,
  ABI49_0_0RCTPLTurboModuleSetup,
  ABI49_0_0RCTPLJSCWrapperOpenLibrary,
  ABI49_0_0RCTPLBridgeStartup,
  ABI49_0_0RCTPLTTI,
  ABI49_0_0RCTPLBundleSize,
  ABI49_0_0RCTPLABI49_0_0ReactInstanceInit,
  ABI49_0_0RCTPLSize // This is used to count the size
};
