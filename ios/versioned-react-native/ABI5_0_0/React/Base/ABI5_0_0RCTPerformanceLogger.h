/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "ABI5_0_0RCTDefines.h"

typedef NS_ENUM(NSUInteger, ABI5_0_0RCTPLTag) {
  ABI5_0_0RCTPLScriptDownload = 0,
  ABI5_0_0RCTPLScriptExecution,
  ABI5_0_0RCTPLRAMBundleLoad,
  ABI5_0_0RCTPLRAMStartupCodeSize,
  ABI5_0_0RCTPLRAMNativeRequires,
  ABI5_0_0RCTPLRAMNativeRequiresCount,
  ABI5_0_0RCTPLRAMNativeRequiresSize,
  ABI5_0_0RCTPLNativeModuleInit,
  ABI5_0_0RCTPLNativeModuleMainThread,
  ABI5_0_0RCTPLNativeModulePrepareConfig,
  ABI5_0_0RCTPLNativeModuleInjectConfig,
  ABI5_0_0RCTPLNativeModuleMainThreadUsesCount,
  ABI5_0_0RCTPLJSCExecutorSetup,
  ABI5_0_0RCTPLBridgeStartup,
  ABI5_0_0RCTPLTTI,
  ABI5_0_0RCTPLBundleSize,
  ABI5_0_0RCTPLSize
};

/**
 * Starts measuring a metric with the given tag.
 * Overrides previous value if the measurement has been already started.
 * If ABI5_0_0RCTProfile is enabled it also begins appropriate async event.
 */
ABI5_0_0RCT_EXTERN void ABI5_0_0RCTPerformanceLoggerStart(ABI5_0_0RCTPLTag tag);

/**
 * Stops measuring a metric with given tag.
 * Checks if ABI5_0_0RCTPerformanceLoggerStart() has been called before
 * and doesn't do anything and log a message if it hasn't.
 * If ABI5_0_0RCTProfile is enabled it also ends appropriate async event.
 */
ABI5_0_0RCT_EXTERN void ABI5_0_0RCTPerformanceLoggerEnd(ABI5_0_0RCTPLTag tag);

/**
 * Sets given value for a metric with given tag.
 */
ABI5_0_0RCT_EXTERN void ABI5_0_0RCTPerformanceLoggerSet(ABI5_0_0RCTPLTag tag, int64_t value);

/**
 * Adds given value to the current value for a metric with given tag.
 */
ABI5_0_0RCT_EXTERN void ABI5_0_0RCTPerformanceLoggerAdd(ABI5_0_0RCTPLTag tag, int64_t value);

/**
 * Starts an additional measurement for a metric with given tag.
 * It doesn't override previous measurement, instead it'll append a new value
 * to the old one.
 */
ABI5_0_0RCT_EXTERN void ABI5_0_0RCTPerformanceLoggerAppendStart(ABI5_0_0RCTPLTag tag);

/**
 * Stops measurement and appends the result to the metric with given tag.
 * Checks if ABI5_0_0RCTPerformanceLoggerAppendStart() has been called before
 * and doesn't do anything and log a message if it hasn't.
 */
ABI5_0_0RCT_EXTERN void ABI5_0_0RCTPerformanceLoggerAppendEnd(ABI5_0_0RCTPLTag tag);

ABI5_0_0RCT_EXTERN NSArray<NSNumber *> *ABI5_0_0RCTPerformanceLoggerOutput(void);
ABI5_0_0RCT_EXTERN NSArray *ABI5_0_0RCTPerformanceLoggerLabels(void);
