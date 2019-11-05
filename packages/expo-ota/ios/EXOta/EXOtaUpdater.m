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
#import "EXEmbeddedManifestAndBundle.h"

@implementation EXOtaUpdater
{
  id<EXOtaConfig> _config;
  NSString *_identifier;
  EXOtaPersistance *_persistance;
  EXEmbeddedManifestAndBundle *_embedded;
}

@synthesize eventsEmitter = _eventsEmitter;

- (id)initWithConfig:(id<EXOtaConfig>)config withPersistance:(EXOtaPersistance *)persistance withId:(NSString *)identifier
{
  _config = config;
  _identifier = identifier;
  _persistance = persistance;
  _embedded = [EXEmbeddedManifestAndBundle new];
  [self ensureBundleExists];
  [self checkEmbeddedManifestAndBundle];
  [self performEnqueqedReorder];
  return self;
}

- (void)ensureBundleExists
{
  if(![[NSFileManager defaultManager] fileExistsAtPath:[_persistance readBundlePath]])
  {
    [_persistance clean];
    [self cleanUnusedFiles];
  }
}

- (void)checkEmbeddedManifestAndBundle
{
  if([self shouldCopyEmbeddedManifestAndBundle])
  {
    NSDictionary *embeddedManifest = [_embedded readManifest];
    EXOtaBundleLoader *bundleLoader = [[EXOtaBundleLoader alloc] initWithTimeout:_config.bundleRequestTimeout];
    NSData *bundle = [NSData dataWithContentsOfFile:[_embedded readBundlePath] options:NSMappedRead error:nil];
    [bundleLoader saveResponseToFile:bundle inDirectory:[self bundlesDir] withFilename:[self bundleFilenameFromManifest:embeddedManifest] success:^(NSString * _Nonnull path) {
      [self saveDownloadedManifest:embeddedManifest andBundlePath:path];
      [self markDownloadedCurrentAndCurrentOutdated];
    } error:^(NSError * _Nonnull error) {
    }];
  }
}

- (BOOL)shouldCopyEmbeddedManifestAndBundle
{
  NSDictionary *embeddedManifest = [_embedded readManifest];
  return ![_embedded isEmbeddedManifestCompatibleWith:[_persistance readNewestManifest]] ||
  [[_config manifestComparator] shouldReplaceBundle:[_persistance readManifest] forNew:embeddedManifest];
}

- (void)performEnqueqedReorder
{
  if ([_persistance isReorderAtNextBootEnqueued])
  {
    [self markDownloadedCurrentAndCurrentOutdated];
    [self removeOutdatedBundle];
    [_persistance dequeueReorderAtNextBoot];
  }
}

- (void)checkAndDownloadUpdate:(nonnull EXUpdateSuccessBlock)successBlock updateUnavailable:(void (^)(void))unavailableBlock error:(nonnull EXErrorBlock)errorBlock
{
  [self downloadManifest:^(NSDictionary * _Nonnull manifest) {
    NSDictionary *oldManifest = [self->_persistance readNewestManifest];
    if(oldManifest == nil || [self->_config.manifestComparator shouldReplaceBundle:oldManifest forNew:manifest])
    {
      [self->_eventsEmitter emitDownloadStart];
      [self downloadBundle:manifest success:^(NSString *path) {
        [self->_eventsEmitter emitDownloadFinished];
        successBlock(manifest, path);
      } error:^(NSError * _Nonnull error) {
        [self->_eventsEmitter emitError];
        errorBlock(error);
      }];
    } else
    {
      [self->_eventsEmitter emitNoUpdateAvailable];
      unavailableBlock();
    }
  } error:errorBlock];
}

- (void)downloadManifest:(nonnull EXManifestSuccessBlock)successBlock error:(nonnull EXErrorBlock)errorBlock
{
  EXOtaApiClient *api = [[EXOtaApiClient alloc] init];
  [api performRequest:_config.manifestUrl withHeaders:_config.manifestRequestHeaders withTimeout:_config.manifestRequestTimeout success:^(NSData * _Nonnull response) {
    NSDictionary *responseJson = [NSJSONSerialization JSONObjectWithData:response options:kNilOptions error:nil];
    [self->_config.manifestValidator verifyManifest:responseJson success:^(NSDictionary * _Nonnull originalResponse) {
      successBlock([self extractManifestFromResponse:originalResponse]);
    } error:^(NSError * _Nonnull error) {
      
    }];
  } error:^(NSError * _Nonnull error) {
    errorBlock(error);
  }];
}

- (NSDictionary *)extractManifestFromResponse:(NSDictionary *)responseJson
{
  NSString *manifestString = [responseJson valueForKey:@"manifestString"];
  NSData *data = [manifestString dataUsingEncoding:NSUTF8StringEncoding];
  return [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:nil];
}

- (void)saveDownloadedManifest:(NSDictionary *)manifest andBundlePath:(NSString *)path
{
  NSString *previousBundle = [_persistance readDownloadedBundlePath];
  if(previousBundle != nil)
  {
    [self removeFile:previousBundle];
  }
  [_persistance storeDownloadedManifest:manifest];
  [_persistance storeDownloadedBundle:path];
}

- (void)scheduleForExchangeAtNextBoot
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
  NSString *bundlesDir = [[self bundlesDir] path];
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


- (NSSet *)validFilesSet
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

- (void)downloadBundle:(NSDictionary *)manifest success:(void (^)(NSString *path))successBlock error:(EXErrorBlock)errorBlock
{
  NSString *bundleUrl = manifest[@"bundleUrl"];
  EXOtaBundleLoader *bundleLoader = [[EXOtaBundleLoader alloc] initWithTimeout:_config.bundleRequestTimeout];
  NSString *filename = [self bundleFilenameFromManifest:manifest];
  [bundleLoader loadJSBundleFromUrl:bundleUrl withDirectory:[self bundlesDir] withFileName:filename success:successBlock error:^(NSError * _Nonnull error) {
    errorBlock(error);
  }];
}

- (void)removeFile:(NSString *)path
{
  [[NSFileManager defaultManager] removeItemAtPath:path error:nil];
}

- (NSString *)bundleFilenameFromManifest:(NSDictionary *)manifest
{
  NSString *version = manifest[@"version"];
  NSNumber *date = [NSNumber numberWithDouble:[[NSDate date] timeIntervalSince1970]];
  return [NSString stringWithFormat:@"bundle_%@_%@", version, date];
}

- (NSURL *)bundlesDir
{
  NSString *bundlesDirName = [NSString stringWithFormat:@"bundle-%@", _identifier];
  NSFileManager *fm = [NSFileManager defaultManager];
  NSString *bundleID = [[NSBundle mainBundle] bundleIdentifier];
  NSURL *dirPath = nil;
  NSArray *paths = [fm URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask];
  if([paths count] > 0)
  {
    NSURL *appSupportDir = [paths objectAtIndex:0];
    dirPath = [[appSupportDir URLByAppendingPathComponent:bundleID] URLByAppendingPathComponent:bundlesDirName isDirectory:true];
  }
  return dirPath;
}

@end
