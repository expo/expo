//
//  NSURL+DTComparing.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 13.11.12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

#import "NSURL+DTComparing.h"

@implementation NSURL (DTComparing)

- (BOOL)isEqualToURL:(NSURL *)URL
{
	// scheme must be same
	if (![[self scheme] isEqualToString:[URL scheme]])
	{
		return NO;
	}

	// host must be same
	if (![[self host] isEqualToString:[URL host]])
	{
		return NO;
	}
	
	// path must be same
	if (![[self path] isEqualToString:[URL path]])
	{
		return NO;
	}

	return YES;
}

@end
