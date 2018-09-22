//
//  JKBigDecimal.m
//  JKBigInteger
//
//  Created by Midfar Sun on 5/4/15.
//  Copyright (c) 2015 Midfar Sun. All rights reserved.
//

#import "JKBigDecimal.h"

@implementation JKBigDecimal
@synthesize bigInteger, figure;

- (id)init
{
    return [self initWithString:@"0"];
}

- (id)initWithString:(NSString *)string
{
    self = [super init];
    if (self) {
        figure = 0;
        if ([string containsString:@"."]) {
            NSRange range = [string rangeOfString:@"."];
            figure = string.length-range.location-range.length;
            string = [string stringByReplacingCharactersInRange:range withString:@""];
        }
        bigInteger = [[JKBigInteger alloc] initWithString:string];
    }
    return self;
}

+ (id)decimalWithString:(NSString *)string
{
    return [[JKBigDecimal alloc] initWithString:string];
}

-(id)initWithBigInteger:(JKBigInteger *)i figure:(NSInteger)f
{
    self = [super init];
    if (self) {
        bigInteger = i;
        figure = f;
    }
    return self;
}

- (instancetype)initWithCoder:(NSCoder *)decoder
{
    self = [super init];
    if (self) {
        bigInteger = [[JKBigInteger alloc] initWithCoder:decoder];
        figure = [decoder decodeInt32ForKey:@"JKBigDecimalFigure"];
    }
    return self;
}
-(void)encodeWithCoder:(NSCoder *)encoder
{
    [bigInteger encodeWithCoder:encoder];
    [encoder encodeInteger:figure forKey:@"JKBigDecimalFigure"];
}

- (id)add:(JKBigDecimal *)bigDecimal
{
    NSInteger maxFigure = 0;
    if (figure>=bigDecimal.figure) {
        maxFigure = figure;
        NSInteger exponent = maxFigure-bigDecimal.figure;
        JKBigInteger *mInteger = [[JKBigInteger alloc] initWithString:@"10"];
        JKBigInteger *newInteger = [mInteger pow:(unsigned int)exponent];
        bigDecimal.bigInteger = [bigDecimal.bigInteger multiply:newInteger];
        bigDecimal.figure = maxFigure;
        
    }else{
        maxFigure = bigDecimal.figure;
        NSInteger exponent = maxFigure-figure;
        JKBigInteger *mInteger = [[JKBigInteger alloc] initWithString:@"10"];
        JKBigInteger *newInteger = [mInteger pow:(unsigned int)exponent];
        bigInteger = [bigInteger multiply:newInteger];
        figure = maxFigure;
        
    }
    JKBigInteger *newBigInteger = [bigInteger add:bigDecimal.bigInteger];
    JKBigDecimal *newBigDecimal = [[JKBigDecimal alloc] initWithBigInteger:newBigInteger figure:maxFigure];
    return newBigDecimal;
}

- (id)subtract:(JKBigDecimal *)bigDecimal
{
    NSInteger maxFigure = 0;
    if (figure>=bigDecimal.figure) {
        maxFigure = figure;
        NSInteger exponent = maxFigure-bigDecimal.figure;
        JKBigInteger *mInteger = [[JKBigInteger alloc] initWithString:@"10"];
        JKBigInteger *newInteger = [mInteger pow:(unsigned int)exponent];
        bigDecimal.bigInteger = [bigDecimal.bigInteger multiply:newInteger];
        bigDecimal.figure = maxFigure;
        
    }else{
        maxFigure = bigDecimal.figure;
        NSInteger exponent = maxFigure-figure;
        JKBigInteger *mInteger = [[JKBigInteger alloc] initWithString:@"10"];
        JKBigInteger *newInteger = [mInteger pow:(unsigned int)exponent];
        bigInteger = [bigDecimal.bigInteger multiply:newInteger];
        figure = maxFigure;
        
    }
    JKBigInteger *newBigInteger = [bigInteger subtract:bigDecimal.bigInteger];
    JKBigDecimal *newBigDecimal = [[JKBigDecimal alloc] initWithBigInteger:newBigInteger figure:maxFigure];
    return newBigDecimal;
}

- (id)multiply:(JKBigDecimal *)bigDecimal
{
    NSInteger totalFigure = figure+bigDecimal.figure;
    JKBigInteger *newBigInteger = [bigInteger multiply:bigDecimal.bigInteger];
    JKBigDecimal *newBigDecimal = [[JKBigDecimal alloc] initWithBigInteger:newBigInteger figure:totalFigure];
    return newBigDecimal;
}

- (id)divide:(JKBigDecimal *)bigDecimal
{
    NSInteger totalFigure = figure-bigDecimal.figure;
    if (totalFigure<0) {
        NSInteger exponent = -totalFigure;
        totalFigure=0;
        JKBigInteger *mInteger = [[JKBigInteger alloc] initWithString:@"10"];
        JKBigInteger *newInteger = [mInteger pow:(unsigned int)exponent];
        bigInteger = [bigInteger multiply:newInteger];
    }
    JKBigInteger *newBigInteger = [bigInteger divide:bigDecimal.bigInteger];
    JKBigDecimal *newBigDecimal = [[JKBigDecimal alloc] initWithBigInteger:newBigInteger figure:totalFigure];
    return newBigDecimal;
}

- (id)remainder:(JKBigDecimal *)bigDecimal
{
    NSInteger totalFigure = figure-bigDecimal.figure;
    if (totalFigure<0) {
        NSInteger exponent = -totalFigure;
        totalFigure=0;
        JKBigInteger *mInteger = [[JKBigInteger alloc] initWithString:@"10"];
        JKBigInteger *newInteger = [mInteger pow:(unsigned int)exponent];
        bigInteger = [bigInteger multiply:newInteger];
    }
    JKBigInteger *newBigInteger = [bigInteger remainder:bigDecimal.bigInteger];
    JKBigDecimal *newBigDecimal = [[JKBigDecimal alloc] initWithBigInteger:newBigInteger figure:bigDecimal.figure];
    return newBigDecimal;
}

//- (NSArray *)divideAndRemainder:(JKBigDecimal *)bigInteger
//{
//    
//}

-(NSComparisonResult) compare:(JKBigDecimal *)other {
    JKBigDecimal *tens = [[JKBigDecimal alloc] initWithString:@"10"];
    JKBigInteger *scaledNum;
    JKBigInteger *scaledCompareTo;
    
    if (figure > other.figure){
        tens = [tens pow:(int)figure];
    } else {
        tens = [tens pow:(int)other.figure];
    }
    //scale my value to integer value
    scaledNum = [[JKBigInteger alloc] initWithString:[[self multiply:tens] stringValue]];
    //scale other value to integer
    scaledCompareTo = [[JKBigInteger alloc] initWithString:[[other multiply:tens] stringValue]];
    NSComparisonResult compareBigInteger = [scaledNum compare:scaledCompareTo];
    return compareBigInteger;
}

- (id)pow:(unsigned int)exponent
{
    NSInteger totalFigure = figure*exponent;
    JKBigInteger *newBigInteger = [bigInteger pow:exponent];
    JKBigDecimal *newBigDecimal = [[JKBigDecimal alloc] initWithBigInteger:newBigInteger figure:totalFigure];
    return newBigDecimal;
}

- (id)negate
{
    JKBigInteger *newBigInteger = [bigInteger negate];
    JKBigDecimal *newBigDecimal = [[JKBigDecimal alloc] initWithBigInteger:newBigInteger figure:figure];
    return newBigDecimal;
}

- (id)abs
{
    JKBigInteger *newBigInteger = [bigInteger abs];
    JKBigDecimal *newBigDecimal = [[JKBigDecimal alloc] initWithBigInteger:newBigInteger figure:figure];
    return newBigDecimal;
}

- (NSString *)stringValue
{
    NSString *string = [bigInteger stringValue];
    if (figure==0) {
        return string;
    }
    NSMutableString *mString = [NSMutableString stringWithString:string];
    NSInteger newFigure = string.length-figure;
    while (newFigure<=0) {
        [mString insertString:@"0" atIndex:0];
        newFigure++;
    }
    [mString insertString:@"." atIndex:newFigure];
    return mString;
}

- (NSString *)description
{
    return [self stringValue];
}

@end
