//
//  NSArray+DTError.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 6/15/10.
//  Copyright 2010 Drobnik.com. All rights reserved.
//

#import "NSArray+DTError.h"
#import "DTFoundationConstants.h"

@implementation NSArray (DTError)

+ (NSArray *)arrayWithContentsOfURL:(NSURL *)URL error:(NSError **)error
{
	NSData *readData = [NSData dataWithContentsOfURL:URL options:0 error:error];
	
	if (!readData)
	{
		return nil;
	}
	
	return [NSArray arrayWithContentsOfData:readData error:error];
}

+ (NSArray *)arrayWithContentsOfFile:(NSString *)path error:(NSError **)error
{
	NSURL *url = [NSURL fileURLWithPath:path];
	return [NSArray arrayWithContentsOfURL:url error:error];
}

+ (NSArray *)arrayWithContentsOfData:(NSData *)data error:(NSError **)error
{
	CFErrorRef parseError = NULL;
	NSArray *array = (__bridge_transfer NSArray *)CFPropertyListCreateWithData(kCFAllocatorDefault, (__bridge CFDataRef)data, kCFPropertyListImmutable, NULL, (CFErrorRef *)&parseError);
	
	if ([array isKindOfClass:[NSArray class]])
	{
        return array;
	}
	
	if (parseError)
	{
		if (error)
		{
			*error = (__bridge NSError *)(parseError);
		}
		
		CFRelease(parseError);
	}
	
	return nil;
}


@end
