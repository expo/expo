/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTParserUtils.h"

#import "ABI29_0_0RCTLog.h"

@implementation ABI29_0_0RCTParserUtils

BOOL ABI29_0_0RCTReadChar(const char **input, char c)
{
  if (**input == c) {
    (*input)++;
    return YES;
  }
  return NO;
}

BOOL ABI29_0_0RCTReadString(const char **input, const char *string)
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

void ABI29_0_0RCTSkipWhitespace(const char **input)
{
  while (isspace(**input)) {
    (*input)++;
  }
}

static BOOL ABI29_0_0RCTIsIdentifierHead(const char c)
{
  return isalpha(c) || c == '_';
}

static BOOL ABI29_0_0RCTIsIdentifierTail(const char c)
{
  return isalnum(c) || c == '_';
}

BOOL ABI29_0_0RCTParseArgumentIdentifier(const char **input, NSString **string)
{
  const char *start = *input;

  do {
    if (!ABI29_0_0RCTIsIdentifierHead(**input)) {
      return NO;
    }
    (*input)++;

    while (ABI29_0_0RCTIsIdentifierTail(**input)) {
      (*input)++;
    }

  // allow namespace resolution operator
  } while (ABI29_0_0RCTReadString(input, "::"));

  if (string) {
    *string = [[NSString alloc] initWithBytes:start
                                       length:(NSInteger)(*input - start)
                                     encoding:NSASCIIStringEncoding];
  }
  return YES;
}

BOOL ABI29_0_0RCTParseSelectorIdentifier(const char **input, NSString **string)
{
  const char *start = *input;
  if (!ABI29_0_0RCTIsIdentifierHead(**input)) {
    return NO;
  }
  (*input)++;
  while (ABI29_0_0RCTIsIdentifierTail(**input)) {
    (*input)++;
  }
  if (string) {
    *string = [[NSString alloc] initWithBytes:start
                                       length:(NSInteger)(*input - start)
                                     encoding:NSASCIIStringEncoding];
  }
  return YES;
}

static BOOL ABI29_0_0RCTIsCollectionType(NSString *type)
{
  static NSSet *collectionTypes;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    collectionTypes = [[NSSet alloc] initWithObjects:
                       @"NSArray", @"NSSet", @"NSDictionary", nil];
  });
  return [collectionTypes containsObject:type];
}

NSString *ABI29_0_0RCTParseType(const char **input)
{
  NSString *type;
  ABI29_0_0RCTParseArgumentIdentifier(input, &type);
  ABI29_0_0RCTSkipWhitespace(input);
  if (ABI29_0_0RCTReadChar(input, '<')) {
    ABI29_0_0RCTSkipWhitespace(input);
    NSString *subtype = ABI29_0_0RCTParseType(input);
    if (ABI29_0_0RCTIsCollectionType(type)) {
      if ([type isEqualToString:@"NSDictionary"]) {
        // Dictionaries have both a key *and* value type, but the key type has
        // to be a string for JSON, so we only care about the value type
        if (ABI29_0_0RCT_DEBUG && ![subtype isEqualToString:@"NSString"]) {
          ABI29_0_0RCTLogError(@"%@ is not a valid key type for a JSON dictionary", subtype);
        }
        ABI29_0_0RCTSkipWhitespace(input);
        ABI29_0_0RCTReadChar(input, ',');
        ABI29_0_0RCTSkipWhitespace(input);
        subtype = ABI29_0_0RCTParseType(input);
      }
      if (![subtype isEqualToString:@"id"]) {
        type = [type stringByReplacingCharactersInRange:(NSRange){0, 2 /* "NS" */}
                                             withString:subtype];
      }
    } else {
      // It's a protocol rather than a generic collection - ignore it
    }
    ABI29_0_0RCTSkipWhitespace(input);
    ABI29_0_0RCTReadChar(input, '>');
  }
  ABI29_0_0RCTSkipWhitespace(input);
  if (!ABI29_0_0RCTReadChar(input, '*')) {
    ABI29_0_0RCTReadChar(input, '&');
  }
  return type;
}

@end
