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

#import "ZXDataMatrixBase256Encoder.h"
#import "ZXDataMatrixEncoderContext.h"
#import "ZXDataMatrixHighLevelEncoder.h"
#import "ZXDataMatrixSymbolInfo.h"

@implementation ZXDataMatrixBase256Encoder

- (int)encodingMode {
  return [ZXDataMatrixHighLevelEncoder base256Encodation];
}

- (void)encode:(ZXDataMatrixEncoderContext *)context {
  NSMutableString *buffer = [NSMutableString string];
  [buffer appendString:@"\0"]; //Initialize length field
  while ([context hasMoreCharacters]) {
    unichar c = [context currentChar];
    [buffer appendFormat:@"%C", c];

    context.pos++;

    int newMode = [ZXDataMatrixHighLevelEncoder lookAheadTest:context.message startpos:context.pos currentMode:[self encodingMode]];
    if (newMode != [self encodingMode]) {
      // Return to ASCII encodation, which will actually handle latch to new mode
      [context signalEncoderChange:[ZXDataMatrixHighLevelEncoder asciiEncodation]];
      break;
    }
  }
  int dataCount = (int)buffer.length - 1;
  int lengthFieldSize = 1;
  int currentSize = [context codewordCount] + dataCount + lengthFieldSize;
  [context updateSymbolInfoWithLength:currentSize];
  BOOL mustPad = (context.symbolInfo.dataCapacity - currentSize) > 0;
  if ([context hasMoreCharacters] || mustPad) {
    if (dataCount <= 249) {
      [buffer replaceCharactersInRange:NSMakeRange(0, 1)
                            withString:[NSString stringWithFormat:@"%C", (unichar) dataCount]];
    } else if (dataCount > 249 && dataCount <= 1555) {
      [buffer replaceCharactersInRange:NSMakeRange(0, 1)
                            withString:[NSString stringWithFormat:@"%C", (unichar) ((dataCount / 250) + 249)]];
      [buffer insertString:[NSString stringWithFormat:@"%C", (unichar) (dataCount % 250)]
                   atIndex:1];
    } else {
      @throw [NSException exceptionWithName:@"IllegalStateException"
                                     reason:[NSString stringWithFormat:@"Message length not in valid ranges: %d", dataCount]
                                   userInfo:nil];
    }
  }
  for (int i = 0, c = (int)buffer.length; i < c; i++) {
    [context writeCodeword:[self randomize255State:[buffer characterAtIndex:i] codewordPosition:context.codewordCount + 1]];
  }
}

- (unichar)randomize255State:(unichar)ch codewordPosition:(int)codewordPosition {
  int pseudoRandom = ((149 * codewordPosition) % 255) + 1;
  int tempVariable = ch + pseudoRandom;
  if (tempVariable <= 255) {
    return (unichar) tempVariable;
  } else {
    return (unichar) (tempVariable - 256);
  }
}

@end
