//
//  EXVersionNumberManifestComparator.m
//  DoubleConversion
//
//  Created by Michał Czernek on 08/10/2019.
//

#import <EDSemver/EDSemver.h>
#import "EXVersionNumberManifestComparator.h"

const NSString *manifestVersionKey = @"version";
const NSInteger invalidVersionKey = 78263;

@implementation EXVersionNumberManifestComparator
{
    id<ManifestComparator> nativeManifestComparator;
}

-(id) initWithNativeComparator:(id<ManifestComparator>)nativeComparator
{
    nativeManifestComparator = nativeComparator;
    return self;
}

-(BOOL) shouldReplaceBundle:(NSDictionary*)oldManifest forNew:(NSDictionary*)newManifest
{
    if(newManifest == nil)
    {
        return NO;
    }
    if(oldManifest == nil)
    {
        return YES;
    }
    NSString *newVersion = newManifest[manifestVersionKey];
    NSString *oldVersion = oldManifest[manifestVersionKey];
    if(newVersion == nil)
    {
        @throw [NSError errorWithDomain:NSArgumentDomain code:invalidVersionKey userInfo:@{@"version": newVersion}];
    } else
    {
        if(oldVersion == nil)
        {
            return YES;
        } else {
            return [nativeManifestComparator shouldReplaceBundle:oldManifest forNew:newManifest] && [[EDSemver semverWithString:newVersion] isGreaterThan:[EDSemver semverWithString:oldVersion]];
        }
    }
}

@end
