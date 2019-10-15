/*
 * Copyright 2013 ZXing authors
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

#import "ZXDataMatrixHighLevelEncoder.h"
#import "ZXDataMatrixTextEncoder.h"

@implementation ZXDataMatrixTextEncoder

- (int)encodingMode {
  return [ZXDataMatrixHighLevelEncoder textEncodation];
}

- (int)encodeChar:(unichar)c buffer:(NSMutableString *)sb {
  if (c == ' ') {
    [sb appendString:@"\3"];
    return 1;
  }
  if (c >= '0' && c <= '9') {
    [sb appendFormat:@"%C", (unichar) (c - 48 + 4)];
    return 1;
  }
  if (c >= 'a' && c <= 'z') {
    [sb appendFormat:@"%C", (unichar) (c - 97 + 14)];
    return 1;
  }
  if (c >= '\0' && c <= (unichar)0x001f) {
    [sb appendString:@"\0"]; //Shift 1 Set
    [sb appendFormat:@"%C", c];
    return 2;
  }
  if (c >= '!' && c <= '/') {
    [sb appendString:@"\1"]; //Shift 2 Set
    [sb appendFormat:@"%C", (unichar) (c - 33)];
    return 2;
  }
  if (c >= ':' && c <= '@') {
    [sb appendString:@"\1"]; //Shift 2 Set
    [sb appendFormat:@"%C", (unichar) (c - 58 + 15)];
    return 2;
  }
  if (c >= '[' && c <= '_') {
    [sb appendString:@"\1"]; //Shift 2 Set
    [sb appendFormat:@"%C", (unichar) (c - 91 + 22)];
    return 2;
  }
  if (c == '\u0060') {
    [sb appendString:@"\2"]; //Shift 3 Set
    [sb appendFormat:@"%C", (unichar) (c - 96)];
    return 2;
  }
  if (c >= 'A' && c <= 'Z') {
    [sb appendString:@"\2"]; //Shift 3 Set
    [sb appendFormat:@"%C", (unichar) (c - 65 + 1)];
    return 2;
  }
  if (c >= '{' && c <= (unichar)0x007f) {
    [sb appendString:@"\2"]; //Shift 3 Set
    [sb appendFormat:@"%C", (unichar) (c - 123 + 27)];
    return 2;
  }
  if (c >= (unichar)0x0080) {
    [sb appendFormat:@"\1%C", (unichar)0x001e]; //Shift 2, Upper Shift
    int len = 2;
    len += [self encodeChar:(unichar) (c - 128) buffer:sb];
    return len;
  }
  [ZXDataMatrixHighLevelEncoder illegalCharacter:c];
  return -1;
}

@end
