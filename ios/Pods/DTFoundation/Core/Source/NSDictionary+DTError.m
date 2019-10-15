//
//  NSDictionary+DTError.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 4/16/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

#import "NSDictionary+DTError.h"
#import "DTFoundationConstants.h"

@implementation NSDictionary (DTError)

+ (NSDictionary *)dictionaryWithContentsOfURL:(NSURL *)URL error:(NSError **)error
{
	NSData *readData = [NSData dataWithContentsOfURL:URL options:0 error:error];
	
	if (!readData)
	{
		return nil;
	}
	
	return [NSDictionary dictionaryWithContentsOfData:readData error:error];
}

+ (NSDictionary *)dictionaryWithContentsOfFile:(NSString *)path error:(NSError **)error
{
	NSURL *url = [NSURL fileURLWithPath:path];
	return [NSDictionary dictionaryWithContentsOfURL:url error:error];
}

+ (NSDictionary *)dictionaryWithContentsOfData:(NSData *)data error:(NSError **)error
{
	CFErrorRef parseError = NULL;
	NSDictionary *dictionary = (__bridge_transfer NSDictionary *)CFPropertyListCreateWithData(kCFAllocatorDefault, (__bridge CFDataRef)data, kCFPropertyListImmutable, NULL, (CFErrorRef *)&parseError);
	
	// we check if it is the correct type and only return it if it is
	if ([dictionary isKindOfClass:[NSDictionary class]])
	{
		return dictionary;
	}
	else
	{
		if (parseError)
		{
			if (error)
			{
				*error = (__bridge NSError *)parseError;
			}
			
			CFRelease(parseError);
		}
		
		return nil;
	}
}

@end
