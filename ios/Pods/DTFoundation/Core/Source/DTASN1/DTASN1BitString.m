//
//  DTASN1BitString.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 3/10/13.
//  Copyright (c) 2013 Cocoanetics. All rights reserved.
//

#import "DTASN1BitString.h"

@implementation DTASN1BitString
{
	NSUInteger _unusedBits;
	NSData *_data;
}


- (id)initWithData:(NSData *)data unusedBits:(NSUInteger)unusedBits
{
	self = [super init];
	
	if (self)
	{
		_data = [data copy];
		_unusedBits = unusedBits;
	}
	
	return self;
}

- (NSString *)description
{
	return _data.description;
}


- (NSString *)stringWithBits
{
	unsigned char *b = (unsigned char*) [_data bytes];
	int size = (int)[_data length];
	unsigned char byte;
	int i, j;
	
	NSMutableString *tmpString = [NSMutableString string];
	
	for (i=size-1;i>=0;i--)
	{
		int octetUnusedBits = 0;
		
		if (i==0)
		{
			octetUnusedBits = (int)_unusedBits;
		}
		
		for (j=7;j>=octetUnusedBits;j--)
		{
			byte = b[i] & (1<<j);
			byte >>= j;
			[tmpString appendFormat:@"%u", byte];
		}
	}
	
	return tmpString;
}

- (BOOL)valueOfBitAtIndex:(NSUInteger)index
{
	NSUInteger numberOfBits = [_data length]*8 - _unusedBits;
	
	if (index>=numberOfBits)
	{
		return NO;
	}
	
	NSUInteger charIndex = index/8;
	NSUInteger bitIndexInChar = index%8;
	
	unsigned char *b = (unsigned char*) [_data bytes];
	unsigned char byte = b[charIndex];
	
	return (((byte >> (7-bitIndexInChar))&1) == 1);
}

#pragma mark - Properties

@synthesize unusedBits = _unusedBits;

@end
