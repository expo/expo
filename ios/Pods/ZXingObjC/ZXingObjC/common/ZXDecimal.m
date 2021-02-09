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

#include "ZXDecimal.h"

@interface ZXDecimal ()

@property (nonatomic, strong) NSString *value;

@end

@implementation ZXDecimal

- (id)initWithValue:(NSString *)value {
  if (self = [super init]) {
    self.value = value;
  }
  return self;
}

+ (ZXDecimal *)zero {
  return [[self alloc] initWithValue:@"0"];
}

+ (ZXDecimal *)decimalWithInt:(int)integer {
  return [[self alloc] initWithValue:[NSString stringWithFormat:@"%d", integer]];
}

+ (ZXDecimal *)decimalWithString:(NSString *)string {
  if (string.length == 0) {
    return [[self alloc] initWithValue:@"0"];
  } else {
    return [[self alloc] initWithValue:string];
  }
}

+ (ZXDecimal *)decimalWithDecimalNumber:(NSDecimalNumber *)decimalNumber {
  return [self decimalWithString:[decimalNumber stringValue]];
}

- (BOOL)isEqual:(id)object {
  if (object == self)
    return YES;
  if (!object || ![object isKindOfClass:[self class]])
    return NO;
  ZXDecimal *other = (ZXDecimal *)object;
  return [other.value isEqual:self.value];
}

// @see https://stackoverflow.com/a/22610446/5173688
- (NSString *)reversedString:(NSString *)string {
  NSUInteger length = [string length];
  if (length < 2) {
    return string;
  }
  
  NSStringEncoding encoding = NSHostByteOrder() == NS_BigEndian ? NSUTF32BigEndianStringEncoding : NSUTF32LittleEndianStringEncoding;
  NSUInteger utf32ByteCount = [string lengthOfBytesUsingEncoding:encoding];
  uint32_t *characters = malloc(utf32ByteCount);
  
  [string getBytes:characters maxLength:utf32ByteCount usedLength:NULL encoding:encoding options:0 range:NSMakeRange(0, length) remainingRange:NULL];
  
  NSUInteger utf32Length = utf32ByteCount / sizeof(uint32_t);
  NSUInteger halfwayPoint = utf32Length / 2;
  for (NSUInteger i = 0; i < halfwayPoint; ++i) {
    uint32_t character = characters[utf32Length - i - 1];
    characters[utf32Length - i - 1] = characters[i];
    characters[i] = character;
  }
  
  return [[NSString alloc] initWithBytesNoCopy:characters length:utf32ByteCount encoding:encoding freeWhenDone:YES];
}

- (int8_t *)intArrayFromString:(NSString *)string {
  NSUInteger length = [string length];
  if (length < 2) {
    int8_t *result = malloc(length * sizeof(int8_t));
    result[0] = [string intValue];
    return result;
  }

  NSStringEncoding encoding = NSHostByteOrder() == NS_BigEndian ? NSUTF32BigEndianStringEncoding : NSUTF32LittleEndianStringEncoding;
  NSUInteger utf32ByteCount = [string lengthOfBytesUsingEncoding:encoding];
  uint32_t *characters = malloc(utf32ByteCount);

  [string getBytes:characters maxLength:utf32ByteCount usedLength:NULL encoding:encoding options:0 range:NSMakeRange(0, length) remainingRange:NULL];

  int8_t *result = malloc(length * sizeof(int8_t));

  NSUInteger utf32Length = utf32ByteCount / sizeof(uint32_t);
  for (NSUInteger i = 0; i < utf32Length; ++i) {
    result[i] = (int) characters[i] - '0';
  }

  return result;
}

- (ZXDecimal *)decimalByMultiplyingBy:(ZXDecimal *)number {
  int leftLength = (int) _value.length;
  int rightLength = (int) number.value.length;
  int8_t *left = [self intArrayFromString:[self reversedString:_value]];
  int8_t *right = [self intArrayFromString:[self reversedString:number.value]];
  
  int length = (int) _value.length + (int) number.value.length;
  int8_t *result = calloc(length, sizeof(int8_t));
  
  for (int leftIndex = 0; leftIndex < leftLength; leftIndex++) {
    for (int rightIndex = 0; rightIndex < rightLength; rightIndex++) {
      int resultIndex = leftIndex + rightIndex;
      
      int leftValue = left[leftIndex];
      int rightValue = right[rightIndex];
      
      result[resultIndex] = leftValue * rightValue + (resultIndex >= length ? 0 : result[resultIndex]);
      
      if (result[resultIndex] > 9) {
        result[resultIndex + 1] = (result[resultIndex] / 10) + (resultIndex + 1 >= length ? 0 : result[resultIndex + 1]);
        result[resultIndex] -= (result[resultIndex] / 10) * 10;
      }
    }
  }
  
  free(left);
  free(right);
  
  NSMutableString *retVal = [NSMutableString string];
  for (int i = 0; i < length; i++) {
    if (result[i] == 0) {
      [retVal appendString:@"0"];
    } else {
      [retVal appendFormat:@"%d", result[i]];
    }
  }
  
  retVal = [[self reversedString:retVal] mutableCopy];
  // remove '0' prefixes
  while (retVal.length > 0 && [[retVal substringWithRange:NSMakeRange(0, 1)] isEqualToString:@"0"]) {
    retVal = [[retVal substringFromIndex:1] mutableCopy];
  }
  
  free(result);
  
  if (retVal.length == 0) {
    return [ZXDecimal decimalWithString:@"0"];
  }
  return [ZXDecimal decimalWithString:retVal];
}

- (ZXDecimal *)decimalByAdding:(ZXDecimal *)number {
  int leftLength = (int) _value.length;
  int rightLength = (int) number.value.length;
  
  int8_t *left = [self intArrayFromString:[self reversedString:_value]];
  int8_t *right = [self intArrayFromString:[self reversedString:number.value]];
  
  int length = rightLength + 1;
  if (leftLength > rightLength) {
    length = leftLength + 1;
  }
  
  int8_t *result = calloc(length, sizeof(int8_t));
  
  for (int i = 0; i < length - 1; i++) {
    int leftValue = leftLength > i ? left[i] : 0;
    int rightValue = rightLength > i ? right[i] : 0;
    
    int add = leftValue + rightValue + result[i];
    if (add >= 10) {
      result[i] = (add % 10);
      result[i + 1] = 1;
    } else {
      result[i] = add;
    }
  }
  
  free(left);
  free(right);
  
  NSMutableString *retVal = [NSMutableString string];
  for (int i = 0; i < length; i++) {
    [retVal appendFormat:@"%d", result[i]];
  }
  
  retVal = [[self reversedString:retVal] mutableCopy];
  // remove '0' prefixes
  while (retVal.length > 0 && [[retVal substringWithRange:NSMakeRange(0, 1)] isEqualToString:@"0"]) {
    retVal = [[retVal substringFromIndex:1] mutableCopy];
  }
  
  free(result);
  
  if (retVal.length == 0) {
    return [ZXDecimal decimalWithString:@"0"];
  }
  return [ZXDecimal decimalWithString:retVal];
}

@end
