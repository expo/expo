/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSUInteger, ABI29_0_0RCTPLTag) {
  ABI29_0_0RCTPLScriptDownload = 0,
  ABI29_0_0RCTPLScriptExecution,
  ABI29_0_0RCTPLRAMBundleLoad,
  ABI29_0_0RCTPLRAMStartupCodeSize,
  ABI29_0_0RCTPLRAMStartupNativeRequires,
  ABI29_0_0RCTPLRAMStartupNativeRequiresCount,
  ABI29_0_0RCTPLRAMNativeRequires,
  ABI29_0_0RCTPLRAMNativeRequiresCount,
  ABI29_0_0RCTPLNativeModuleInit,
  ABI29_0_0RCTPLNativeModuleMainThread,
  ABI29_0_0RCTPLNativeModulePrepareConfig,
  ABI29_0_0RCTPLNativeModuleInjectConfig,
  ABI29_0_0RCTPLNativeModuleMainThreadUsesCount,
  ABI29_0_0RCTPLJSCWrapperOpenLibrary,
  ABI29_0_0RCTPLJSCExecutorSetup,
  ABI29_0_0RCTPLBridgeStartup,
  ABI29_0_0RCTPLTTI,
  ABI29_0_0RCTPLBundleSize,
  ABI29_0_0RCTPLSize
};

@interface ABI29_0_0RCTPerformanceLogger : NSObject

/**
 * Starts measuring a metric with the given tag.
 * Overrides previous value if the measurement has been already started.
 * If ABI29_0_0RCTProfile is enabled it also begins appropriate async event.
 * All work is scheduled on the background queue so this doesn't block current thread.
 */
- (void)markStartForTag:(ABI29_0_0RCTPLTag)tag;

/**
 * Stops measuring a metric with given tag.
 * Checks if ABI29_0_0RCTPerformanceLoggerStart() has been called before
 * and doesn't do anything and log a message if it hasn't.
 * If ABI29_0_0RCTProfile is enabled it also ends appropriate async event.
 * All work is scheduled on the background queue so this doesn't block current thread.
 */
- (void)markStopForTag:(ABI29_0_0RCTPLTag)tag;

/**
 * Sets given value for a metric with given tag.
 * All work is scheduled on the background queue so this doesn't block current thread.
 */
- (void)setValue:(int64_t)value forTag:(ABI29_0_0RCTPLTag)tag;

/**
 * Adds given value to the current value for a metric with given tag.
 * All work is scheduled on the background queue so this doesn't block current thread.
 */
- (void)addValue:(int64_t)value forTag:(ABI29_0_0RCTPLTag)tag;

/**
 * Starts an additional measurement for a metric with given tag.
 * It doesn't override previous measurement, instead it'll append a new value
 * to the old one.
 * All work is scheduled on the background queue so this doesn't block current thread.
 */
- (void)appendStartForTag:(ABI29_0_0RCTPLTag)tag;

/**
 * Stops measurement and appends the result to the metric with given tag.
 * Checks if ABI29_0_0RCTPerformanceLoggerAppendStart() has been called before
 * and doesn't do anything and log a message if it hasn't.
 * All work is scheduled on the background queue so this doesn't block current thread.
 */
- (void)appendStopForTag:(ABI29_0_0RCTPLTag)tag;

/**
 * Returns an array with values for all tags.
 * Use ABI29_0_0RCTPLTag to go over the array, there's a pair of values
 * for each tag: start and stop (with indexes 2 * tag and 2 * tag + 1).
 */
- (NSArray<NSNumber *> *)valuesForTags;

/**
 * Returns a duration in ms (stop_time - start_time) for given ABI29_0_0RCTPLTag.
 */
- (int64_t)durationForTag:(ABI29_0_0RCTPLTag)tag;

/**
 * Returns a value for given ABI29_0_0RCTPLTag.
 */
- (int64_t)valueForTag:(ABI29_0_0RCTPLTag)tag;

/**
 * Returns an array with values for all tags.
 * Use ABI29_0_0RCTPLTag to go over the array.
 */
- (NSArray<NSString *> *)labelsForTags;

@end
