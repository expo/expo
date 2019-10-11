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
NSString* _identifier;
EXOtaPersistance *_persistance;

- (id)initWithConfig:(id<EXOtaConfig>)config withId:(NSString*)identifier
{
    _config = config;
    _identifier = identifier;
    _persistance = [EXOtaPersistanceFactory.sharedFactory persistanceForId:identifier];
    return self;
}


- (void)checkAndDownloadUpdate:(nonnull EXUpdateSuccessBlock)successBlock error:(nonnull EXErrorBlock)errorBlock
{
    [self downloadManifest:^(NSDictionary * _Nonnull manifest) {
        [self downloadBundle:manifest success:^(NSString *path) {
            [_persistance storeManifest:manifest withBundle:path];
            successBlock(manifest, path);
        } error:errorBlock];
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

- (void)downloadBundle:(NSDictionary*)manifest success:(void (^)(NSString* path))successBlock error:(EXErrorBlock)errorBlock
{
    EXOtaBundleLoader *bundleLoader = [[EXOtaBundleLoader alloc] initWithTimeout:_config.bundleRequestTimeout];
    NSString *filename = [self bundleFilenameFromManifest:manifest];
    [bundleLoader loadJSBundleFromUrl:manifest[@"bundleUrl"] withDirectory:[self bundlesDir] withFileName:filename success:successBlock error:^(NSError * _Nonnull error) {
        errorBlock(error);
    }];
}

- (NSString*)bundleFilenameFromManifest:(NSDictionary*)manifest
{
    NSString *version = manifest[@"version"];
    NSNumber *date = [NSNumber numberWithDouble:[[NSDate date] timeIntervalSince1970]];
    return [NSString stringWithFormat:@"bundle_%@_%@", version, date];
}

- (NSString*)bundlesDir
{
    return [NSString stringWithFormat:@"bundle-%@", _identifier];
}

@end
