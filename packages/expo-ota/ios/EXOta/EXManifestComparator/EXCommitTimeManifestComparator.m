//
//  EXCommitTimeManifestComparator.m
//  EXOta
//
//  Created by Michał Czernek on 05/11/2019.
//

#import "EXCommitTimeManifestComparator.h"
#import "EXOtaUpdater.h"

const NSString *manifestCommitTimeKey = @"commitTime";
const NSInteger invalidTimeKey = 78264;

@implementation EXCommitTimeManifestComparator
{
  id<ManifestComparator> nativeManifestComparator;
}

-(id) initWithNativeComparator:(id<ManifestComparator>)nativeComparator
{
  nativeManifestComparator = nativeComparator;
  return self;
}

-(BOOL) shouldReplaceBundle:(NSDictionary *)oldManifest forNew:(NSDictionary *)newManifest
{
  if(newManifest == nil)
  {
    return NO;
  }
  if(oldManifest == nil)
  {
    return YES;
  }
  NSString *newTimeString = newManifest[manifestCommitTimeKey];
  NSString *oldTimeString = oldManifest[manifestCommitTimeKey];
  if(newTimeString == nil)
  {
    @throw [NSError errorWithDomain:NSArgumentDomain code:invalidTimeKey userInfo:@{@"version": newTimeString}];
  } else
  {
    if(oldTimeString == nil)
    {
      return YES;
    } else {
      NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
      [dateFormatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss.SSSZ"];
      NSDate *newCommitTime = [dateFormatter dateFromString:newTimeString];
      NSDate *oldCommitTime = [dateFormatter dateFromString:oldTimeString];
      return [nativeManifestComparator shouldReplaceBundle:oldManifest forNew:newManifest] && [newCommitTime compare:oldCommitTime] == NSOrderedDescending;
    }
  }
}

@end
