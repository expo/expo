//
//  EXOtaUpdater.m
//  EXOta
//
//  Created by Michał Czernek on 05/09/2019.
//

#import <Foundation/Foundation.h>
#import "EXOtaUpdater.h"
#import "EXOtaPersistance.h"
#import "EXOtaApiClient.h"
#import "EXOtaBundleLoader.h"
#import "EXOtaPersistanceFactory.h"

@implementation EXOtaUpdater: NSObject

id<EXOtaConfig> _config;
NSString *_identifier;
EXOtaPersistance *_persistance;

- (id)initWithConfig:(id<EXOtaConfig>)config withPersistance:(EXOtaPersistance*)persistance withId:(NSString*)identifier
{
    _config = config;
    _identifier = identifier;
    _persistance = persistance;
    return self;
}


- (void)checkAndDownloadUpdate:(nonnull EXUpdateSuccessBlock)successBlock updateUnavailable:(void (^)(void))unavailableBlock error:(nonnull EXErrorBlock)errorBlock
{
    [self downloadManifest:^(NSDictionary * _Nonnull manifest) {
        NSDictionary *oldManifest = [_persistance readNewestManifest];
        if(oldManifest == nil || [_config.manifestComparator shouldDownloadBundle:oldManifest forNew:manifest])
        {
            [self downloadBundle:manifest success:^(NSString *path) {
                successBlock(manifest, path);
            } error:errorBlock];
        } else
        {
            unavailableBlock();
        }
    } error:errorBlock];
}

- (void)downloadManifest:(nonnull EXManifestSuccessBlock)successBlock error:(nonnull EXErrorBlock)errorBlock
{
    EXOtaApiClient *api = [[EXOtaApiClient alloc] init];
    [api performRequest:_config.manifestUrl withHeaders:_config.manifestRequestHeaders withTimeout:_config.manifestRequestTimeout success:^(NSData * _Nonnull response) {
        NSDictionary *json = [NSJSONSerialization JSONObjectWithData:response options:kNilOptions error:nil];
        NSString *manifestString = [json valueForKey:@"manifestString"];
        NSData *data = [manifestString dataUsingEncoding:NSUTF8StringEncoding];
        NSDictionary *manifest =[NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:nil];
        successBlock(manifest);
    } error:^(NSError * _Nonnull error) {
        errorBlock(error);
    }];
}

- (void)saveDownloadedManifest:(NSDictionary*)manifest andBundlePath:(NSString*)path
{
    NSString *previousBundle = [_persistance readDownloadedBundlePath];
    if(previousBundle != nil)
    {
        [self removeFile:previousBundle];
    }
    [_persistance storeDownloadedManifest:manifest];
    [_persistance storeDownloadedBundle:path];
}

- (void)prepareToReload
{
    [self markDownloadedCurrentAndCurrentOutdated];
}

- (void)markDownloadedCurrentAndCurrentOutdated
{
    NSString *outdated = [_persistance readOutdatedBundlePath];
    if(outdated != nil)
    {
        [self removeFile:outdated];
    }
    [_persistance markDownloadedCurrentAndCurrentOutdated];
}

- (void)removeOutdatedBundle
{
    NSString *outdated = [_persistance readOutdatedBundlePath];
    [_persistance storeOutdatedBundle:nil];
    if(outdated != nil)
    {
        [self removeFile:outdated];
    }
}

- (void)cleanUnusedFiles
{
    NSString *bundlesDir = [[self bundlesDir] absoluteString];
    NSArray<NSString *> *filesArray = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:bundlesDir error:nil];
    NSSet *doNotDelete = [self validFilesSet];
    for (id file in filesArray)
    {
        NSString *absolutePath = [bundlesDir stringByAppendingPathComponent:file];
        if(![doNotDelete containsObject:absolutePath])
        {
            [self removeFile:absolutePath];
        }
    }
}

- (NSSet*)validFilesSet
{
    NSMutableSet *set = [NSMutableSet new];
    NSString *downloadedBundle = [_persistance readDownloadedBundlePath];
    NSString *bundle = [_persistance readBundlePath];
    if (downloadedBundle != nil)
    {
        [set addObject:downloadedBundle];
    }
    if (bundle != nil)
    {
        [set addObject:bundle];
    }
    return set;
}

- (void)downloadBundle:(NSDictionary*)manifest success:(void (^)(NSString* path))successBlock error:(EXErrorBlock)errorBlock
{
    NSString* bundleUrl = manifest[@"bundleUrl"];
    EXOtaBundleLoader *bundleLoader = [[EXOtaBundleLoader alloc] initWithTimeout:_config.bundleRequestTimeout];
    NSString *filename = [self bundleFilenameFromManifest:manifest];
    [bundleLoader loadJSBundleFromUrl:bundleUrl withDirectory:[self bundlesDir] withFileName:filename success:successBlock error:^(NSError * _Nonnull error) {
        errorBlock(error);
    }];
}

- (void)removeFile:(NSString*)path
{
    [[NSFileManager defaultManager] removeItemAtPath:path error:nil];
}

- (NSString*)bundleFilenameFromManifest:(NSDictionary*)manifest
{
    NSString *version = manifest[@"version"];
    NSNumber *date = [NSNumber numberWithDouble:[[NSDate date] timeIntervalSince1970]];
    return [NSString stringWithFormat:@"bundle_%@_%@", version, date];
}

- (NSURL*)bundlesDir
{
    NSString *bundlesDirName = [NSString stringWithFormat:@"bundle-%@", _identifier];
    NSFileManager *fm = [NSFileManager defaultManager];
    NSString *bundleID = [[NSBundle mainBundle] bundleIdentifier];
    NSURL *dirPath = nil;
    NSArray *paths = [fm URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask];
    if([paths count] > 0)
    {
        NSURL* appSupportDir = [paths objectAtIndex:0];
        dirPath = [[appSupportDir URLByAppendingPathComponent:bundleID] URLByAppendingPathComponent:bundlesDirName isDirectory:true];
    }
    return dirPath;
}

@end
