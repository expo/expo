//
//  EXAlwaysAllowingManifestComparator.m
//  EXOta
//
//  Created by Michał Czernek on 14/10/2019.
//

#import "EXAlwaysAllowingManifestComparator.h"
#import "EXOtaUpdater.h"

@implementation EXAlwaysAllowingManifestComparator
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
  return YES;
}

@end
