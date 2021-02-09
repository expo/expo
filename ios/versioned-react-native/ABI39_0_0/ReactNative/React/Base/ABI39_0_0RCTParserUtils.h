/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI39_0_0React/ABI39_0_0RCTDefines.h>

@interface ABI39_0_0RCTParserUtils : NSObject

/**
 * Generic utility functions for parsing Objective-C source code.
 */
ABI39_0_0RCT_EXTERN BOOL ABI39_0_0RCTReadChar(const char **input, char c);
ABI39_0_0RCT_EXTERN BOOL ABI39_0_0RCTReadString(const char **input, const char *string);
ABI39_0_0RCT_EXTERN void ABI39_0_0RCTSkipWhitespace(const char **input);
ABI39_0_0RCT_EXTERN BOOL ABI39_0_0RCTParseSelectorIdentifier(const char **input, NSString **string);
ABI39_0_0RCT_EXTERN BOOL ABI39_0_0RCTParseArgumentIdentifier(const char **input, NSString **string);

/**
 * Parse an Objective-C type into a form that can be used by ABI39_0_0RCTConvert.
 * This doesn't really belong here, but it's used by both ABI39_0_0RCTConvert and
 * ABI39_0_0RCTModuleMethod, which makes it difficult to find a better home for it.
 */
ABI39_0_0RCT_EXTERN NSString *ABI39_0_0RCTParseType(const char **input);

@end
