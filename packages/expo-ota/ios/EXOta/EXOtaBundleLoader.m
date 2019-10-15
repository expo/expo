//
//  EXOtaBundleLoader.m
//  EXOta
//
//  Created by Michał Czernek on 09/10/2019.
//

#import "EXOtaBundleLoader.h"
#import "EXOtaApiClient.h"

@implementation EXOtaBundleLoader

NSInteger fileTimeout;

- (id)initWithTimeout:(NSInteger) timeout;
{
    fileTimeout = timeout;
    return self;
}

- (void)loadJSBundleFromUrl:(NSString *)url withDirectory:(NSURL *)directory withFileName:(NSString*)fileName success:(void (^)(NSString *path))successBlock error:(void (^)(NSError *error))errorBlock
{
    EXOtaApiClient *client = [[EXOtaApiClient alloc] init];
    [client performRequest:url withHeaders:nil withTimeout:fileTimeout success:^(NSData * _Nonnull response) {
        [self saveResponseToFile:response inDirectory:directory withFilename:fileName success:successBlock error:errorBlock];
    } error:errorBlock];
}

- (void)saveResponseToFile:(NSData*)response inDirectory:(NSURL*)directory withFilename:(NSString*)filename success:(void (^)(NSString *path))successBlock error:(void (^)(NSError *error))errorBlock
{
    NSURL *dirUrl = [self ensureDirectoryExists:directory];
    if(dirUrl != nil)
    {
        NSURL *bundleFile = [NSURL URLWithString:filename relativeToURL:dirUrl];
        if([response writeToURL:bundleFile atomically:YES]) {
            [bundleFile setResourceValue:[NSNumber numberWithBool:YES] forKey:NSURLIsExcludedFromBackupKey error:nil];
            successBlock([bundleFile path]);
        } else {
            errorBlock([[NSError alloc] initWithDomain:NSURLErrorDomain code:NSURLErrorCannotOpenFile userInfo:nil]);
        }
    } else
    {
        errorBlock([[NSError alloc] initWithDomain:NSURLErrorDomain code:NSURLErrorCannotOpenFile userInfo:nil]);
    }
}

- (NSURL*)ensureDirectoryExists:(NSURL*)directory
{
    NSFileManager *fm = [NSFileManager defaultManager];
    NSURL *dirPath = nil;
    NSError *theError;
    if(![fm createDirectoryAtPath:[directory path] withIntermediateDirectories:YES attributes:nil error:&theError]) {
        dirPath = nil;
    } else {
        dirPath = directory;
    }
    return dirPath;
}

@end
