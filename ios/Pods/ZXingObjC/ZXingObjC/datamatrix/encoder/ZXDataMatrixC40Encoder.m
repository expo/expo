/*
 * Copyright 2013 9 authors
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

#import "ZXDataMatrixC40Encoder.h"
#import "ZXDataMatrixEncoderContext.h"
#import "ZXDataMatrixHighLevelEncoder.h"
#import "ZXDataMatrixSymbolInfo.h"

@implementation ZXDataMatrixC40Encoder

- (int)encodingMode {
  return [ZXDataMatrixHighLevelEncoder c40Encodation];
}

- (void)encode:(ZXDataMatrixEncoderContext *)context {
  //step C
  NSMutableString *buffer = [NSMutableString string];
  while ([context hasMoreCharacters]) {
    unichar c = [context currentChar];
    context.pos++;

    int lastCharSize = [self encodeChar:c buffer:buffer];

    int unwritten = ((int)buffer.length / 3) * 2;

    int curCodewordCount = context.codewordCount + unwritten;
    [context updateSymbolInfoWithLength:curCodewordCount];
    int available = context.symbolInfo.dataCapacity - curCodewordCount;

    if (![context hasMoreCharacters]) {
      //Avoid having a single C40 value in the last triplet
      NSMutableString *removed = [NSMutableString string];
      if ((buffer.length % 3) == 2) {
        if (available < 2 || available > 2) {
          lastCharSize = [self backtrackOneCharacter:context buffer:buffer removed:removed lastCharSize:lastCharSize];
        }
      }
      while ((buffer.length % 3) == 1 && (lastCharSize > 3 || available != 1)) {
        lastCharSize = [self backtrackOneCharacter:context buffer:buffer removed:removed lastCharSize:lastCharSize];
      }
      break;
    }

    NSUInteger count = buffer.length;
    if ((count % 3) == 0) {
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

- (int)backtrackOneCharacter:(ZXDataMatrixEncoderContext *)context buffer:(NSMutableString *)buffer
                     removed:(NSMutableString *)removed lastCharSize:(int)lastCharSize {
  NSUInteger count = buffer.length;
  [buffer deleteCharactersInRange:NSMakeRange(count - lastCharSize, lastCharSize)];
  context.pos--;
  unichar c = context.currentChar;
  lastCharSize = [self encodeChar:c buffer:removed];
  [context resetSymbolInfo]; //Deal with possible reduction in symbol size
  return lastCharSize;
}

- (void)writeNextTriplet:(ZXDataMatrixEncoderContext *)context buffer:(NSMutableString *)buffer {
  [context writeCodewords:[self encodeToCodewords:buffer startpos:0]];
  [buffer deleteCharactersInRange:NSMakeRange(0, 3)];
}

/**
 * Handle "end of data" situations
 */
- (void)handleEOD:(ZXDataMatrixEncoderContext *)context buffer:(NSMutableString *)buffer {
  int unwritten = ((int)buffer.length / 3) * 2;
  int rest = buffer.length % 3;

  int curCodewordCount = context.codewordCount + unwritten;
  [context updateSymbolInfoWithLength:curCodewordCount];
  int available = context.symbolInfo.dataCapacity - curCodewordCount;

  if (rest == 2) {
    [buffer appendString:@"\0"]; //Shift 1
    while (buffer.length >= 3) {
      [self writeNextTriplet:context buffer:buffer];
    }
    if ([context hasMoreCharacters]) {
      [context writeCodeword:[ZXDataMatrixHighLevelEncoder c40Unlatch]];
    }
  } else if (available == 1 && rest == 1) {
    while (buffer.length >= 3) {
      [self writeNextTriplet:context buffer:buffer];
    }
    if ([context hasMoreCharacters]) {
      [context writeCodeword:[ZXDataMatrixHighLevelEncoder c40Unlatch]];
    }
    // else no latch
    context.pos--;
  } else if (rest == 0) {
    while (buffer.length >= 3) {
      [self writeNextTriplet:context buffer:buffer];
    }
    if (available > 0 || [context hasMoreCharacters]) {
      [context writeCodeword:[ZXDataMatrixHighLevelEncoder c40Unlatch]];
    }
  } else {
    @throw [NSException exceptionWithName:@"IllegalStateException"
                                   reason:@"Unexpected case. Please report!"
                                 userInfo:nil];
  }
  [context signalEncoderChange:[ZXDataMatrixHighLevelEncoder asciiEncodation]];
}

- (int)encodeChar:(unichar)c buffer:(NSMutableString *)sb {
  if (c == ' ') {
    [sb appendString:@"\3"];
    return 1;
  } else if (c >= '0' && c <= '9') {
    [sb appendFormat:@"%C", (unichar) (c - 48 + 4)];
    return 1;
  } else if (c >= 'A' && c <= 'Z') {
    [sb appendFormat:@"%C", (unichar) (c - 65 + 14)];
    return 1;
  } else if (c >= '\0' && c <= (unichar)0x001f) {
    [sb appendString:@"\0"]; //Shift 1 Set
    [sb appendFormat:@"%C", c];
    return 2;
  } else if (c >= '!' && c <= '/') {
    [sb appendString:@"\1"]; //Shift 2 Set
    [sb appendFormat:@"%C", (unichar) (c - 33)];
    return 2;
  } else if (c >= ':' && c <= '@') {
    [sb appendString:@"\1"]; //Shift 2 Set
    [sb appendFormat:@"%C", (unichar) (c - 58 + 15)];
    return 2;
  } else if (c >= '[' && c <= '_') {
    [sb appendString:@"\1"]; //Shift 2 Set
    [sb appendFormat:@"%C", (unichar) (c - 91 + 22)];
    return 2;
  } else if (c >= '\u0060' && c <= (unichar)0x007f) {
    [sb appendString:@"\2"]; //Shift 3 Set
    [sb appendFormat:@"%C", (unichar) (c - 96)];
    return 2;
  } else if (c >= (unichar)0x0080) {
    [sb appendFormat:@"\1%C", (unichar)0x001e]; //Shift 2, Upper Shift
    int len = 2;
    len += [self encodeChar:(unichar) (c - 128) buffer:sb];
    return len;
  } else {
    @throw [NSException exceptionWithName:@"IllegalStateException"
                                   reason:[NSString stringWithFormat:@"Illegal character: %C", c]
                                 userInfo:nil];
  }
}

- (NSString *)encodeToCodewords:(NSString *)sb startpos:(int)startPos {
  unichar c1 = [sb characterAtIndex:startPos];
  unichar c2 = [sb characterAtIndex:startPos + 1];
  unichar c3 = [sb characterAtIndex:startPos + 2];
  int v = (1600 * c1) + (40 * c2) + c3 + 1;
  unichar cw1 = (unichar) (v / 256);
  unichar cw2 = (unichar) (v % 256);
  return [NSString stringWithFormat:@"%C%C", cw1, cw2];
}

@end
