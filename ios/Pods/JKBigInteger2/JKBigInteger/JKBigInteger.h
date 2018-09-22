//
//  JKBigInteger.h
//  JKBigInteger
//
//  Created by Jānis Kiršteins on 5/21/13.
//  Copyright (c) 2013 Jānis Kiršteins. All rights reserved.
//

#import <Foundation/Foundation.h>
#include "tommath.h"

@interface JKBigInteger : NSObject <NSCoding>

- (id)initWithValue:(mp_int *)value;
- (mp_int *)value;

- (id)initWithUnsignedLong:(unsigned long)ul;
- (id)initWithString:(NSString *)string;
- (id)initWithString:(NSString *)string andRadix:(int)radix;
- (id)initWithCString:(char *)cString;
- (id)initWithCString:(char *)cString andRadix:(int)radix;

- (id)add:(JKBigInteger *)bigInteger;
- (id)subtract:(JKBigInteger *)bigInteger;
- (id)multiply:(JKBigInteger *)bigInteger;
- (id)divide:(JKBigInteger *)bigInteger;

- (id)remainder:(JKBigInteger *)bigInteger;
- (NSArray *)divideAndRemainder:(JKBigInteger *)bigInteger;

- (id)pow:(unsigned int)exponent;
- (id)pow:(JKBigInteger*)exponent andMod:(JKBigInteger*)modulus;
- (id)negate;
- (id)abs;

- (id)bitwiseXor:(JKBigInteger *)bigInteger;
- (id)bitwiseOr:(JKBigInteger *)bigInteger;
- (id)bitwiseAnd:(JKBigInteger *)bigInteger;
- (id)shiftLeft:(unsigned int)n;
- (id)shiftRight:(unsigned int)n;

- (id)gcd:(JKBigInteger *)bigInteger;

- (NSComparisonResult) compare:(JKBigInteger *)bigInteger;

- (unsigned long)unsignedIntValue;
- (NSString *)stringValue;
- (NSString *)stringValueWithRadix:(int)radix;

- (NSString *)description;

- (unsigned int)countBytes;
- (void)toByteArraySigned: (unsigned char*) byteArray;
- (void)toByteArrayUnsigned: (unsigned char*) byteArray;

@end
