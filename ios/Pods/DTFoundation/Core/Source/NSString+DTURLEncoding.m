//
//  NSString+DTURLEncoding.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 4/16/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

#import "NSString+DTURLEncoding.h"

@implementation NSString (DTURLEncoding)

- (NSString *)stringByURLEncoding
{
#if __IPHONE_OS_VERSION_MAX_ALLOWED < __IPHONE_9_0
	return (__bridge_transfer NSString *)CFURLCreateStringByAddingPercentEscapes(NULL,  (__bridge CFStringRef)self,  NULL,  (CFStringRef)@"!*'();:@&=+$,/?%#[]", kCFStringEncodingUTF8);
#else
	
	static NSCharacterSet *allowedCharacters = nil;
	static dispatch_once_t onceToken;
	
	dispatch_once(&onceToken, ^{
		NSMutableCharacterSet *tmpSet = [[NSCharacterSet URLQueryAllowedCharacterSet] mutableCopy];
		
		// add some characters that might have special meaning
        [tmpSet  removeCharactersInString: @"!*'();:@&=+$,/?%#[]"];
		allowedCharacters = [tmpSet copy];
	});
	
    return [self stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
#endif
}

@end
