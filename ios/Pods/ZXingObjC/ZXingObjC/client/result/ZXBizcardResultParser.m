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
#import "ZXBizcardResultParser.h"
#import "ZXResult.h"

@implementation ZXBizcardResultParser

- (ZXParsedResult *)parse:(ZXResult *)result {
  NSString *rawText = [ZXResultParser massagedText:result];
  if (![rawText hasPrefix:@"BIZCARD:"]) {
    return nil;
  }
  NSString *firstName = [[self class] matchSingleDoCoMoPrefixedField:@"N:" rawText:rawText trim:YES];
  NSString *lastName = [[self class] matchSingleDoCoMoPrefixedField:@"X:" rawText:rawText trim:YES];
  NSString *fullName = [self buildName:firstName lastName:lastName];
  NSString *title = [[self class] matchSingleDoCoMoPrefixedField:@"T:" rawText:rawText trim:YES];
  NSString *org = [[self class] matchSingleDoCoMoPrefixedField:@"C:" rawText:rawText trim:YES];
  NSArray *addresses = [[self class] matchDoCoMoPrefixedField:@"A:" rawText:rawText trim:YES];
  NSString *phoneNumber1 = [[self class] matchSingleDoCoMoPrefixedField:@"B:" rawText:rawText trim:YES];
  NSString *phoneNumber2 = [[self class] matchSingleDoCoMoPrefixedField:@"M:" rawText:rawText trim:YES];
  NSString *phoneNumber3 = [[self class] matchSingleDoCoMoPrefixedField:@"F:" rawText:rawText trim:YES];
  NSString *email = [[self class] matchSingleDoCoMoPrefixedField:@"E:" rawText:rawText trim:YES];

  return [ZXAddressBookParsedResult addressBookParsedResultWithNames:[self maybeWrap:fullName]
                                                           nicknames:nil
                                                       pronunciation:nil
                                                        phoneNumbers:[self buildPhoneNumbers:phoneNumber1 number2:phoneNumber2 number3:phoneNumber3]
                                                          phoneTypes:nil
                                                              emails:[self maybeWrap:email]
                                                          emailTypes:nil
                                                    instantMessenger:nil
                                                                note:nil
                                                           addresses:addresses
                                                        addressTypes:nil
                                                                 org:org
                                                            birthday:nil
                                                               title:title
                                                                urls:nil
                                                                 geo:nil];
}

- (NSArray *)buildPhoneNumbers:(NSString *)number1 number2:(NSString *)number2 number3:(NSString *)number3 {
  NSMutableArray *numbers = [NSMutableArray arrayWithCapacity:3];
  if (number1 != nil) {
    [numbers addObject:number1];
  }
  if (number2 != nil) {
    [numbers addObject:number2];
  }
  if (number3 != nil) {
    [numbers addObject:number3];
  }
  NSUInteger size = [numbers count];
  if (size == 0) {
    return nil;
  }
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:size];
  for (int i = 0; i < size; i++) {
    [result addObject:numbers[i]];
  }
  return result;
}

- (NSString *)buildName:(NSString *)firstName lastName:(NSString *)lastName {
  if (firstName == nil) {
    return lastName;
  } else {
    return lastName == nil ? firstName : [[firstName stringByAppendingString:@" "] stringByAppendingString:lastName];
  }
}

@end
