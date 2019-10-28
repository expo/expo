//
//  EXEmbeddedManifestAndBundle.m
//  EXOta
//
//  Created by Michał Czernek on 25/10/2019.
//

#import "EXEmbeddedManifestAndBundle.h"

@implementation EXEmbeddedManifestAndBundle

-(NSDictionary*) readManifest
{
    NSString *path = [[NSBundle mainBundle] pathForResource:@"shell-app-manifest" ofType:@"json" inDirectory:@"Supporting"];
    NSData *data = [NSData dataWithContentsOfFile:path];
    return [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:nil];
}

-(NSString*) readBundlePath
{
    return [[NSBundle mainBundle] pathForResource:@"shell-app" ofType:@"bundle" inDirectory:@"Supporting"];
}

@end
 
