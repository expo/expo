/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI47_0_0React/ABI47_0_0RCTDefines.h>

@interface ABI47_0_0RCTParserUtils : NSObject

/**
 * Generic utility functions for parsing Objective-C source code.
 */
ABI47_0_0RCT_EXTERN BOOL ABI47_0_0RCTReadChar(const char **input, char c);
ABI47_0_0RCT_EXTERN BOOL ABI47_0_0RCTReadString(const char **input, const char *string);
ABI47_0_0RCT_EXTERN void ABI47_0_0RCTSkipWhitespace(const char **input);
ABI47_0_0RCT_EXTERN BOOL ABI47_0_0RCTParseSelectorIdentifier(const char **input, NSString **string);
ABI47_0_0RCT_EXTERN BOOL ABI47_0_0RCTParseArgumentIdentifier(const char **input, NSString **string);

/**
 * Parse an Objective-C type into a form that can be used by ABI47_0_0RCTConvert.
 * This doesn't really belong here, but it's used by both ABI47_0_0RCTConvert and
 * ABI47_0_0RCTModuleMethod, which makes it difficult to find a better home for it.
 */
ABI47_0_0RCT_EXTERN NSString *ABI47_0_0RCTParseType(const char **input);

@end
