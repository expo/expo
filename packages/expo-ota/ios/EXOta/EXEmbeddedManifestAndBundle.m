//
//  EXEmbeddedManifestAndBundle.m
//  EXOta
//
//  Created by Michał Czernek on 25/10/2019.
//

#import "EXEmbeddedManifestAndBundle.h"

@implementation EXEmbeddedManifestAndBundle {
    NSDictionary* embeddedManifest;
}

-(NSDictionary*) readManifest
{
    if(embeddedManifest == nil)
    {
        NSString *path = [[NSBundle mainBundle] pathForResource:@"shell-app-manifest" ofType:@"json"];
        NSData *data = [NSData dataWithContentsOfFile:path];
        embeddedManifest = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:nil];
    }
    return embeddedManifest;
}

-(NSString*) readBundlePath
{
    return [[NSBundle mainBundle] pathForResource:@"shell-app" ofType:@"bundle"];
}

- (Boolean) isEmbeddedManifestCompatibleWith:(NSDictionary*)manifest
{
    NSDictionary *embeddedManifest = [self readManifest];
    if(manifest == nil)
    {
        return NO;
    }
    
    NSString* sdkVersion = manifest[@"sdkVersion"];
    NSString* releaseChannel = manifest[@"releaseChannel"];
    if( sdkVersion == nil || releaseChannel == nil ) {
        return NO;
    }
    
    return [embeddedManifest[@"sdkVersion"] isEqualToString:sdkVersion] && [embeddedManifest[@"releaseChannel"] isEqualToString:releaseChannel];
}

@end
