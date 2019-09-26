/* Copyright (c) 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#if !__has_feature(objc_arc)
#error "This file needs to be compiled with ARC enabled."
#endif

#import "GTLRDuration.h"

static const int32_t kNanosPerMillisecond = 1000000;
static const int32_t kNanosPerMicrosecond = 1000;
static const int32_t kNanosPerSecond = 1000000000;

static int32_t IntPow10(int x) {
  int32_t result = 1;
  for (int i = 0; i < x; ++i) {
    result *= 10;
  }
  return result;
}

@implementation GTLRDuration

@dynamic timeInterval;

@synthesize seconds = _seconds,
            nanos = _nanos,
            jsonString = _jsonString;

+ (instancetype)durationWithSeconds:(int64_t)seconds nanos:(int32_t)nanos {
  if (seconds < 0) {
    if (nanos > 0) {
      // secs was -, nanos was +
      return nil;
    }
  } else if (seconds > 0) {
    if (nanos < 0) {
      // secs was +, nanos was -
      return nil;
    }
  }
  if ((nanos <= -kNanosPerSecond) || (nanos >= kNanosPerSecond)) {
    // more than a seconds worth
    return nil;
  }
  return [[self alloc] initWithSeconds:seconds nanos:nanos jsonString:NULL];
}

+ (instancetype)durationWithJSONString:(NSString *)jsonString {
  // It has to end in "s", so it needs >1 character.
  if (jsonString.length <= 1) {
    return nil;
  }

  static NSCharacterSet *gNumberSet;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    gNumberSet = [NSCharacterSet characterSetWithCharactersInString:@"0123456789"];
  });

  NSScanner* scanner = [NSScanner scannerWithString:jsonString];
  // There should be no whitespace, so no skip characters.
  [scanner setCharactersToBeSkipped:nil];

  // Can start with a '-'.
  BOOL isNeg = [scanner scanString:@"-" intoString:NULL];

  int64_t seconds;
  if (![scanner scanLongLong:&seconds]) {
    return nil;
  }

  // Since the sign was manually scanned, seconds should be positive
  // (i.e. no "--#" in the put).
  if (seconds < 0) {
    return nil;
  }

  // See if it has a ".[nanos]".  Spec seems to say it is required, but play
  // it safe and make it optional.
  int32_t nanos = 0;
  if ([scanner scanString:@"." intoString:NULL]) {
    NSString *nanosStr;
    if (![scanner scanCharactersFromSet:gNumberSet intoString:&nanosStr]) {
      return nil;
    }
    // Ensure not too many digits (also ensure it is within range).
    if (nanosStr.length > 9) {
      return nil;
    }
    // Can use NSString's intValue since the character set was controlled.
    nanos = [nanosStr intValue];
    // Scale based on length.
    nanos *= IntPow10(9 - (int)nanosStr.length);
  }

  // And must have the final 's'.
  if (![scanner scanString:@"s" intoString:NULL]) {
    return nil;
  }

  // Better be the end...
  if (![scanner isAtEnd]) {
    return nil;
  }

  if (isNeg) {
    seconds = -seconds;
    nanos = -nanos;
  }

  // Pass on the json string so it will be reflected back out as it came in
  // (incase it had a different number of digits, etc).
  return [[self alloc] initWithSeconds:seconds
                                 nanos:nanos
                            jsonString:jsonString];
}

+ (instancetype)durationWithTimeInterval:(NSTimeInterval)timeInterval {
  NSTimeInterval seconds;
  NSTimeInterval nanos = modf(timeInterval, &seconds);
  nanos *= (NSTimeInterval)kNanosPerSecond;

  return [[self alloc] initWithSeconds:(int64_t)seconds
                                 nanos:(int32_t)nanos
                            jsonString:NULL];
}

- (instancetype)init {
  return [self initWithSeconds:0 nanos:0 jsonString:NULL];
}

- (instancetype)initWithSeconds:(int64_t)seconds
                          nanos:(int32_t)nanos
                     jsonString:(NSString *)jsonString {
  self = [super init];
  if (self) {
    // Sanity asserts, the class methods should make sure this doesn't happen.
    GTLR_DEBUG_ASSERT((((seconds <= 0) && (nanos <= 0)) ||
                       ((seconds >= 0) && (nanos >= 0))),
                      @"Seconds and nanos must have the same sign (%lld & %d)",
                      seconds, nanos);
    GTLR_DEBUG_ASSERT(((nanos < kNanosPerSecond) &&
                       (nanos > -kNanosPerSecond)),
                      @"Nanos is a second or more (%d)", nanos);

    _seconds = seconds;
    _nanos = nanos;

    if (jsonString.length) {
      _jsonString = [jsonString copy];
    } else {
      // Based off the JSON serialization code in protocol buffers
      // ( https://github.com/google/protobuf/ ).
      NSString *sign = @"";
      if ((seconds < 0) || (nanos < 0)) {
        sign = @"-";
        seconds = -seconds;
        nanos = -nanos;
      }
      int nanoDigts;
      int32_t nanoDivider;
      if (nanos % kNanosPerMillisecond == 0) {
        nanoDigts = 3;
        nanoDivider = kNanosPerMillisecond;
      } else if (nanos % kNanosPerMicrosecond == 0) {
        nanoDigts = 6;
        nanoDivider = kNanosPerMicrosecond;
      } else {
        nanoDigts = 9;
        nanoDivider = 1;
      }
      _jsonString = [NSString stringWithFormat:@"%@%lld.%0*ds",
                     sign, seconds, nanoDigts, (nanos / nanoDivider)];
    }
  }
  return self;
}

- (NSTimeInterval)timeInterval {
  NSTimeInterval result = self.seconds;
  result += (NSTimeInterval)self.nanos / (NSTimeInterval)kNanosPerSecond;
  return result;
}

- (id)copyWithZone:(NSZone *)zone {
  // Object is immutable
  return self;
}

- (BOOL)isEqual:(GTLRDuration *)other {
  if (self == other) return YES;
  if (![other isKindOfClass:[GTLRDuration class]]) return NO;

  BOOL result = ((self.seconds == other.seconds) &&
                 (self.nanos == other.nanos));
  return result;
}

- (NSUInteger)hash {
  NSUInteger result = (NSUInteger)((self.seconds * 13) + self.nanos);
  return result;
}

- (NSString *)description {
  return [NSString stringWithFormat:@"%@ %p: {%@}",
          [self class], self, self.jsonString];
}

@end
