//
//  NSString+DTPaths.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 2/15/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

#import "NSString+DTPaths.h"

@implementation NSString (DTPaths)

#pragma mark Standard Paths

+ (NSString *)cachesPath
{
	static dispatch_once_t onceToken;
	static NSString *cachedPath;
	
	dispatch_once(&onceToken, ^{
		cachedPath = [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) lastObject];	
	});
	
	return cachedPath;
}

+ (NSString *)documentsPath
{
	static dispatch_once_t onceToken;
	static NSString *cachedPath;

	dispatch_once(&onceToken, ^{
		cachedPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) lastObject];	
	});

	return cachedPath;
}

#pragma mark Temporary Paths

+ (NSString *)temporaryPath
{
	static dispatch_once_t onceToken;
	static NSString *cachedPath;
	
	dispatch_once(&onceToken, ^{
		cachedPath = NSTemporaryDirectory();	
	});
	
	return cachedPath;
}

+ (NSString *)pathForTemporaryFile
{
	CFUUIDRef newUniqueId = CFUUIDCreate(kCFAllocatorDefault);
	CFStringRef newUniqueIdString = CFUUIDCreateString(kCFAllocatorDefault, newUniqueId);
	NSString *tmpPath = [[NSString temporaryPath] stringByAppendingPathComponent:(__bridge NSString *)newUniqueIdString];
	CFRelease(newUniqueId);
	CFRelease(newUniqueIdString);
	
	return tmpPath;
}

#pragma mark Working with Paths

- (NSString *)pathByIncrementingSequenceNumber
{
	NSString *baseName = [self stringByDeletingPathExtension];
	NSString *extension = [self pathExtension];
	
	NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"\\(([0-9]+)\\)$" options:0 error:NULL];
	__block NSInteger sequenceNumber = 0;
	
	[regex enumerateMatchesInString:baseName options:0 range:NSMakeRange(0, [baseName length]) usingBlock:^(NSTextCheckingResult *match, NSMatchingFlags flags, BOOL *stop){
		
		NSRange range = [match rangeAtIndex:1]; // first capture group
		NSString *substring= [self substringWithRange:range];
		
		sequenceNumber = [substring integerValue];
		*stop = YES;
	}];
	
	NSString *nakedName = [baseName pathByDeletingSequenceNumber];
	
	if ([extension isEqualToString:@""])
	{
		return [nakedName stringByAppendingFormat:@"(%d)", (int)sequenceNumber+1];
	}
	
	return [[nakedName stringByAppendingFormat:@"(%d)", (int)sequenceNumber+1] stringByAppendingPathExtension:extension];
}

- (NSString *)pathByDeletingSequenceNumber
{
	NSString *baseName = [self stringByDeletingPathExtension];
	
	NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"\\([0-9]+\\)$" options:0 error:NULL];
	__block NSRange range = NSMakeRange(NSNotFound, 0);
	
	[regex enumerateMatchesInString:baseName options:0 range:NSMakeRange(0, [baseName length]) usingBlock:^(NSTextCheckingResult *match, NSMatchingFlags flags, BOOL *stop) {
		
		range = [match range];
		
		*stop = YES;
	}];
	
	if (range.location != NSNotFound)
	{
		return [self stringByReplacingCharactersInRange:range withString:@""];
	}
	
	return self;
}

@end
