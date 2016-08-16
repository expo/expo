/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "ABI7_0_0RCTDefines.h"

typedef NS_ENUM(NSUInteger, ABI7_0_0RCTPLTag) {
  ABI7_0_0RCTPLScriptDownload = 0,
  ABI7_0_0RCTPLScriptExecution,
  ABI7_0_0RCTPLRAMBundleLoad,
  ABI7_0_0RCTPLRAMStartupCodeSize,
  ABI7_0_0RCTPLRAMNativeRequires,
  ABI7_0_0RCTPLRAMNativeRequiresCount,
  ABI7_0_0RCTPLRAMNativeRequiresSize,
  ABI7_0_0RCTPLNativeModuleInit,
  ABI7_0_0RCTPLNativeModuleMainThread,
  ABI7_0_0RCTPLNativeModulePrepareConfig,
  ABI7_0_0RCTPLNativeModuleInjectConfig,
  ABI7_0_0RCTPLNativeModuleMainThreadUsesCount,
  ABI7_0_0RCTPLJSCExecutorSetup,
  ABI7_0_0RCTPLBridgeStartup,
  ABI7_0_0RCTPLTTI,
  ABI7_0_0RCTPLBundleSize,
  ABI7_0_0RCTPLSize
};

/**
 * Starts measuring a metric with the given tag.
 * Overrides previous value if the measurement has been already started.
 * If ABI7_0_0RCTProfile is enabled it also begins appropriate async event.
 */
ABI7_0_0RCT_EXTERN void ABI7_0_0RCTPerformanceLoggerStart(ABI7_0_0RCTPLTag tag);

/**
 * Stops measuring a metric with given tag.
 * Checks if ABI7_0_0RCTPerformanceLoggerStart() has been called before
 * and doesn't do anything and log a message if it hasn't.
 * If ABI7_0_0RCTProfile is enabled it also ends appropriate async event.
 */
ABI7_0_0RCT_EXTERN void ABI7_0_0RCTPerformanceLoggerEnd(ABI7_0_0RCTPLTag tag);

/**
 * Sets given value for a metric with given tag.
 */
ABI7_0_0RCT_EXTERN void ABI7_0_0RCTPerformanceLoggerSet(ABI7_0_0RCTPLTag tag, int64_t value);

/**
 * Adds given value to the current value for a metric with given tag.
 */
ABI7_0_0RCT_EXTERN void ABI7_0_0RCTPerformanceLoggerAdd(ABI7_0_0RCTPLTag tag, int64_t value);

/**
 * Starts an additional measurement for a metric with given tag.
 * It doesn't override previous measurement, instead it'll append a new value
 * to the old one.
 */
ABI7_0_0RCT_EXTERN void ABI7_0_0RCTPerformanceLoggerAppendStart(ABI7_0_0RCTPLTag tag);

/**
 * Stops measurement and appends the result to the metric with given tag.
 * Checks if ABI7_0_0RCTPerformanceLoggerAppendStart() has been called before
 * and doesn't do anything and log a message if it hasn't.
 */
ABI7_0_0RCT_EXTERN void ABI7_0_0RCTPerformanceLoggerAppendEnd(ABI7_0_0RCTPLTag tag);

ABI7_0_0RCT_EXTERN NSArray<NSNumber *> *ABI7_0_0RCTPerformanceLoggerOutput(void);
ABI7_0_0RCT_EXTERN NSArray *ABI7_0_0RCTPerformanceLoggerLabels(void);
