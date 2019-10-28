//
//  EXRevisionIdManifestComparator.m
//  EXOta
//
//  Created by Michał Czernek on 14/10/2019.
//

#import "EXRevisionIdManifestComparator.h"

const NSString *manifestRevisionKey = @"revisionId";
const NSInteger invalidRevisionKey = 78264;

@implementation EXRevisionIdManifestComparator
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
            return [nativeManifestComparator shouldReplaceBundle:oldManifest forNew:newManifest] && ![newRevision isEqualToString:oldRevision];
        }
    }
}

@end
