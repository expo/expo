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

#import "ZXDataMatrixASCIIEncoder.h"
#import "ZXDataMatrixEncoderContext.h"
#import "ZXDataMatrixHighLevelEncoder.h"

@implementation ZXDataMatrixASCIIEncoder

- (int)encodingMode {
  return [ZXDataMatrixHighLevelEncoder asciiEncodation];
}

- (void)encode:(ZXDataMatrixEncoderContext *)context {
  //step B
  int n = [ZXDataMatrixHighLevelEncoder determineConsecutiveDigitCount:context.message startpos:context.pos];
  if (n >= 2) {
    [context writeCodeword:[self encodeASCIIDigits:[context.message characterAtIndex:context.pos]
                                            digit2:[context.message characterAtIndex:context.pos + 1]]];
    context.pos += 2;
  } else {
    unichar c = [context currentChar];
    int newMode = [ZXDataMatrixHighLevelEncoder lookAheadTest:context.message startpos:context.pos currentMode:[self encodingMode]];
    if (newMode != [self encodingMode]) {
      if (newMode == [ZXDataMatrixHighLevelEncoder base256Encodation]) {
        [context writeCodeword:[ZXDataMatrixHighLevelEncoder latchToBase256]];
        [context signalEncoderChange:[ZXDataMatrixHighLevelEncoder base256Encodation]];
        return;
      } else if (newMode == [ZXDataMatrixHighLevelEncoder c40Encodation]) {
        [context writeCodeword:[ZXDataMatrixHighLevelEncoder latchToC40]];
        [context signalEncoderChange:[ZXDataMatrixHighLevelEncoder c40Encodation]];
        return;
      } else if (newMode == [ZXDataMatrixHighLevelEncoder x12Encodation]) {
        [context writeCodeword:[ZXDataMatrixHighLevelEncoder latchToAnsiX12]];
        [context signalEncoderChange:[ZXDataMatrixHighLevelEncoder x12Encodation]];
      } else if (newMode == [ZXDataMatrixHighLevelEncoder textEncodation]) {
        [context writeCodeword:[ZXDataMatrixHighLevelEncoder latchToText]];
        [context signalEncoderChange:[ZXDataMatrixHighLevelEncoder textEncodation]];
      } else if (newMode == [ZXDataMatrixHighLevelEncoder edifactEncodation]) {
        [context writeCodeword:[ZXDataMatrixHighLevelEncoder latchToEdifact]];
        [context signalEncoderChange:[ZXDataMatrixHighLevelEncoder edifactEncodation]];
      } else {
        @throw [NSException exceptionWithName:@"IllegalStateException" reason:@"Illegal mode" userInfo:nil];
      }
    } else if ([ZXDataMatrixHighLevelEncoder isExtendedASCII:c]) {
      [context writeCodeword:[ZXDataMatrixHighLevelEncoder upperShift]];
      [context writeCodeword:(unichar)(c - 128 + 1)];
      context.pos++;
    } else {
      [context writeCodeword:(unichar)(c + 1)];
      context.pos++;
    }
  }
}

- (unichar)encodeASCIIDigits:(unichar)digit1 digit2:(unichar)digit2 {
  if ([ZXDataMatrixHighLevelEncoder isDigit:digit1] && [ZXDataMatrixHighLevelEncoder isDigit:digit2]) {
    int num = (digit1 - 48) * 10 + (digit2 - 48);
    return (unichar) (num + 130);
  }
  @throw [NSException exceptionWithName:NSInvalidArgumentException
                                 reason:[NSString stringWithFormat:@"not digits: %C %C", digit1, digit2]
                               userInfo:nil];
}

@end
