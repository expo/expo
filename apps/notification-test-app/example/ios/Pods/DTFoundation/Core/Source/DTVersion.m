//
//  DTVersion.m
//  DTFoundation
//
//  Created by Oliver Drobnik
//  Copyright 2012 Cocoanetics. All rights reserved.
//

#import "DTVersion.h"

@implementation DTVersion

#pragma mark Creating Versions

- (DTVersion *)initWithMajor:(NSUInteger)major minor:(NSUInteger)minor maintenance:(NSUInteger)maintenance build:(NSUInteger)build
{
	self = [super init];
	if (self) {
		_major = major;
		_minor = minor;
		_maintenance = maintenance;
		_build = build;
	}
	return self;
}

- (DTVersion *)initWithMajor:(NSUInteger)major minor:(NSUInteger)minor maintenance:(NSUInteger)maintenance
{
	return [self initWithMajor:major minor:minor maintenance:maintenance build:0];
}

+ (DTVersion *)versionWithString:(NSString*)versionString
{
	if (!versionString)
	{
		return nil;
	}
	
	NSInteger major = 0;
	NSInteger minor = 0;
	NSInteger maintenance = 0;
	NSInteger build = 0;

	NSError *error;
	NSString *pattern = @"^(\\d+)(?:\\.(\\d+))?(?:\\.(\\d+))?(?:\\.(\\d+))?(?:$|\\s)";

	NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:pattern
																																				 options:NSRegularExpressionCaseInsensitive
																																					 error:&error];

	NSTextCheckingResult *match = [regex firstMatchInString:versionString
	                                                options:0
	                                                  range:NSMakeRange(0, [versionString length])];
	
	if (!match)
	{
		return nil;
	}
	for (NSUInteger i = 1; i < match.numberOfRanges; i++)
	{
		NSRange range = [match rangeAtIndex:i];
		if (range.location == NSNotFound)
		{
			break;
		}
		NSUInteger value = [[versionString substringWithRange:range] integerValue];

		switch (i)
		{
			case 1:
				major = value;
				break;
			case 2:
				minor = value;
				break;
			case 3:
				maintenance = value;
				break;
			case 4:
				build = value;
				break;
			default:
				break;
		}
	}

	if (major >= 0 &&
			minor >= 0 &&
			maintenance >= 0 &&
			build >= 0)
	{
		return [[DTVersion alloc] initWithMajor:major minor:minor maintenance:maintenance build:build];
	}
		
	return nil;
}

+ (DTVersion*)appBundleVersion 
{
    NSDictionary *info = [[NSBundle mainBundle] infoDictionary];
	NSString *version = info[@"CFBundleVersion"];
    
	return [DTVersion versionWithString:version];
}

+ (DTVersion *)osVersion
{
	static dispatch_once_t onceToken;
	static DTVersion *version = nil;
	
	dispatch_once(&onceToken, ^{
#if TARGET_OS_IPHONE
		NSString *versionStr = [[UIDevice currentDevice] systemVersion];
		version = [DTVersion versionWithString:versionStr];
#else
		NSString *versionStr = [[NSProcessInfo processInfo] operatingSystemVersionString];
		versionStr = [versionStr stringByReplacingOccurrencesOfString:@"Version" withString:@""];
		versionStr = [versionStr stringByReplacingOccurrencesOfString:@"Build" withString:@""];
		versionStr = [versionStr stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
		version = [DTVersion versionWithString:versionStr];
#endif
	});
	
	return version;
}

#pragma mark Comparing Versions

+ (BOOL)osVersionIsLessThen:(NSString *)versionString
{
	return [[DTVersion osVersion] isLessThenVersionString:versionString];
}

+ (BOOL)osVersionIsGreaterThen:(NSString *)versionString
{
	return [[DTVersion osVersion] isGreaterThenVersionString:versionString];
}


- (BOOL)isLessThenVersion:(DTVersion *)version
{
	int result = [self compare:version] == NSOrderedAscending;
	//DDLogVerbose(@"%@ < %@? %d =  %@", self, version, result, result ? @"YES" : @"NO");
	return result;
}

- (BOOL)isGreaterThenVersion:(DTVersion *)version
{
	return [self compare:version] == NSOrderedDescending;
}

- (BOOL)isLessThenVersionString:(NSString *)versionString
{
	return [self isLessThenVersion:[DTVersion versionWithString:versionString]];
}

- (BOOL)isGreaterThenVersionString:(NSString *)versionString
{
	return [self isGreaterThenVersion:[DTVersion versionWithString:versionString]];
}



- (BOOL)isEqualToVersion:(DTVersion *)version
{
	return (self.major == version.major) && (self.minor == version.minor) && (self.maintenance == version.maintenance);
}

- (BOOL)isEqualToString:(NSString *)versionString
{
	DTVersion *versionToTest = [DTVersion versionWithString:versionString];
	return [self isEqualToVersion:versionToTest];
}

- (NSUInteger)hash
{
	NSUInteger hash = self.major;
	hash = hash * 31u + self.minor;
	hash = hash * 31u + self.maintenance;
	hash = hash * 31u + self.build;
	return hash;
}

- (BOOL)isEqual:(id)object
{
	if ([object isKindOfClass:[DTVersion class]]) 
	{
		return [self isEqualToVersion:(DTVersion*)object];
	}
	if ([object isKindOfClass:[NSString class]]) 
	{
		return [self isEqualToString:(NSString*)object];
	}
	return NO;
}

- (NSComparisonResult)compare:(DTVersion *)version
{
	if (version == nil)
	{
		return NSOrderedDescending;
	}
	
	if (self.major < version.major)
	{
		return NSOrderedAscending;
	}
	if (self.major > version.major)
	{
		return NSOrderedDescending;
	}
	if (self.minor < version.minor)
	{
		return NSOrderedAscending;
	}
	if (self.minor > version.minor)
	{
		return NSOrderedDescending;
	}
	if (self.maintenance < version.maintenance)
	{
		return NSOrderedAscending;
	}
	if (self.maintenance > version.maintenance)
	{
		return NSOrderedDescending;
	}
	if (self.build < version.build)
	{
		return NSOrderedAscending;
	}
	if (self.build > version.build)
	{
		return NSOrderedDescending;
	}
	
	
	return NSOrderedSame;
}


- (NSString *)description
{
	if (_build > 0)
	{
		return [NSString stringWithFormat:@"%d.%d.%d.%d", (int)_major, (int)_minor, (int)_maintenance, (int)_build];
	}
	if (_maintenance > 0)
	{
		return [NSString stringWithFormat:@"%d.%d.%d", (int)_major, (int)_minor, (int)_maintenance];
	}
	return [NSString stringWithFormat:@"%d.%d", (int)_major, (int)_minor];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
	return [[DTVersion allocWithZone:zone] initWithMajor:_major minor:_minor maintenance:_maintenance build:_build];
}

#pragma mark - Properties

@synthesize major = _major;
@synthesize minor = _minor;
@synthesize maintenance = _maintenance;
@synthesize build = _build;

@end
