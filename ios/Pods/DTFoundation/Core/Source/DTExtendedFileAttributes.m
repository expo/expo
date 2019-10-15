//
//  DTExtendedFileAttributes.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 3/6/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

#import "DTExtendedFileAttributes.h"

#import <sys/xattr.h>

@implementation DTExtendedFileAttributes
{
	NSString *_path;
}

- (id)initWithPath:(NSString *)path
{
	self = [super init];
	if (self)
	{
		if (![path length])
		{
			return nil;
		}
		
		_path = path;
	}
	
	return self;
}

- (BOOL)removeAttribute:(NSString *)attribute
{
	const char *attrName = [attribute UTF8String];
	const char *filePath = [_path fileSystemRepresentation];

	int result = removexattr(filePath, attrName, 0);
	
	return (result==0);
}

- (BOOL)setValue:(NSString *)value forAttribute:(NSString *)attribute
{
	if (![attribute length])
	{
		return NO;
	}

	if (!value)
	{
		// remove it instead
		return [self removeAttribute:attribute];
	}
	
	const char *attrName = [attribute UTF8String];
	const char *filePath = [_path fileSystemRepresentation];
	
	const char *val = [value UTF8String];

	int result = setxattr(filePath, attrName, val, strlen(val), 0, 0);
	
	return (result==0);
}

- (NSString *)valueForAttribute:(NSString *)attribute
{
	if (![attribute length])
	{
		return nil;
	}
	
	const char *attrName = [attribute UTF8String];
	const char *filePath = [_path fileSystemRepresentation];
	
	// get size of needed buffer
	ssize_t bufferLength = getxattr(filePath, attrName, NULL, 0, 0, 0);
	
	if (bufferLength<=0)
	{
		return nil;
	}
	
	// make a buffer of sufficient length
	char *buffer = malloc(bufferLength);
	
	// now actually get the attribute string
	getxattr(filePath, attrName, buffer, bufferLength, 0, 0);
	
	// convert to NSString
	NSString *retString = [[NSString alloc] initWithBytes:buffer length:bufferLength encoding:NSUTF8StringEncoding];
		
	// release buffer
	free(buffer);
	
	return retString;
}

@end
