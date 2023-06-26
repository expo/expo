/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTPerformanceLoggerLabels.h"
#import <ABI49_0_0React/ABI49_0_0RCTAssert.h>

NSString *ABI49_0_0RCTPLLabelForTag(ABI49_0_0RCTPLTag tag)
{
  switch (tag) {
    case ABI49_0_0RCTPLScriptDownload:
      return @"ScriptDownload";
    case ABI49_0_0RCTPLScriptExecution:
      return @"ScriptExecution";
    case ABI49_0_0RCTPLRAMBundleLoad:
      return @"RAMBundleLoad";
    case ABI49_0_0RCTPLRAMStartupCodeSize:
      return @"RAMStartupCodeSize";
    case ABI49_0_0RCTPLRAMStartupNativeRequires:
      return @"RAMStartupNativeRequires";
    case ABI49_0_0RCTPLRAMStartupNativeRequiresCount:
      return @"RAMStartupNativeRequiresCount";
    case ABI49_0_0RCTPLRAMNativeRequires:
      return @"RAMNativeRequires";
    case ABI49_0_0RCTPLRAMNativeRequiresCount:
      return @"RAMNativeRequiresCount";
    case ABI49_0_0RCTPLNativeModuleInit:
      return @"NativeModuleInit";
    case ABI49_0_0RCTPLNativeModuleMainThread:
      return @"NativeModuleMainThread";
    case ABI49_0_0RCTPLNativeModulePrepareConfig:
      return @"NativeModulePrepareConfig";
    case ABI49_0_0RCTPLNativeModuleMainThreadUsesCount:
      return @"NativeModuleMainThreadUsesCount";
    case ABI49_0_0RCTPLNativeModuleSetup:
      return @"NativeModuleSetup";
    case ABI49_0_0RCTPLTurboModuleSetup:
      return @"TurboModuleSetup";
    case ABI49_0_0RCTPLJSCWrapperOpenLibrary:
      return @"JSCWrapperOpenLibrary";
    case ABI49_0_0RCTPLBridgeStartup:
      return @"BridgeStartup";
    case ABI49_0_0RCTPLTTI:
      return @"RootViewTTI";
    case ABI49_0_0RCTPLBundleSize:
      return @"BundleSize";
    case ABI49_0_0RCTPLABI49_0_0ReactInstanceInit:
      return @"ABI49_0_0ReactInstanceInit";
    case ABI49_0_0RCTPLSize: // Only used to count enum size
      ABI49_0_0RCTAssert(NO, @"ABI49_0_0RCTPLSize should not be used to track performance timestamps.");
      return nil;
  }
}
