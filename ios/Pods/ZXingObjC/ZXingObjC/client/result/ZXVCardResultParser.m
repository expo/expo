/*
 * Copyright 2012 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "ZXAddressBookParsedResult.h"
#import "ZXResult.h"
#import "ZXVCardResultParser.h"

static NSRegularExpression *ZX_BEGIN_VCARD = nil;
static NSRegularExpression *ZX_VCARD_LIKE_DATE = nil;
static NSRegularExpression *ZX_CR_LF_SPACE_TAB = nil;
static NSRegularExpression *ZX_NEWLINE_ESCAPE = nil;
static NSRegularExpression *ZX_VCARD_ESCAPES = nil;
static NSString *ZX_EQUALS = @"=";
static NSString *ZX_SEMICOLON = @";";
static NSRegularExpression *ZX_UNESCAPED_SEMICOLONS = nil;
static NSCharacterSet *ZX_COMMA = nil;
static NSCharacterSet *ZX_SEMICOLON_OR_COMMA = nil;

@implementation ZXVCardResultParser

+ (void)initialize {
  if ([self class] != [ZXVCardResultParser class]) return;

  ZX_BEGIN_VCARD = [[NSRegularExpression alloc] initWithPattern:@"BEGIN:VCARD" options:NSRegularExpressionCaseInsensitive error:nil];
  ZX_VCARD_LIKE_DATE = [[NSRegularExpression alloc] initWithPattern:@"\\d{4}-?\\d{2}-?\\d{2}" options:0 error:nil];
  ZX_CR_LF_SPACE_TAB = [[NSRegularExpression alloc] initWithPattern:@"\r\n[ \t]" options:0 error:nil];
  ZX_NEWLINE_ESCAPE = [[NSRegularExpression alloc] initWithPattern:@"\\\\[nN]" options:0 error:nil];
  ZX_VCARD_ESCAPES = [[NSRegularExpression alloc] initWithPattern:@"\\\\([,;\\\\])" options:0 error:nil];
  ZX_UNESCAPED_SEMICOLONS = [[NSRegularExpression alloc] initWithPattern:@"(?<!\\\\);+" options:0 error:nil];
  ZX_COMMA = [NSCharacterSet characterSetWithCharactersInString:@","];
  ZX_SEMICOLON_OR_COMMA = [NSCharacterSet characterSetWithCharactersInString:@";,"];
}

- (ZXParsedResult *)parse:(ZXResult *)result {
  // Although we should insist on the raw text ending with "END:VCARD", there's no reason
  // to throw out everything else we parsed just because this was omitted. In fact, Eclair
  // is doing just that, and we can't parse its contacts without this leniency.
  NSString *rawText = [ZXResultParser massagedText:result];
  if ([ZX_BEGIN_VCARD numberOfMatchesInString:rawText options:0 range:NSMakeRange(0, rawText.length)] == 0) {
    return nil;
  }
  NSMutableArray *names = [[self class] matchVCardPrefixedField:@"FN" rawText:rawText trim:YES parseFieldDivider:NO];
  if (names == nil) {
    // If no display names found, look for regular name fields and format them
    names = [[self class] matchVCardPrefixedField:@"N" rawText:rawText trim:YES parseFieldDivider:NO];
    [self formatNames:names];
  }
  NSArray *nicknameString = [[self class] matchSingleVCardPrefixedField:@"NICKNAME" rawText:rawText trim:YES parseFieldDivider:NO];
  NSArray *nicknames = nicknameString == nil ? nil : [nicknameString[0] componentsSeparatedByCharactersInSet:ZX_COMMA];
  NSArray *phoneNumbers = [[self class] matchVCardPrefixedField:@"TEL" rawText:rawText trim:YES parseFieldDivider:NO];
  NSArray *emails = [[self class] matchVCardPrefixedField:@"EMAIL" rawText:rawText trim:YES parseFieldDivider:NO];
  NSArray *note = [[self class] matchSingleVCardPrefixedField:@"NOTE" rawText:rawText trim:NO parseFieldDivider:NO];
  NSMutableArray *addresses = [[self class] matchVCardPrefixedField:@"ADR" rawText:rawText trim:YES parseFieldDivider:YES];
  NSArray *org = [[self class] matchSingleVCardPrefixedField:@"ORG" rawText:rawText trim:YES parseFieldDivider:YES];
  NSArray *birthday = [[self class] matchSingleVCardPrefixedField:@"BDAY" rawText:rawText trim:YES parseFieldDivider:NO];
  if (birthday != nil && ![self isLikeVCardDate:birthday[0]]) {
    birthday = nil;
  }
  NSArray *title = [[self class] matchSingleVCardPrefixedField:@"TITLE" rawText:rawText trim:YES parseFieldDivider:NO];
  NSArray *urls = [[self class] matchVCardPrefixedField:@"URL" rawText:rawText trim:YES parseFieldDivider:NO];
  NSArray *instantMessenger = [[self class] matchSingleVCardPrefixedField:@"IMPP" rawText:rawText trim:YES parseFieldDivider:NO];
  NSArray *geoString = [[self class] matchSingleVCardPrefixedField:@"GEO" rawText:rawText trim:YES parseFieldDivider:NO];
  NSArray *geo = geoString == nil ? nil : [geoString[0] componentsSeparatedByCharactersInSet:ZX_SEMICOLON_OR_COMMA];
  if (geo != nil && geo.count != 2) {
    geo = nil;
  }
  return [ZXAddressBookParsedResult addressBookParsedResultWithNames:[self toPrimaryValues:names]
                                                           nicknames:nicknames
                                                       pronunciation:nil
                                                        phoneNumbers:[self toPrimaryValues:phoneNumbers]
                                                          phoneTypes:[self toTypes:phoneNumbers]
                                                              emails:[self toPrimaryValues:emails]
                                                          emailTypes:[self toTypes:emails]
                                                    instantMessenger:[self toPrimaryValue:instantMessenger]
                                                                note:[self toPrimaryValue:note]
                                                           addresses:[self toPrimaryValues:addresses]
                                                        addressTypes:[self toTypes:addresses]
                                                                 org:[self toPrimaryValue:org]
                                                            birthday:[self toPrimaryValue:birthday]
                                                               title:[self toPrimaryValue:title]
                                                                urls:[self toPrimaryValues:urls]
                                                                 geo:geo];
}

+ (NSMutableArray *)matchVCardPrefixedField:(NSString *)prefix rawText:(NSString *)rawText trim:(BOOL)trim parseFieldDivider:(BOOL)parseFieldDivider {
  NSMutableArray *matches = nil;
  NSUInteger i = 0;
  NSUInteger max = [rawText length];

  while (i < max) {
    // At start or after newling, match prefix, followed by optional metadata
    // (led by ;) ultimately ending in colon
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:[NSString stringWithFormat:@"(?:^|\n)%@(?:;([^:]*))?:", prefix]
                                                                             options:NSRegularExpressionCaseInsensitive error:nil];
    if (i > 0) {
      i--; // Find from i-1 not i since looking at the preceding character
    }
    NSArray *regexMatches = [regex matchesInString:rawText options:0 range:NSMakeRange(i, rawText.length - i)];
    if (regexMatches.count == 0) {
      break;
    }
    NSRange matchRange = [regexMatches[0] range];
    i = matchRange.location + matchRange.length;

    NSString *metadataString = nil;
    if ([regexMatches[0] rangeAtIndex:1].location != NSNotFound) {
      metadataString = [rawText substringWithRange:[regexMatches[0] rangeAtIndex:1]];
    }
    NSMutableArray *metadata = nil;
    BOOL quotedPrintable = NO;
    NSString *quotedPrintableCharset = nil;
    if (metadataString != nil) {
      for (NSString *metadatum in [metadataString componentsSeparatedByString:ZX_SEMICOLON]) {
        if (metadata == nil) {
          metadata = [NSMutableArray array];
        }
        [metadata addObject:metadatum];
        NSUInteger equals = [metadatum rangeOfString:ZX_EQUALS].location;
        if (equals != NSNotFound) {
          NSString *key = [metadatum substringToIndex:equals];
          NSString *value = [metadatum substringFromIndex:equals + 1];
          if ([@"ENCODING" caseInsensitiveCompare:key] == NSOrderedSame &&
              [@"QUOTED-PRINTABLE" caseInsensitiveCompare:value] == NSOrderedSame) {
            quotedPrintable = YES;
          } else if ([@"CHARSET" caseInsensitiveCompare:key] == NSOrderedSame) {
            quotedPrintableCharset = value;
          }
        }
      }
    }

    NSUInteger matchStart = i; // Found the start of a match here

    while ((NSUInteger)(i = [rawText rangeOfString:@"\n" options:NSLiteralSearch range:NSMakeRange(i, [rawText length] - i)].location) != NSNotFound) { // Really, end in \r\n
      if (i < [rawText length] - 1 &&                   // But if followed by tab or space,
          ([rawText characterAtIndex:i + 1] == ' ' ||   // this is only a continuation
           [rawText characterAtIndex:i + 1] == '\t')) {
        i += 2; // Skip \n and continutation whitespace
      } else if (quotedPrintable &&                          // If preceded by = in quoted printable
                 ((i >= 1 && [rawText characterAtIndex:i - 1] == '=') || // this is a continuation
                  (i >= 2 && [rawText characterAtIndex:i - 2] == '='))) {
        i++; // Skip \n
      } else {
        break;
      }
    }

    if (i == NSNotFound) {
      // No terminating end character? uh, done. Set i such that loop terminates and break
      i = max;
    } else if (i > matchStart) {
      // found a match
      if (matches == nil) {
        matches = [NSMutableArray arrayWithCapacity:1];
      }
      if (i >= 1 && [rawText characterAtIndex:i-1] == '\r') {
        i--; // Back up over \r, which really should be there
      }
      NSString *element = [rawText substringWithRange:NSMakeRange(matchStart, i - matchStart)];
      if (trim) {
        element = [element stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
      }
      if (quotedPrintable) {
        element = [self decodeQuotedPrintable:element charset:quotedPrintableCharset];
        if (parseFieldDivider) {
          element = [[ZX_UNESCAPED_SEMICOLONS stringByReplacingMatchesInString:element options:0 range:NSMakeRange(0, element.length) withTemplate:@"\n"]
                      stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
        }
      } else {
        if (parseFieldDivider) {
          element = [[ZX_UNESCAPED_SEMICOLONS stringByReplacingMatchesInString:element options:0 range:NSMakeRange(0, element.length) withTemplate:@"\n"]
                      stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
        }
        element = [ZX_CR_LF_SPACE_TAB stringByReplacingMatchesInString:element options:0 range:NSMakeRange(0, element.length) withTemplate:@""];
        element = [ZX_NEWLINE_ESCAPE stringByReplacingMatchesInString:element options:0 range:NSMakeRange(0, element.length) withTemplate:@"\n"];
        element = [ZX_VCARD_ESCAPES stringByReplacingMatchesInString:element options:0 range:NSMakeRange(0, element.length) withTemplate:@"$1"];
      }
      if (metadata == nil) {
        NSMutableArray *match = [NSMutableArray arrayWithObject:element];
        [match addObject:element];
        [matches addObject:match];
      } else {
        [metadata insertObject:element atIndex:0];
        [matches addObject:metadata];
      }
      i++;
    } else {
      i++;
    }
  }

  return matches;
}

+ (NSString *)decodeQuotedPrintable:(NSString *)value charset:(NSString *)charset {
  NSUInteger length = [value length];
  NSMutableString *result = [NSMutableString stringWithCapacity:length];
  NSMutableData *fragmentBuffer = [NSMutableData data];

  for (int i = 0; i < length; i++) {
    unichar c = [value characterAtIndex:i];

    switch (c) {
    case '\r':
    case '\n':
      break;
    case '=':
      if (i < length - 2) {
        unichar nextChar = [value characterAtIndex:i + 1];
        if (nextChar != '\r' && nextChar != '\n') {
          unichar nextNextChar = [value characterAtIndex:i + 2];
          int firstDigit = [self parseHexDigit:nextChar];
          int secondDigit = [self parseHexDigit:nextNextChar];
          if (firstDigit >= 0 && secondDigit >= 0) {
            int encodedByte = (firstDigit << 4) + secondDigit;
            [fragmentBuffer appendBytes:&encodedByte length:1];
          } // else ignore it, assume it was incorrectly encoded
          i += 2;
        }
      }
      break;
    default:
      [self maybeAppendFragment:fragmentBuffer charset:charset result:result];
      [result appendFormat:@"%C", c];
    }
  }

  [self maybeAppendFragment:fragmentBuffer charset:charset result:result];
  return result;
}

+ (void)maybeAppendFragment:(NSMutableData *)fragmentBuffer charset:(NSString *)charset result:(NSMutableString *)result {
  if ([fragmentBuffer length] > 0) {
    NSString *fragment;
    if (charset == nil || CFStringConvertIANACharSetNameToEncoding((CFStringRef)charset) == kCFStringEncodingInvalidId) {
      fragment = [[NSString alloc] initWithData:fragmentBuffer encoding:NSUTF8StringEncoding];
    } else {
      fragment = [[NSString alloc] initWithData:fragmentBuffer encoding:CFStringConvertEncodingToNSStringEncoding(CFStringConvertIANACharSetNameToEncoding((CFStringRef)charset))];
      if (!fragment) {
        fragment = [[NSString alloc] initWithData:fragmentBuffer encoding:NSUTF8StringEncoding];
      }
    }
    [fragmentBuffer setLength:0];
    [result appendString:fragment];
  }
}

+ (NSArray *)matchSingleVCardPrefixedField:(NSString *)prefix rawText:(NSString *)rawText trim:(BOOL)trim parseFieldDivider:(BOOL)parseFieldDivider {
  NSArray *values = [self matchVCardPrefixedField:prefix rawText:rawText trim:trim parseFieldDivider:parseFieldDivider];
  return values == nil ? nil : values[0];
}

- (NSString *)toPrimaryValue:(NSArray *)list {
  return list == nil || list.count == 0 ? nil : list[0];
}

- (NSArray *)toPrimaryValues:(NSArray *)lists {
  if (lists == nil || lists.count == 0) {
    return nil;
  }
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:lists.count];
  for (NSArray *list in lists) {
    NSString *value = list[0];
    if (value != nil && value.length > 0) {
      [result addObject:value];
    }
  }
  return result;
}

- (NSArray *)toTypes:(NSArray *)lists {
  if (lists == nil || lists.count == 0) {
    return nil;
  }
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:lists.count];
  for (NSArray *list in lists) {
    NSString *type = nil;
    for (int i = 1; i < list.count; i++) {
      NSString *metadatum = list[i];
      NSUInteger equals = [metadatum rangeOfString:@"=" options:NSCaseInsensitiveSearch].location;
      if (equals == NSNotFound) {
        // take the whole thing as a usable label
        type = metadatum;
        break;
      }
      if ([@"TYPE" isEqualToString:[[metadatum substringToIndex:equals] uppercaseString]]) {
        type = [metadatum substringFromIndex:equals + 1];
        break;
      }
    }

    if (type) {
      [result addObject:type];
    } else {
      [result addObject:[NSNull null]];
    }
  }
  return result;
}

- (BOOL)isLikeVCardDate:(NSString *)value {
  return value == nil || [ZX_VCARD_LIKE_DATE numberOfMatchesInString:value options:0 range:NSMakeRange(0, value.length)] > 0;
}

/**
 * Formats name fields of the form "Public;John;Q.;Reverend;III" into a form like
 * "Reverend John Q. Public III".
 *
 * @param names name values to format, in place
 */
- (void)formatNames:(NSMutableArray *)names {
  if (names != nil) {
    for (NSMutableArray *list in names) {
      NSString *name = list[0];
      NSArray *allComponents = [name componentsSeparatedByString:@";"];
      NSMutableArray *components = [NSMutableArray array];
      for (NSString *component in allComponents) {
        if ([component length] > 0) {
          [components addObject:component];
        }
      }

      NSMutableString *newName = [NSMutableString stringWithCapacity:100];
      [self maybeAppendComponent:components i:3 newName:newName];
      [self maybeAppendComponent:components i:1 newName:newName];
      [self maybeAppendComponent:components i:2 newName:newName];
      [self maybeAppendComponent:components i:0 newName:newName];
      [self maybeAppendComponent:components i:4 newName:newName];
      list[0] = [newName stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    }
  }
}

- (void)maybeAppendComponent:(NSArray *)components i:(int)i newName:(NSMutableString *)newName {
  if ([components count] > i && components[i] && [(NSString *)components[i] length] > 0) {
    if ([newName length] > 0) {
      [newName appendString:@" "];
    }
    [newName appendString:components[i]];
  }
}

@end
