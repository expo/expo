//
//  EXOtaPersistance.m
//  EXOta
//
//  Created by Michał Czernek on 19/09/2019.
//

#import "EXOtaPersistance.h"

static NSString *const manifestKey = @"manifest";
static NSString *const bundlePathKey = @"bundlePath";
static NSString *const downloadedManifestKey = @"manifest";
static NSString *const downloadedBundlePathKey = @"bundlePath";

@implementation EXOtaPersistance

EXKeyValueStorage *_storage;
NSString *_appId;

- (id)initWithStorage:(EXKeyValueStorage*)storage andId:(NSString*)appId
{
    _storage = storage;
    _appId = appId;
    return self;
}

- (void)storeManifest:(NSDictionary*)manifest withBundle:(NSData*)bundle
{
    [_storage persistObject:manifest forKey:manifestKey];
}

- (void)markDownloadedAsCurrent
{
    
}


- (void)removeDownloadedBundle
{
    NSString *downloadedBundle = nil;
}

- (NSDictionary*)readManifest
{
    return [_storage readObject:manifestKey];
}

- (NSString*)bundlePath
{
    return [_storage readStringForKey:bundlePathKey];
}

- (void)saveData:(NSData*)data toFile:(NSString*)path
{
    
}

- (BOOL)removeFile:(NSString*)path
{
    return [[NSFileManager defaultManager] removeItemAtPath:path error:nil];
}

- (NSString*):ensureBundleDirExists
{
    NSString *cachcesDir = NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES).firstObject;
    NSString *bundlesDir = [NSString stringWithFormat:@"bundle-%@", _appId];
    NSString *bundlesPath = [cachcesDir stringByAppendingPathComponent:bundlesDir];
    BOOL cacheDirectoryExists = [[NSFileManager defaultManager] fileExistsAtPath:bundlesPath isDirectory:nil];
    
    if(!cacheDirectoryExists) {
        NSError *error;
        BOOL created = [[NSFileManager defaultManager] createDirectoryAtPath:bundlesPath
                                                 withIntermediateDirectories:YES
                                                                  attributes:nil
                                                                       error:&error];
        if(!created)
        {
            @throw error;
        } else
        {
            cacheDirectoryExists = YES;
        }
    }
    return cacheDirectoryExists ? bundlesPath : nil;
}

@end
