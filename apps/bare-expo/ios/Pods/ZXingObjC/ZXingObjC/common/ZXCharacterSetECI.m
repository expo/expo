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

#import "ZXCharacterSetECI.h"
#import "ZXErrors.h"

static NSMutableDictionary *VALUE_TO_ECI = nil;
static NSMutableDictionary *ENCODING_TO_ECI = nil;

@implementation ZXCharacterSetECI

+ (void)initialize {
  if ([self class] != [ZXCharacterSetECI class]) return;

  VALUE_TO_ECI = [[NSMutableDictionary alloc] initWithCapacity:29];
  ENCODING_TO_ECI = [[NSMutableDictionary alloc] initWithCapacity:29];
  [self addCharacterSet:0 encoding:(NSStringEncoding) 0x80000400];
  [self addCharacterSet:1 encoding:NSISOLatin1StringEncoding];
  [self addCharacterSet:2 encoding:(NSStringEncoding) 0x80000400];
  [self addCharacterSet:3 encoding:NSISOLatin1StringEncoding];
  [self addCharacterSet:4 encoding:NSISOLatin2StringEncoding];
  [self addCharacterSet:5 encoding:(NSStringEncoding) 0x80000203];
  [self addCharacterSet:6 encoding:(NSStringEncoding) 0x80000204];
  [self addCharacterSet:7 encoding:(NSStringEncoding) 0x80000205];
  [self addCharacterSet:8 encoding:(NSStringEncoding) 0x80000206];
  [self addCharacterSet:9 encoding:(NSStringEncoding) 0x80000207];
  [self addCharacterSet:10 encoding:(NSStringEncoding) 0x80000208];
  [self addCharacterSet:11 encoding:(NSStringEncoding) 0x80000209];
  [self addCharacterSet:12 encoding:(NSStringEncoding) 0x8000020A];
  [self addCharacterSet:13 encoding:(NSStringEncoding) 0x8000020B];
  [self addCharacterSet:15 encoding:(NSStringEncoding) 0x8000020D];
  [self addCharacterSet:16 encoding:(NSStringEncoding) 0x8000020E];
  [self addCharacterSet:17 encoding:(NSStringEncoding) 0x8000020F];
  [self addCharacterSet:18 encoding:(NSStringEncoding) 0x80000210];
  [self addCharacterSet:20 encoding:NSShiftJISStringEncoding];
  [self addCharacterSet:21 encoding:NSWindowsCP1250StringEncoding];
  [self addCharacterSet:22 encoding:NSWindowsCP1251StringEncoding];
  [self addCharacterSet:23 encoding:NSWindowsCP1252StringEncoding];
  [self addCharacterSet:24 encoding:(NSStringEncoding) 0x80000505];
  [self addCharacterSet:25 encoding:NSUTF16BigEndianStringEncoding];
  [self addCharacterSet:26 encoding:NSUTF8StringEncoding];
  [self addCharacterSet:27 encoding:NSASCIIStringEncoding];
  [self addCharacterSet:28 encoding:(NSStringEncoding) 0x80000A03];
  [self addCharacterSet:29 encoding:(NSStringEncoding) 0x80000632];
  [self addCharacterSet:30 encoding:(NSStringEncoding) 0x80000940];
  [self addCharacterSet:170 encoding:NSASCIIStringEncoding];
}

- (id)initWithValue:(int)value encoding:(NSStringEncoding)encoding {
  if (self = [super init]) {
    _value = value;
    _encoding = encoding;
  }

  return self;
}

+ (void)addCharacterSet:(int)value encoding:(NSStringEncoding)encoding {
  ZXCharacterSetECI *eci = [[ZXCharacterSetECI alloc] initWithValue:value encoding:encoding];
  VALUE_TO_ECI[@(value)] = eci;
  ENCODING_TO_ECI[@(encoding)] = eci;
}

+ (ZXCharacterSetECI *)characterSetECIByValue:(int)value {
  if (VALUE_TO_ECI == nil) {
    [self initialize];
  }
  if (value < 0 || value >= 900) {
    return nil;
  }
  return VALUE_TO_ECI[@(value)];
}

+ (ZXCharacterSetECI *)characterSetECIByEncoding:(NSStringEncoding)encoding {
  if (ENCODING_TO_ECI == nil) {
    [self initialize];
  }
  return ENCODING_TO_ECI[@(encoding)];
}

@end
