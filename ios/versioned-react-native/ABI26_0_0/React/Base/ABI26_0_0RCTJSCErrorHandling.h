/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <JavaScriptCore/JavaScriptCore.h>

#import <ReactABI26_0_0/ABI26_0_0RCTDefines.h>

/**
 Translates a given exception into an NSError.

 @param exception The JavaScript exception object to translate into an NSError. This must be
 a JavaScript Error object, otherwise no stack trace information will be available.

 @return The translated NSError object

 - The JS exception's name property is incorporated in the NSError's localized description
 - The JS exception's message property is the NSError's failure reason
 - The JS exception's unsymbolicated stack trace is available via the NSError userInfo's ABI26_0_0RCTJSExceptionUnsymbolicatedStackTraceKey
 */
ABI26_0_0RCT_EXTERN NSError *ABI26_0_0RCTNSErrorFromJSError(JSValue *exception);

/**
 Translates a given exception into an NSError.

 @see ABI26_0_0RCTNSErrorFromJSError for details
 */
ABI26_0_0RCT_EXTERN NSError *ABI26_0_0RCTNSErrorFromJSErrorRef(JSValueRef exceptionRef, JSGlobalContextRef ctx);
