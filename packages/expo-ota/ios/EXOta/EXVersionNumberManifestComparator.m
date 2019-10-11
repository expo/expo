//
//  EXVersionNumberManifestComparator.m
//  DoubleConversion
//
//  Created by Michał Czernek on 08/10/2019.
//

#import "EXVersionNumberManifestComparator.h"

@implementation EXVersionNumberManifestComparator

-(BOOL) shouldDownloadBundle:(NSDictionary*)oldManifest forNew:(NSDictionary*)newManifest
{
    return YES;
}

@end
