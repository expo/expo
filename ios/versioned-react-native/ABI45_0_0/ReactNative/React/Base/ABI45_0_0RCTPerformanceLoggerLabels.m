/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTPerformanceLoggerLabels.h"
#import <ABI45_0_0React/ABI45_0_0RCTAssert.h>

NSString *ABI45_0_0RCTPLLabelForTag(ABI45_0_0RCTPLTag tag)
{
  switch (tag) {
    case ABI45_0_0RCTPLScriptDownload:
      return @"ScriptDownload";
    case ABI45_0_0RCTPLScriptExecution:
      return @"ScriptExecution";
    case ABI45_0_0RCTPLRAMBundleLoad:
      return @"RAMBundleLoad";
    case ABI45_0_0RCTPLRAMStartupCodeSize:
      return @"RAMStartupCodeSize";
    case ABI45_0_0RCTPLRAMStartupNativeRequires:
      return @"RAMStartupNativeRequires";
    case ABI45_0_0RCTPLRAMStartupNativeRequiresCount:
      return @"RAMStartupNativeRequiresCount";
    case ABI45_0_0RCTPLRAMNativeRequires:
      return @"RAMNativeRequires";
    case ABI45_0_0RCTPLRAMNativeRequiresCount:
      return @"RAMNativeRequiresCount";
    case ABI45_0_0RCTPLNativeModuleInit:
      return @"NativeModuleInit";
    case ABI45_0_0RCTPLNativeModuleMainThread:
      return @"NativeModuleMainThread";
    case ABI45_0_0RCTPLNativeModulePrepareConfig:
      return @"NativeModulePrepareConfig";
    case ABI45_0_0RCTPLNativeModuleMainThreadUsesCount:
      return @"NativeModuleMainThreadUsesCount";
    case ABI45_0_0RCTPLNativeModuleSetup:
      return @"NativeModuleSetup";
    case ABI45_0_0RCTPLTurboModuleSetup:
      return @"TurboModuleSetup";
    case ABI45_0_0RCTPLJSCWrapperOpenLibrary:
      return @"JSCWrapperOpenLibrary";
    case ABI45_0_0RCTPLBridgeStartup:
      return @"BridgeStartup";
    case ABI45_0_0RCTPLTTI:
      return @"RootViewTTI";
    case ABI45_0_0RCTPLBundleSize:
      return @"BundleSize";
    case ABI45_0_0RCTPLABI45_0_0ReactInstanceInit:
      return @"ABI45_0_0ReactInstanceInit";
    case ABI45_0_0RCTPLSize: // Only used to count enum size
      ABI45_0_0RCTAssert(NO, @"ABI45_0_0RCTPLSize should not be used to track performance timestamps.");
      return nil;
  }
}
