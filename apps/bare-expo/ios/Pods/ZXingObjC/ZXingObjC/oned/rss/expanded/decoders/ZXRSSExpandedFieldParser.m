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

#import "ZXErrors.h"
#import "ZXRSSExpandedFieldParser.h"

static NSObject *VARIABLE_LENGTH = nil;
static NSArray *TWO_DIGIT_DATA_LENGTH = nil;
static NSArray *THREE_DIGIT_DATA_LENGTH = nil;
static NSArray *THREE_DIGIT_PLUS_DIGIT_DATA_LENGTH = nil;
static NSArray *FOUR_DIGIT_DATA_LENGTH = nil;

@implementation ZXRSSExpandedFieldParser

+ (void)initialize {
  if ([self class] != [ZXRSSExpandedFieldParser class]) return;

  if (VARIABLE_LENGTH == nil) {
    VARIABLE_LENGTH = [[NSObject alloc] init];
  }

  if (TWO_DIGIT_DATA_LENGTH == nil) {
    TWO_DIGIT_DATA_LENGTH = @[@[@"00", @18],
                             @[@"01", @14],
                             @[@"02", @14],

                             @[@"10", VARIABLE_LENGTH, @20],
                             @[@"11", @6],
                             @[@"12", @6],
                             @[@"13", @6],
                             @[@"15", @6],
                             @[@"17", @6],

                             @[@"20", @2],
                             @[@"21", VARIABLE_LENGTH, @20],
                             @[@"22", VARIABLE_LENGTH, @29],

                             @[@"30", VARIABLE_LENGTH, @8],
                             @[@"37", VARIABLE_LENGTH, @8],

                             //internal company codes
                             @[@"90", VARIABLE_LENGTH, @30],
                             @[@"91", VARIABLE_LENGTH, @30],
                             @[@"92", VARIABLE_LENGTH, @30],
                             @[@"93", VARIABLE_LENGTH, @30],
                             @[@"94", VARIABLE_LENGTH, @30],
                             @[@"95", VARIABLE_LENGTH, @30],
                             @[@"96", VARIABLE_LENGTH, @30],
                             @[@"97", VARIABLE_LENGTH, @30],
                             @[@"98", VARIABLE_LENGTH, @30],
                             @[@"99", VARIABLE_LENGTH, @30]];
  }

  if (THREE_DIGIT_DATA_LENGTH == nil) {
    THREE_DIGIT_DATA_LENGTH = @[@[@"240", VARIABLE_LENGTH, @30],
                               @[@"241", VARIABLE_LENGTH, @30],
                               @[@"242", VARIABLE_LENGTH, @6],
                               @[@"250", VARIABLE_LENGTH, @30],
                               @[@"251", VARIABLE_LENGTH, @30],
                               @[@"253", VARIABLE_LENGTH, @17],
                               @[@"254", VARIABLE_LENGTH, @20],

                               @[@"400", VARIABLE_LENGTH, @30],
                               @[@"401", VARIABLE_LENGTH, @30],
                               @[@"402", @17],
                               @[@"403", VARIABLE_LENGTH, @30],
                               @[@"410", @13],
                               @[@"411", @13],
                               @[@"412", @13],
                               @[@"413", @13],
                               @[@"414", @13],
                               @[@"420", VARIABLE_LENGTH, @20],
                               @[@"421", VARIABLE_LENGTH, @15],
                               @[@"422", @3],
                               @[@"423", VARIABLE_LENGTH, @15],
                               @[@"424", @3],
                               @[@"425", @3],
                               @[@"426", @3]];

  }

  if (THREE_DIGIT_PLUS_DIGIT_DATA_LENGTH == nil) {
    THREE_DIGIT_PLUS_DIGIT_DATA_LENGTH = @[@[@"310", @6],
                                          @[@"311", @6],
                                          @[@"312", @6],
                                          @[@"313", @6],
                                          @[@"314", @6],
                                          @[@"315", @6],
                                          @[@"316", @6],
                                          @[@"320", @6],
                                          @[@"321", @6],
                                          @[@"322", @6],
                                          @[@"323", @6],
                                          @[@"324", @6],
                                          @[@"325", @6],
                                          @[@"326", @6],
                                          @[@"327", @6],
                                          @[@"328", @6],
                                          @[@"329", @6],
                                          @[@"330", @6],
                                          @[@"331", @6],
                                          @[@"332", @6],
                                          @[@"333", @6],
                                          @[@"334", @6],
                                          @[@"335", @6],
                                          @[@"336", @6],
                                          @[@"340", @6],
                                          @[@"341", @6],
                                          @[@"342", @6],
                                          @[@"343", @6],
                                          @[@"344", @6],
                                          @[@"345", @6],
                                          @[@"346", @6],
                                          @[@"347", @6],
                                          @[@"348", @6],
                                          @[@"349", @6],
                                          @[@"350", @6],
                                          @[@"351", @6],
                                          @[@"352", @6],
                                          @[@"353", @6],
                                          @[@"354", @6],
                                          @[@"355", @6],
                                          @[@"356", @6],
                                          @[@"357", @6],
                                          @[@"360", @6],
                                          @[@"361", @6],
                                          @[@"362", @6],
                                          @[@"363", @6],
                                          @[@"364", @6],
                                          @[@"365", @6],
                                          @[@"366", @6],
                                          @[@"367", @6],
                                          @[@"368", @6],
                                          @[@"369", @6],
                                          @[@"390", VARIABLE_LENGTH, @15],
                                          @[@"391", VARIABLE_LENGTH, @18],
                                          @[@"392", VARIABLE_LENGTH, @15],
                                          @[@"393", VARIABLE_LENGTH, @18],
                                          @[@"703", VARIABLE_LENGTH, @30]];
  }

  if (FOUR_DIGIT_DATA_LENGTH == nil) {
    FOUR_DIGIT_DATA_LENGTH = @[@[@"7001", @13],
                              @[@"7002", VARIABLE_LENGTH, @30],
                              @[@"7003", @10],

                              @[@"8001", @14],
                              @[@"8002", VARIABLE_LENGTH, @20],
                              @[@"8003", VARIABLE_LENGTH, @30],
                              @[@"8004", VARIABLE_LENGTH, @30],
                              @[@"8005", @6],
                              @[@"8006", @18],
                              @[@"8007", VARIABLE_LENGTH, @30],
                              @[@"8008", VARIABLE_LENGTH, @12],
                              @[@"8018", @18],
                              @[@"8020", VARIABLE_LENGTH, @25],
                              @[@"8100", @6],
                              @[@"8101", @10],
                              @[@"8102", @2],
                              @[@"8110", VARIABLE_LENGTH, @70],
                              @[@"8200", VARIABLE_LENGTH, @70]];
  }
}

+ (NSString *)parseFieldsInGeneralPurpose:(NSString *)rawInformation error:(NSError **)error {
  if ([rawInformation length] == 0) {
    return @"";
  }
  if ([rawInformation length] < 2) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }
  NSString *firstTwoDigits = [rawInformation substringWithRange:NSMakeRange(0, 2)];

  for (int i = 0; i < [TWO_DIGIT_DATA_LENGTH count]; ++i) {
    if ([TWO_DIGIT_DATA_LENGTH[i][0] isEqualToString:firstTwoDigits]) {
      if ([TWO_DIGIT_DATA_LENGTH[i][1] isEqual:VARIABLE_LENGTH]) {
        return [self processVariableAI:2
                     variableFieldSize:[TWO_DIGIT_DATA_LENGTH[i][2] intValue]
                        rawInformation:rawInformation];
      }
      NSString *result = [self processFixedAI:2
                                    fieldSize:[TWO_DIGIT_DATA_LENGTH[i][1] intValue]
                               rawInformation:rawInformation];
      if (!result) {
        if (error) *error = ZXNotFoundErrorInstance();
        return nil;
      }
      return result;
    }
  }

  if ([rawInformation length] < 3) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }
  NSString *firstThreeDigits = [rawInformation substringWithRange:NSMakeRange(0, 3)];

  for (int i = 0; i < [THREE_DIGIT_DATA_LENGTH count]; ++i) {
    if ([THREE_DIGIT_DATA_LENGTH[i][0] isEqualToString:firstThreeDigits]) {
      if ([THREE_DIGIT_DATA_LENGTH[i][1] isEqual:VARIABLE_LENGTH]) {
        return [self processVariableAI:3
                     variableFieldSize:[THREE_DIGIT_DATA_LENGTH[i][2] intValue]
                        rawInformation:rawInformation];
      }
      NSString *result = [self processFixedAI:3
                                    fieldSize:[THREE_DIGIT_DATA_LENGTH[i][1] intValue]
                               rawInformation:rawInformation];
      if (!result) {
        if (error) *error = ZXNotFoundErrorInstance();
        return nil;
      }
      return result;
    }
  }

  for (int i = 0; i < [THREE_DIGIT_PLUS_DIGIT_DATA_LENGTH count]; ++i) {
    if ([THREE_DIGIT_PLUS_DIGIT_DATA_LENGTH[i][0] isEqualToString:firstThreeDigits]) {
      if ([THREE_DIGIT_PLUS_DIGIT_DATA_LENGTH[i][1] isEqual:VARIABLE_LENGTH]) {
        return [self processVariableAI:4
                     variableFieldSize:[THREE_DIGIT_PLUS_DIGIT_DATA_LENGTH[i][2] intValue]
                        rawInformation:rawInformation];
      }
      NSString *result = [self processFixedAI:4
                                    fieldSize:[THREE_DIGIT_PLUS_DIGIT_DATA_LENGTH[i][1] intValue]
                               rawInformation:rawInformation];
      if (!result) {
        if (error) *error = ZXNotFoundErrorInstance();
        return nil;
      }
      return result;
    }
  }

  if ([rawInformation length] < 4) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }
  NSString *firstFourDigits = [rawInformation substringWithRange:NSMakeRange(0, 4)];

  for (int i = 0; i < [FOUR_DIGIT_DATA_LENGTH count]; ++i) {
    if ([FOUR_DIGIT_DATA_LENGTH[i][0] isEqualToString:firstFourDigits]) {
      if ([FOUR_DIGIT_DATA_LENGTH[i][1] isEqual:VARIABLE_LENGTH]) {
        NSString *result = [self processVariableAI:4
                                 variableFieldSize:[FOUR_DIGIT_DATA_LENGTH[i][2] intValue]
                                    rawInformation:rawInformation];
        if (!result) {
          if (error) *error = ZXNotFoundErrorInstance();
          return nil;
        }
        return result;
      }
      NSString *result = [self processFixedAI:4
                                    fieldSize:[FOUR_DIGIT_DATA_LENGTH[i][1] intValue]
                               rawInformation:rawInformation];
      if (!result) {
        if (error) *error = ZXNotFoundErrorInstance();
        return nil;
      }
      return result;
    }
  }

  if (error) *error = ZXNotFoundErrorInstance();
  return nil;
}

+ (NSString *)processFixedAI:(int)aiSize fieldSize:(int)fieldSize rawInformation:(NSString *)rawInformation {
  if ([rawInformation length] < aiSize) {
    return nil;
  }

  NSString *ai = [rawInformation substringWithRange:NSMakeRange(0, aiSize)];
  if ([rawInformation length] < aiSize + fieldSize) {
    return nil;
  }

  NSString *field = [rawInformation substringWithRange:NSMakeRange(aiSize, fieldSize)];
  NSString *remaining;
  if (aiSize + fieldSize == rawInformation.length) {
    remaining = @"";
  } else {
    remaining = [rawInformation substringFromIndex:aiSize + fieldSize];
  }

  NSString *result = [NSString stringWithFormat:@"(%@)%@", ai, field];
  NSString *parsedAI = [self parseFieldsInGeneralPurpose:remaining error:nil];
  return parsedAI == nil ? result : [result stringByAppendingString:parsedAI];
}

+ (NSString *)processVariableAI:(int)aiSize variableFieldSize:(int)variableFieldSize rawInformation:(NSString *)rawInformation {
  NSString *ai = [rawInformation substringWithRange:NSMakeRange(0, aiSize)];
  int maxSize;
  if ([rawInformation length] < aiSize + variableFieldSize) {
    maxSize = (int)[rawInformation length];
  } else {
    maxSize = aiSize + variableFieldSize;
  }
  NSString *field = [rawInformation substringWithRange:NSMakeRange(aiSize, maxSize - aiSize)];
  NSString *remaining = [rawInformation substringFromIndex:maxSize];
  NSString *result = [NSString stringWithFormat:@"(%@)%@", ai, field];
  NSString *parsedAI = [self parseFieldsInGeneralPurpose:remaining error:nil];
  return parsedAI == nil ? result : [result stringByAppendingString:parsedAI];
}

@end
