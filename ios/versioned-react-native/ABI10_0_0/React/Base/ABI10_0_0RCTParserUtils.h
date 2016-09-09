/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "ABI10_0_0RCTDefines.h"

@interface ABI10_0_0RCTParserUtils : NSObject

/**
 * Generic utility functions for parsing Objective-C source code.
 */
ABI10_0_0RCT_EXTERN BOOL ABI10_0_0RCTReadChar(const char **input, char c);
ABI10_0_0RCT_EXTERN BOOL ABI10_0_0RCTReadString(const char **input, const char *string);
ABI10_0_0RCT_EXTERN void ABI10_0_0RCTSkipWhitespace(const char **input);
ABI10_0_0RCT_EXTERN BOOL ABI10_0_0RCTParseIdentifier(const char **input, NSString **string);

/**
 * Parse an Objective-C type into a form that can be used by ABI10_0_0RCTConvert.
 * This doesn't really belong here, but it's used by both ABI10_0_0RCTConvert and
 * ABI10_0_0RCTModuleMethod, which makes it difficult to find a better home for it.
 */
ABI10_0_0RCT_EXTERN NSString *ABI10_0_0RCTParseType(const char **input);

@end
