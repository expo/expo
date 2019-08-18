//
//  JKBigInteger.m
//  JKBigInteger
//
//  Created by Jānis Kiršteins on 5/21/13.
//  Copyright (c) 2013 Jānis Kiršteins. All rights reserved.
//
#import "JKBigInteger.h"

@implementation JKBigInteger {
@private
    mp_int m_value;
}

- (id)initWithValue:(mp_int *)value {

    self = [super init];
	
    if (self) {
        mp_init_copy(&m_value, value);
    }
    
    return self;
}

- (mp_int *)value {
    return &m_value;
}

- (id)initWithUnsignedLong:(unsigned long)unsignedLong {

    self = [super init];
    
    if (self) {
        mp_set_int(&m_value, unsignedLong);
    }
    
    return self;
}

- (id)init {
    return [self initWithUnsignedLong:0];
}

- (id)initWithCString:(char *)cString andRadix:(int)radix {

    if (radix < 2 || radix > 64) {
        return nil;
    }
    
    self = [super init];
    
    if (self) {
        mp_init(&m_value);
        int result;
        result = mp_read_radix(&m_value, cString, radix);
        
        if (result != MP_OKAY) {
            mp_clear(&m_value);
            return nil;
        }
    }
    
    return self;
}
- (id)initWithCString:(char *)cString {
    
    int radix = 10;
    return [self initWithCString:cString andRadix:radix];
}

- (id)initWithString:(NSString *)string andRadix:(int)radix {
    return [self initWithCString:(char *)[string UTF8String] andRadix:radix];
}

- (id)initWithString:(NSString *)string {

    int radix = 10;
    return [self initWithCString:(char *)[string UTF8String] andRadix:radix];
}

- (id)initWithCoder:(NSCoder *)decoder {

    self = [super init];
    
    if (self) {
		int sign = [decoder decodeInt32ForKey:@"JKBigIntegerSign"];
		int alloc = [decoder decodeInt32ForKey:@"JKBigIntegerAlloc"];

		mp_init_size(&m_value, alloc);
		
		NSData *data = (NSData *)[decoder decodeObjectForKey:@"JKBigIntegerDP"];
        mp_digit *temp = (mp_digit *)[data bytes];
        
        for (unsigned int i = 0; i < alloc; ++i) {
			m_value.dp[i] = temp[i];
		}
		
		m_value.used = alloc;
		m_value.sign = sign;
    }

    return self;
}
- (void)encodeWithCoder:(NSCoder *)encoder {

    mp_clamp(&m_value);

    NSData *data = [NSData dataWithBytes:(const void *)m_value.dp
                                  length:m_value.alloc * sizeof(mp_digit)];

    [encoder encodeObject:data forKey:@"JKBigIntegerDP"];
    [encoder encodeInteger:m_value.alloc forKey:@"JKBigIntegerAlloc"];
    [encoder encodeInteger:m_value.sign forKey:@"JKBigIntegerSign"];
}

- (id)add:(JKBigInteger *)bigInteger {

    mp_int sum;
    mp_init(&sum);
    
    mp_add(&m_value, [bigInteger value], &sum);
    
    id newBigInteger = [[JKBigInteger alloc] initWithValue:&sum];
    mp_clear(&sum);
    
    return newBigInteger;
}

- (id)subtract:(JKBigInteger *)bigInteger {

    mp_int difference;
    mp_init(&difference);
    
    mp_sub(&m_value, [bigInteger value], &difference);
    
    id newBigInteger = [[JKBigInteger alloc] initWithValue:&difference];
    mp_clear(&difference);
    
    return newBigInteger;
}

- (id)multiply:(JKBigInteger *)bigInteger {

    mp_int product;
    mp_init(&product);
    
    mp_mul(&m_value, [bigInteger value], &product);
    
    JKBigInteger *newBigInteger = [[JKBigInteger alloc] initWithValue:&product];
    mp_clear(&product);
    
    return newBigInteger;
}

- (id)divide:(JKBigInteger *)bigInteger {

    int result;
    mp_int quotient;
    mp_init(&quotient);
    
    result = mp_div(&m_value, [bigInteger value], &quotient, NULL);
    if (result == MP_VAL) {
        mp_clear(&quotient);
        return nil;
    }
    
    JKBigInteger *newBigInteger = [[JKBigInteger alloc] initWithValue:&quotient];
    mp_clear(&quotient);
    
    return newBigInteger;
}

- (id)remainder:(JKBigInteger *)bigInteger {

    int result;
    mp_int remainder;
    mp_init(&remainder);
    
    result = mp_div(&m_value, [bigInteger value], NULL, &remainder);
    if (result == MP_VAL) {
        mp_clear(&remainder);
        return nil;
    }
    
    JKBigInteger *newBigInteger = [[JKBigInteger alloc] initWithValue:&remainder];
    mp_clear(&remainder);
    
    return newBigInteger;
}

- (NSArray *)divideAndRemainder:(JKBigInteger *)bigInteger {

    int result;
    mp_int quotient, remainder;
    mp_init_multi(&quotient, &remainder, NULL);
    
    result = mp_div(&m_value, [bigInteger value], &quotient, &remainder);
    if (result == MP_VAL) {
        mp_clear_multi(&quotient, &remainder, NULL);
        return nil;
    }
    
    JKBigInteger *quotientBigInteger = [[JKBigInteger alloc] initWithValue:&quotient];
    JKBigInteger *remainderBigInteger = [[JKBigInteger alloc] initWithValue:&remainder];
    mp_clear_multi(&quotient, &remainder, NULL);
    
    return @[quotientBigInteger, remainderBigInteger];
}

- (id)pow:(unsigned int)exponent {

    int result;
    mp_int power;
    mp_init(&power);
    
    result = mp_expt_d(&m_value, (mp_digit)exponent, &power);
    if (result == MP_VAL) {
        mp_clear(&power);
        return nil;
    }
    
    JKBigInteger *newBigInteger = [[JKBigInteger alloc] initWithValue:&power];
    mp_clear(&power);
    
    return newBigInteger;
}

- (id)pow:(JKBigInteger*)exponent andMod: (JKBigInteger*)modulus {

    int result;
    mp_int output;
    mp_init(&output);
    
    result = mp_exptmod(&m_value, &exponent->m_value, &modulus->m_value, &output);
    if (result == MP_VAL) {
        mp_clear(&output);
        return nil;
    }
    
    JKBigInteger *newBigInteger = [[JKBigInteger alloc] initWithValue:&output];
    mp_clear(&output);
    
    return newBigInteger;
}

- (id)negate {

    mp_int negate;
    mp_init(&negate);
    mp_neg(&m_value, &negate);
    
    JKBigInteger *newBigInteger = [[JKBigInteger alloc] initWithValue:&negate];
    mp_clear(&negate);
    
    return newBigInteger;
}

- (id)abs {

    mp_int absolute;
    mp_init(&absolute);
    mp_abs(&m_value, &absolute);
    
    JKBigInteger *newBigInteger = [[JKBigInteger alloc] initWithValue:&absolute];
    mp_clear(&absolute);
    
    return newBigInteger;
}

- (id)bitwiseXor:(JKBigInteger *)bigInteger {

    mp_int xor;
    mp_init(&xor);
    mp_xor(&m_value, [bigInteger value], &xor);
    
    JKBigInteger *newBigInteger = [[JKBigInteger alloc] initWithValue:&xor];
    mp_clear(&xor);
    
    return newBigInteger;
}

- (id)bitwiseOr:(JKBigInteger *)bigInteger {

    mp_int or;
    mp_init(&or);
    mp_or(&m_value, [bigInteger value], &or);
    
    JKBigInteger *newBigInteger = [[JKBigInteger alloc] initWithValue:&or];
    mp_clear(&or);
    
    return newBigInteger;
}

- (id)bitwiseAnd:(JKBigInteger *)bigInteger {

    mp_int and;
    mp_init(&and);
    mp_and(&m_value, [bigInteger value], &and);
    
    JKBigInteger *newBigInteger = [[JKBigInteger alloc] initWithValue:&and];
    mp_clear(&and);
    
    return newBigInteger;
}

- (id)shiftLeft:(unsigned int)n {

    mp_int lShift;
    mp_init(&lShift);
	mp_mul_2d(&m_value, n, &lShift);
	
    JKBigInteger *newBigInteger = [[JKBigInteger alloc] initWithValue:&lShift];
    mp_clear(&lShift);
    
    return newBigInteger;
}

- (id)shiftRight:(unsigned int)n {

    mp_int rShift;
    mp_init(&rShift);
    mp_div_2d(&m_value, n, &rShift, NULL);
    
    JKBigInteger *newBigInteger = [[JKBigInteger alloc] initWithValue:&rShift];
    mp_clear(&rShift);
    
    return newBigInteger;
}
- (id)gcd:(JKBigInteger *)bigInteger {

    int result;
    mp_int gcd;
    mp_init(&gcd);
    
    result = mp_gcd(&m_value, [bigInteger value], &gcd);
    if (result == MP_VAL) {
        mp_clear(&gcd);
        return nil;
    }
    
    JKBigInteger *newBigInteger = [[JKBigInteger alloc] initWithValue:&gcd];
    mp_clear(&gcd);
    
    return newBigInteger;
}

- (NSComparisonResult) compare:(JKBigInteger *)bigInteger {

    NSComparisonResult comparisonResult;
    comparisonResult = mp_cmp([bigInteger value], &m_value);
    
    switch (comparisonResult) {
        case MP_GT:
            return NSOrderedAscending;
        case MP_EQ:
            return NSOrderedSame;
        case MP_LT:
            return NSOrderedDescending;
        default:
            return 0;
    }
}

- (unsigned long)unsignedIntValue {
    return mp_get_int(&m_value);
}

- (NSString *)stringValue {

    int radix = 10;
    return [self stringValueWithRadix:radix];
}

- (NSString *)stringValueWithRadix:(int)radix {

    int stringSize;
    mp_radix_size(&m_value, radix, &stringSize);
    char cString[stringSize];
    mp_toradix(&m_value, cString, radix);
    
    for (int i = 0; i < stringSize; ++i) {
        cString[i] = (char)tolower(cString[i]);
    }
    
    return [NSString stringWithUTF8String:cString];
}

- (NSString *)description {
    return [self stringValue];
}

- (void)dealloc {
    mp_clear(&m_value);
}

/* Returns the number of bytes required to store this JKBigInteger as binary */
- (unsigned int)countBytes {
    return (unsigned int) mp_unsigned_bin_size(&m_value);
}

/* Retrieves the signed [big endian] format of this JKBigInteger */
- (void)toByteArraySigned: (unsigned char*) byteArray {
    mp_to_signed_bin(&m_value, byteArray);
}

/* Retrieves the unsigned [big endian] format of this JKBigInteger */
- (void)toByteArrayUnsigned: (unsigned char*) byteArray {
    mp_to_unsigned_bin(&m_value, byteArray);
}

@end
