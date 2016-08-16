/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "ABI6_0_0RCTDefines.h"

typedef NS_ENUM(NSUInteger, ABI6_0_0RCTPLTag) {
  ABI6_0_0RCTPLScriptDownload = 0,
  ABI6_0_0RCTPLScriptExecution,
  ABI6_0_0RCTPLRAMBundleLoad,
  ABI6_0_0RCTPLRAMStartupCodeSize,
  ABI6_0_0RCTPLRAMNativeRequires,
  ABI6_0_0RCTPLRAMNativeRequiresCount,
  ABI6_0_0RCTPLRAMNativeRequiresSize,
  ABI6_0_0RCTPLNativeModuleInit,
  ABI6_0_0RCTPLNativeModuleMainThread,
  ABI6_0_0RCTPLNativeModulePrepareConfig,
  ABI6_0_0RCTPLNativeModuleInjectConfig,
  ABI6_0_0RCTPLNativeModuleMainThreadUsesCount,
  ABI6_0_0RCTPLJSCExecutorSetup,
  ABI6_0_0RCTPLBridgeStartup,
  ABI6_0_0RCTPLTTI,
  ABI6_0_0RCTPLBundleSize,
  ABI6_0_0RCTPLSize
};

/**
 * Starts measuring a metric with the given tag.
 * Overrides previous value if the measurement has been already started.
 * If ABI6_0_0RCTProfile is enabled it also begins appropriate async event.
 */
ABI6_0_0RCT_EXTERN void ABI6_0_0RCTPerformanceLoggerStart(ABI6_0_0RCTPLTag tag);

/**
 * Stops measuring a metric with given tag.
 * Checks if ABI6_0_0RCTPerformanceLoggerStart() has been called before
 * and doesn't do anything and log a message if it hasn't.
 * If ABI6_0_0RCTProfile is enabled it also ends appropriate async event.
 */
ABI6_0_0RCT_EXTERN void ABI6_0_0RCTPerformanceLoggerEnd(ABI6_0_0RCTPLTag tag);

/**
 * Sets given value for a metric with given tag.
 */
ABI6_0_0RCT_EXTERN void ABI6_0_0RCTPerformanceLoggerSet(ABI6_0_0RCTPLTag tag, int64_t value);

/**
 * Adds given value to the current value for a metric with given tag.
 */
ABI6_0_0RCT_EXTERN void ABI6_0_0RCTPerformanceLoggerAdd(ABI6_0_0RCTPLTag tag, int64_t value);

/**
 * Starts an additional measurement for a metric with given tag.
 * It doesn't override previous measurement, instead it'll append a new value
 * to the old one.
 */
ABI6_0_0RCT_EXTERN void ABI6_0_0RCTPerformanceLoggerAppendStart(ABI6_0_0RCTPLTag tag);

/**
 * Stops measurement and appends the result to the metric with given tag.
 * Checks if ABI6_0_0RCTPerformanceLoggerAppendStart() has been called before
 * and doesn't do anything and log a message if it hasn't.
 */
ABI6_0_0RCT_EXTERN void ABI6_0_0RCTPerformanceLoggerAppendEnd(ABI6_0_0RCTPLTag tag);

ABI6_0_0RCT_EXTERN NSArray<NSNumber *> *ABI6_0_0RCTPerformanceLoggerOutput(void);
ABI6_0_0RCT_EXTERN NSArray *ABI6_0_0RCTPerformanceLoggerLabels(void);
