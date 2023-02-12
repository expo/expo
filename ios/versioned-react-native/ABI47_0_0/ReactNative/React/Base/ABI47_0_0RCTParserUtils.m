/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTParserUtils.h"

#import "ABI47_0_0RCTLog.h"

@implementation ABI47_0_0RCTParserUtils

BOOL ABI47_0_0RCTReadChar(const char **input, char c)
{
  if (**input == c) {
    (*input)++;
    return YES;
  }
  return NO;
}

BOOL ABI47_0_0RCTReadString(const char **input, const char *string)
{
  int i;
  for (i = 0; string[i] != 0; i++) {
    if (string[i] != (*input)[i]) {
      return NO;
    }
  }
  *input += i;
  return YES;
}

void ABI47_0_0RCTSkipWhitespace(const char **input)
{
  while (isspace(**input)) {
    (*input)++;
  }
}

static BOOL ABI47_0_0RCTIsIdentifierHead(const char c)
{
  return isalpha(c) || c == '_';
}

static BOOL ABI47_0_0RCTIsIdentifierTail(const char c)
{
  return isalnum(c) || c == '_';
}

BOOL ABI47_0_0RCTParseArgumentIdentifier(const char **input, NSString **string)
{
  const char *start = *input;

  do {
    if (!ABI47_0_0RCTIsIdentifierHead(**input)) {
      return NO;
    }
    (*input)++;

    while (ABI47_0_0RCTIsIdentifierTail(**input)) {
      (*input)++;
    }

    // allow namespace resolution operator
  } while (ABI47_0_0RCTReadString(input, "::"));

  if (string) {
    *string = [[NSString alloc] initWithBytes:start length:(NSInteger)(*input - start) encoding:NSASCIIStringEncoding];
  }
  return YES;
}

BOOL ABI47_0_0RCTParseSelectorIdentifier(const char **input, NSString **string)
{
  const char *start = *input;
  if (!ABI47_0_0RCTIsIdentifierHead(**input)) {
    return NO;
  }
  (*input)++;
  while (ABI47_0_0RCTIsIdentifierTail(**input)) {
    (*input)++;
  }
  if (string) {
    *string = [[NSString alloc] initWithBytes:start length:(NSInteger)(*input - start) encoding:NSASCIIStringEncoding];
  }
  return YES;
}

static BOOL ABI47_0_0RCTIsCollectionType(NSString *type)
{
  static NSSet *collectionTypes;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    collectionTypes = [[NSSet alloc] initWithObjects:@"NSArray", @"NSSet", @"NSDictionary", nil];
  });
  return [collectionTypes containsObject:type];
}

NSString *ABI47_0_0RCTParseType(const char **input)
{
  NSString *type;
  ABI47_0_0RCTParseArgumentIdentifier(input, &type);
  ABI47_0_0RCTSkipWhitespace(input);
  if (ABI47_0_0RCTReadChar(input, '<')) {
    ABI47_0_0RCTSkipWhitespace(input);
    NSString *subtype = ABI47_0_0RCTParseType(input);
    if (ABI47_0_0RCTIsCollectionType(type)) {
      if ([type isEqualToString:@"NSDictionary"]) {
        // Dictionaries have both a key *and* value type, but the key type has
        // to be a string for JSON, so we only care about the value type
        if (ABI47_0_0RCT_DEBUG && ![subtype isEqualToString:@"NSString"]) {
          ABI47_0_0RCTLogError(@"%@ is not a valid key type for a JSON dictionary", subtype);
        }
        ABI47_0_0RCTSkipWhitespace(input);
        ABI47_0_0RCTReadChar(input, ',');
        ABI47_0_0RCTSkipWhitespace(input);
        subtype = ABI47_0_0RCTParseType(input);
      }
      if (![subtype isEqualToString:@"id"]) {
        type = [type stringByReplacingCharactersInRange:(NSRange){0, 2 /* "NS" */} withString:subtype];
      }
    } else {
      // It's a protocol rather than a generic collection - ignore it
    }
    ABI47_0_0RCTSkipWhitespace(input);
    ABI47_0_0RCTReadChar(input, '>');
  }
  ABI47_0_0RCTSkipWhitespace(input);
  if (!ABI47_0_0RCTReadChar(input, '*')) {
    ABI47_0_0RCTReadChar(input, '&');
  }
  return type;
}

@end
