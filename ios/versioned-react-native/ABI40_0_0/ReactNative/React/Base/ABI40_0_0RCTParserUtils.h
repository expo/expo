/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI40_0_0React/ABI40_0_0RCTDefines.h>

@interface ABI40_0_0RCTParserUtils : NSObject

/**
 * Generic utility functions for parsing Objective-C source code.
 */
ABI40_0_0RCT_EXTERN BOOL ABI40_0_0RCTReadChar(const char **input, char c);
ABI40_0_0RCT_EXTERN BOOL ABI40_0_0RCTReadString(const char **input, const char *string);
ABI40_0_0RCT_EXTERN void ABI40_0_0RCTSkipWhitespace(const char **input);
ABI40_0_0RCT_EXTERN BOOL ABI40_0_0RCTParseSelectorIdentifier(const char **input, NSString **string);
ABI40_0_0RCT_EXTERN BOOL ABI40_0_0RCTParseArgumentIdentifier(const char **input, NSString **string);

/**
 * Parse an Objective-C type into a form that can be used by ABI40_0_0RCTConvert.
 * This doesn't really belong here, but it's used by both ABI40_0_0RCTConvert and
 * ABI40_0_0RCTModuleMethod, which makes it difficult to find a better home for it.
 */
ABI40_0_0RCT_EXTERN NSString *ABI40_0_0RCTParseType(const char **input);

@end
