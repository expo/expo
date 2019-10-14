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

-(BOOL) shouldDownloadBundle:(NSDictionary*)oldManifest forNew:(NSDictionary*)newManifest
{
    NSString *newVersion = newManifest[manifestVersionKey];
    NSString *oldVersion = oldManifest[manifestVersionKey];
    if(newVersion == nil)
    {
        @throw [NSError errorWithDomain:NSArgumentDomain code:invalidVersionKey userInfo:@{@"vesrion": newVersion}];
    } else
    {
        if(oldVersion == nil)
        {
            return YES;
        } else {
            return [[EDSemver semverWithString:newVersion] isGreaterThan:[EDSemver semverWithString:oldVersion]];
        }
    }
}

@end
