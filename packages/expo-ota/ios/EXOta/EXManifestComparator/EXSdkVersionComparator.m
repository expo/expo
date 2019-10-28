//
//  EXSdkVersionComparator.m
//  EXOta
//
//  Created by Michał Czernek on 25/10/2019.
//

#import "EXSdkVersionComparator.h"

const NSString *manifestSdkVersionKey = @"sdkVersion";
const NSInteger invalidSdkVersionKey = 78263;

@implementation EXSdkVersionComparator

-(BOOL) shouldReplaceBundle:(NSDictionary*)oldManifest forNew:(NSDictionary*)newManifest
{
    NSString *newVersion = newManifest[manifestSdkVersionKey];
    NSString *oldVersion = oldManifest[manifestSdkVersionKey];
    if(newVersion == nil)
    {
        @throw [NSError errorWithDomain:NSArgumentDomain code:invalidSdkVersionKey userInfo:@{@"sdkVersion": newVersion}];
    } else
    {
        if(oldVersion == nil)
        {
            return YES;
        } else {
            return [newVersion isEqualToString:oldVersion];
        }
    }
}

@end
