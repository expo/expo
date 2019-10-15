//
//  EXRevisionIdManifestComparator.m
//  EXOta
//
//  Created by Michał Czernek on 14/10/2019.
//

#import "EXRevisionIdManifestComparator.h"

@implementation EXRevisionIdManifestComparator

const NSString *manifestRevisionKey = @"revisionId";
const NSInteger invalidRevisionKey = 78264;

-(BOOL) shouldDownloadBundle:(NSDictionary*)oldManifest forNew:(NSDictionary*)newManifest
{
    NSString *newRevision = newManifest[manifestRevisionKey];
    NSString *oldRevision = oldManifest[manifestRevisionKey];
    if(newRevision == nil)
    {
        @throw [NSError errorWithDomain:NSArgumentDomain code:invalidRevisionKey userInfo:@{@"vesrion": newRevision}];
    } else
    {
        if(oldRevision == nil)
        {
            return YES;
        } else {
            return ![newRevision isEqualToString:oldRevision];
        }
    }
}

@end
