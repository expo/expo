//
//  EDSemver.m
//  semver
//
//  Created by Andrew Sliwinski on 7/4/13.
//  Copyright (c) 2013 Andrew Sliwinski. All rights reserved.
//

#import "EDSemver.h"

@interface EDSemver ()
@property (readwrite) BOOL isValid;
@property (readwrite) NSInteger major;
@property (readwrite) NSInteger minor;
@property (readwrite) NSInteger patch;
@property (readwrite) NSString *prerelease;
@property (readwrite) NSString *build;
@property (readwrite) NSArray *pr;

@property NSString *original;
@property NSArray *version;
@end

@implementation EDSemver

static NSString *const BUILD_DELIMITER          = @"+";
static NSString *const PRERELEASE_DELIMITER     = @"-";
static NSString *const VERSION_DELIMITER        = @".";
static NSString *const IGNORE_PREFIX            = @"v";
static NSString *const IGNORE_EQ                = @"=";

@synthesize isValid = _isValid;
@synthesize major = _major;
@synthesize minor = _minor;
@synthesize patch = _patch;
@synthesize prerelease = _prerelease;
@synthesize build = _build;
@synthesize original = _original;
@synthesize version = _version;
@synthesize pr = _pr;

#pragma mark - Init

+ (NSString *)spec
{
	// Version of the Semver spec that this library is implementing
	// http://semver.org/spec/v2.0.0.html
	return @"2.0.0";
}

+ (instancetype)semverWithString:(NSString *)aString
{
	return [[self alloc] initWithString:aString];
}

- (instancetype)initWithString:(NSString *)aString
{
    self = [super init];
    if (self) {
        // Lex the input string
        _original   = aString;
        _version    = [self lex:aString];

        // Check & set properties
        _isValid    = [self check];
        if (_isValid) {
            _major      = [_version[0] integerValue];
            _minor      = [_version[1] integerValue];
            _patch      = [_version[2] integerValue];
            _prerelease = _version[3];
            _build      = _version[4];
            _pr         = [self parse:_prerelease strict:NO];
        }
    }
    return self;
}

#pragma mark - Public methods

- (NSComparisonResult)compare:(EDSemver *)aVersion
{
	if (![self isValid] || ![aVersion isValid]) {
		[[NSException exceptionWithName:NSInvalidArgumentException reason:@"nil argument" userInfo:nil] raise];
	}

	NSComparisonResult result = [@(self.major) compare:@(aVersion.major)];
	if (result != NSOrderedSame) {
		return result;
	}

	result = [@(self.minor) compare:@(aVersion.minor)];
	if (result != NSOrderedSame) {
		return result;
	}

	result = [@(self.patch) compare:@(aVersion.patch)];
	if (result != NSOrderedSame) {
		return result;
	}

	if (self.prerelease.length > 0 || aVersion.prerelease.length > 0) {
		if (self.prerelease.length > 0 && aVersion.prerelease.length == 0) return NSOrderedAscending;
		if (self.prerelease.length == 0 && aVersion.prerelease.length > 0) return NSOrderedDescending;
        return [self.prerelease compare:(NSString * _Nonnull)aVersion.prerelease];
    }

	return NSOrderedSame;
}


- (BOOL)isEqualTo:(id)aVersion
{
    if(![aVersion isKindOfClass:[self class]]) return NO;
    return [self compare:(EDSemver * _Nonnull)aVersion] == NSOrderedSame;
}

- (BOOL)isLessThan:(id)aVersion
{
    if(![aVersion isKindOfClass:[self class]]) return NO;
    return [self compare:(EDSemver * _Nonnull)aVersion] == NSOrderedAscending;
}

- (BOOL)isGreaterThan:(id)aVersion
{
    if(![aVersion isKindOfClass:[self class]]) return NO;
    return [self compare:(EDSemver * _Nonnull)aVersion] == NSOrderedDescending;
}

- (NSString *)description
{
	return self.original;
}

- (NSString *)debugDescription
{
	return [[super debugDescription] stringByReplacingOccurrencesOfString:@">" withString:[NSString stringWithFormat:@" (%@)>", self.original]];
}

#pragma mark - Private methods

- (BOOL)check
{
    // Edge cases
    if (self.original.length == 0) return NO;

    // Check that major, minor, and patch values are numbers
    NSNumberFormatter *nf = [[NSNumberFormatter alloc] init];
    for (NSUInteger i = 0; i < 3; i++) {
        if ([nf numberFromString:self.version[i]] == nil) return NO;
    }

    return YES;
}

- (NSArray *)lex:(NSString *)aString
{
    // Storage objects
    NSString *build         = @"";
    NSString *prerelease    = @"";

    // Strip whitespace & prefix
    if (aString.length > 0) {
        aString = [aString stringByReplacingOccurrencesOfString:@" " withString:@""];
        if ([[aString substringWithRange:NSMakeRange(0, 1)] isEqualToString:IGNORE_PREFIX]) {
            aString = [aString substringFromIndex:1];
        };
        if ([[aString substringWithRange:NSMakeRange(0, 1)] isEqualToString:IGNORE_EQ]) {
            aString = [aString substringFromIndex:1];
        };
    }

    // Build
    NSArray *b = [aString componentsSeparatedByString:BUILD_DELIMITER];
    if ([b count] > 1) {
        aString = b[0];
        build = [b lastObject];
    }

    // Pre-release
    NSArray *p = [aString componentsSeparatedByString:PRERELEASE_DELIMITER];
    if ([p count] > 1) {
        aString = p[0];
        prerelease = [p lastObject];
    }

    // Parse remainder and append pre-release & build strings
    NSMutableArray *v = [[NSMutableArray alloc] initWithArray:[self parse:aString strict:YES]];
    [v addObject:prerelease];
    [v addObject:build];

    return v;
}

- (NSArray *)parse:(NSString *)aString strict:(BOOL)strict
{
    NSMutableArray *v = [[NSMutableArray alloc] initWithArray:[aString componentsSeparatedByString:VERSION_DELIMITER]];
    for (NSUInteger i = [v count]; i < 3; i++) {
        [v addObject:@"0"];
    }

    return v;
}

@end
