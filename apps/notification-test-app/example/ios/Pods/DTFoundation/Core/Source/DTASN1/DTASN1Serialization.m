//
//  DTASN1Serialization.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 3/9/13.
//  Copyright (c) 2013 Cocoanetics. All rights reserved.
//

#import "DTASN1Serialization.h"
#import "DTASN1Parser.h"
#import "DTBase64Coding.h"

@interface DTASN1Serialization () <DTASN1ParserDelegate>

@property (nonatomic, readonly) id rootObject;

- (id)initWithData:(NSData *)data;

@end

@implementation DTASN1Serialization
{
	id _rootObject;
	id _currentContainer;
	NSMutableArray *_stack;
}

+ (nullable id)objectWithData:(nonnull NSData *)data
{
	DTASN1Serialization *decoder = [[DTASN1Serialization alloc] initWithData:data];
	
	return decoder.rootObject;
}


// private initializer
- (nullable id)initWithData:(nonnull NSData *)data
{
	self = [super init];
	
	if (self)
	{
		DTASN1Parser *parser = [[DTASN1Parser alloc] initWithData:data];
		parser.delegate = self;
		
		if (![parser parse])
		{
			return nil;
		}
	}
	return self;
}

- (void)_pushContainer:(id)container
{
	if (!_stack)
	{
		_stack = [NSMutableArray array];
		_rootObject = container;
	}
	
	[_currentContainer addObject:container];
	
	[_stack addObject:container];
	_currentContainer = container;
}

- (void)_addObjectToCurrentContainer:(id)object
{
	if (!_stack)
	{
		_stack = [NSMutableArray array];
		_rootObject = object;
	}
	
	[_currentContainer addObject:object];
}

- (void)_popContainer
{
	[_stack removeLastObject];
	_currentContainer = [_stack lastObject];
}

#pragma mark - DTASN1 Parser Delegate

- (void)parser:(DTASN1Parser *)parser didStartContainerWithType:(DTASN1Type)type
{
	NSMutableArray *newContainer = [NSMutableArray array];
	[self _pushContainer:newContainer];
}

- (void)parser:(DTASN1Parser *)parser didEndContainerWithType:(DTASN1Type)type
{
	[self _popContainer];
}

- (void)parser:(DTASN1Parser *)parser didStartContextWithTag:(NSUInteger)tag constructed:(BOOL)constructed
{
	NSNumber *tagNumber = [NSNumber numberWithUnsignedInteger:tag];
	
	NSMutableArray *newContainer = [NSMutableArray array];
	NSDictionary *dictionary = [NSDictionary dictionaryWithObject:newContainer forKey:tagNumber];
	
	[self _pushContainer:dictionary];
	_currentContainer = newContainer;
}

- (void)parser:(DTASN1Parser *)parser didEndContextWithTag:(NSUInteger)tag constructed:(BOOL)constructed
{
	[self _popContainer];
}

- (void)parserFoundNull:(DTASN1Parser *)parser
{
	[self _addObjectToCurrentContainer:[NSNull null]];
}

- (void)parser:(DTASN1Parser *)parser foundDate:(NSDate *)date
{
	[self _addObjectToCurrentContainer:date];
}

- (void)parser:(DTASN1Parser *)parser foundObjectIdentifier:(NSString *)objIdentifier
{
	[self _addObjectToCurrentContainer:objIdentifier];
}

- (void)parser:(DTASN1Parser *)parser foundString:(NSString *)string
{
	[self _addObjectToCurrentContainer:string];
}

- (void)parser:(DTASN1Parser *)parser foundData:(NSData *)data
{
	[self _addObjectToCurrentContainer:data];
}

- (void)parser:(DTASN1Parser *)parser foundBitString:(DTASN1BitString *)bitString
{
	[self _addObjectToCurrentContainer:bitString];
}

- (void)parser:(DTASN1Parser *)parser foundNumber:(NSNumber *)number
{
	[self _addObjectToCurrentContainer:number];
}

@end
