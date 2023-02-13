/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTPerformanceLoggerLabels.h"
#import <ABI48_0_0React/ABI48_0_0RCTAssert.h>

NSString *ABI48_0_0RCTPLLabelForTag(ABI48_0_0RCTPLTag tag)
{
  switch (tag) {
    case ABI48_0_0RCTPLScriptDownload:
      return @"ScriptDownload";
    case ABI48_0_0RCTPLScriptExecution:
      return @"ScriptExecution";
    case ABI48_0_0RCTPLRAMBundleLoad:
      return @"RAMBundleLoad";
    case ABI48_0_0RCTPLRAMStartupCodeSize:
      return @"RAMStartupCodeSize";
    case ABI48_0_0RCTPLRAMStartupNativeRequires:
      return @"RAMStartupNativeRequires";
    case ABI48_0_0RCTPLRAMStartupNativeRequiresCount:
      return @"RAMStartupNativeRequiresCount";
    case ABI48_0_0RCTPLRAMNativeRequires:
      return @"RAMNativeRequires";
    case ABI48_0_0RCTPLRAMNativeRequiresCount:
      return @"RAMNativeRequiresCount";
    case ABI48_0_0RCTPLNativeModuleInit:
      return @"NativeModuleInit";
    case ABI48_0_0RCTPLNativeModuleMainThread:
      return @"NativeModuleMainThread";
    case ABI48_0_0RCTPLNativeModulePrepareConfig:
      return @"NativeModulePrepareConfig";
    case ABI48_0_0RCTPLNativeModuleMainThreadUsesCount:
      return @"NativeModuleMainThreadUsesCount";
    case ABI48_0_0RCTPLNativeModuleSetup:
      return @"NativeModuleSetup";
    case ABI48_0_0RCTPLTurboModuleSetup:
      return @"TurboModuleSetup";
    case ABI48_0_0RCTPLJSCWrapperOpenLibrary:
      return @"JSCWrapperOpenLibrary";
    case ABI48_0_0RCTPLBridgeStartup:
      return @"BridgeStartup";
    case ABI48_0_0RCTPLTTI:
      return @"RootViewTTI";
    case ABI48_0_0RCTPLBundleSize:
      return @"BundleSize";
    case ABI48_0_0RCTPLABI48_0_0ReactInstanceInit:
      return @"ABI48_0_0ReactInstanceInit";
    case ABI48_0_0RCTPLSize: // Only used to count enum size
      ABI48_0_0RCTAssert(NO, @"ABI48_0_0RCTPLSize should not be used to track performance timestamps.");
      return nil;
  }
}
