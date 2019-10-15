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

#import "ZXDataMatrixEncoderContext.h"
#import "ZXDataMatrixHighLevelEncoder.h"
#import "ZXDataMatrixSymbolInfo.h"
#import "ZXDataMatrixX12Encoder.h"

@implementation ZXDataMatrixX12Encoder

- (int)encodingMode {
  return [ZXDataMatrixHighLevelEncoder x12Encodation];
}

- (void)encode:(ZXDataMatrixEncoderContext *)context {
  //step C
  NSMutableString *buffer = [NSMutableString string];
  while ([context hasMoreCharacters]) {
    unichar c = [context currentChar];
    context.pos++;

    [self encodeChar:c buffer:buffer];

    NSUInteger count = buffer.length;
    if ((count % 3) == 0) {
      [self writeNextTriplet:context buffer:buffer];

      int newMode = [ZXDataMatrixHighLevelEncoder lookAheadTest:context.message startpos:context.pos currentMode:[self encodingMode]];
      if (newMode != [self encodingMode]) {
        // Return to ASCII encodation, which will actually handle latch to new mode
        [context signalEncoderChange:[ZXDataMatrixHighLevelEncoder asciiEncodation]];
        break;
      }
    }
  }
  [self handleEOD:context buffer:buffer];
}

- (int)encodeChar:(unichar)c buffer:(NSMutableString *)sb {
  if (c == '\r') {
    [sb appendString:@"\0"];
  } else if (c == '*') {
    [sb appendString:@"\1"];
  } else if (c == '>') {
    [sb appendString:@"\2"];
  } else if (c == ' ') {
    [sb appendString:@"\3"];
  } else if (c >= '0' && c <= '9') {
    [sb appendFormat:@"%C", (unichar) (c - 48 + 4)];
  } else if (c >= 'A' && c <= 'Z') {
    [sb appendFormat:@"%C", (unichar) (c - 65 + 14)];
  } else {
    [ZXDataMatrixHighLevelEncoder illegalCharacter:c];
  }
  return 1;
}

- (void)handleEOD:(ZXDataMatrixEncoderContext *)context buffer:(NSMutableString *)buffer {
  [context updateSymbolInfo];
  int available = context.symbolInfo.dataCapacity - [context codewordCount];
  int count = (int)buffer.length;
  context.pos -= count;
  if (context.remainingCharacters > 1 || available > 1 ||
      context.remainingCharacters != available) {
    [context writeCodeword:[ZXDataMatrixHighLevelEncoder x12Unlatch]];
  }
  if (context.newEncoding < 0) {
    [context signalEncoderChange:[ZXDataMatrixHighLevelEncoder asciiEncodation]];
  }
}

@end
