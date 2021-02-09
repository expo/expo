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

#import "ZXAddressBookAUResultParser.h"
#import "ZXAddressBookParsedResult.h"
#import "ZXResult.h"

@implementation ZXAddressBookAUResultParser

- (ZXParsedResult *)parse:(ZXResult *)result {
  NSString *rawText = [ZXResultParser massagedText:result];

  if ([rawText rangeOfString:@"MEMORY"].location == NSNotFound ||
      [rawText rangeOfString:@"\r\n"].location == NSNotFound) {
    return nil;
  }

  NSString *name = [[self class] matchSinglePrefixedField:@"NAME1:" rawText:rawText endChar:'\r' trim:YES];
  NSString *pronunciation = [[self class] matchSinglePrefixedField:@"NAME2:" rawText:rawText endChar:'\r' trim:YES];
  NSArray *phoneNumbers = [self matchMultipleValuePrefix:@"TEL" max:3 rawText:rawText trim:YES];
  NSArray *emails = [self matchMultipleValuePrefix:@"MAIL" max:3 rawText:rawText trim:YES];
  NSString *note = [[self class] matchSinglePrefixedField:@"MEMORY:" rawText:rawText endChar:'\r' trim:NO];
  NSString *address = [[self class] matchSinglePrefixedField:@"ADD:" rawText:rawText endChar:'\r' trim:YES];
  NSArray *addresses = address == nil ? nil : @[address];

  return [ZXAddressBookParsedResult addressBookParsedResultWithNames:[self maybeWrap:name]
                                                           nicknames:nil
                                                       pronunciation:pronunciation
                                                        phoneNumbers:phoneNumbers
                                                          phoneTypes:nil
                                                              emails:emails
                                                          emailTypes:nil
                                                    instantMessenger:nil
                                                                note:note
                                                           addresses:addresses
                                                        addressTypes:nil
                                                                 org:nil
                                                            birthday:nil
                                                               title:nil
                                                                urls:nil
                                                                 geo:nil];
}

- (NSArray *)matchMultipleValuePrefix:(NSString *)prefix max:(int)max rawText:(NSString *)rawText trim:(BOOL)trim {
  NSMutableArray *values = nil;

  for (int i = 1; i <= max; i++) {
    NSString *value = [[self class] matchSinglePrefixedField:[NSString stringWithFormat:@"%@%d:", prefix, i]
                                              rawText:rawText
                                              endChar:'\r'
                                                 trim:trim];
    if (value == nil) {
      break;
    }
    if (values == nil) {
      values = [[NSMutableArray alloc] initWithCapacity:max];
    }
    [values addObject:value];
  }

  if (values == nil) {
    return nil;
  }
  return values;
}

@end
