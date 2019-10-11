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

- (void)loadJSBundleFromUrl:(NSString *)url withDirectory:(NSString *)directoryName withFileName:(NSString*)fileName success:(void (^)(NSString *path))successBlock error:(void (^)(NSError *error))errorBlock
{
    EXOtaApiClient *client = [[EXOtaApiClient alloc] init];
    [client performRequest:url withHeaders:nil withTimeout:fileTimeout success:^(NSData * _Nonnull response) {
        [self saveResponseToFile:response inDirectory:directoryName withFilename:fileName success:successBlock error:errorBlock];
    } error:errorBlock];
}

- (void)saveResponseToFile:(NSData*)response inDirectory:(NSString*)directory withFilename:(NSString*)filename success:(void (^)(NSString *path))successBlock error:(void (^)(NSError *error))errorBlock
{
    NSURL *dirUrl = [self ensureDirectoryExists:directory];
    if(dirUrl != nil)
    {
        NSURL *bundleFile = [NSURL URLWithString:filename relativeToURL:dirUrl];
        if([response writeToURL:bundleFile atomically:YES]) {
            successBlock([bundleFile absoluteString]);
        } else {
            errorBlock([[NSError alloc] initWithDomain:NSURLErrorDomain code:NSURLErrorCannotOpenFile userInfo:nil]);
        }
    } else
    {
        errorBlock([[NSError alloc] initWithDomain:NSURLErrorDomain code:NSURLErrorCannotOpenFile userInfo:nil]);
    }
}

- (NSURL*)ensureDirectoryExists:(NSString*)name
{
    NSFileManager *fm = [NSFileManager defaultManager];
    NSString *bundleID = [[NSBundle mainBundle] bundleIdentifier];
    NSURL *dirPath = nil;
    NSArray *paths = [fm URLsForDirectory:NSLibraryDirectory inDomains:NSUserDomainMask];
    
    if([paths count] > 0)
    {
        NSURL* appSupportDir = [paths objectAtIndex:0];
        dirPath = [[appSupportDir URLByAppendingPathComponent:bundleID] URLByAppendingPathComponent:name];
        NSError *theError = nil;
        if(![fm createDirectoryAtURL:dirPath withIntermediateDirectories:YES attributes:nil error:&theError]) {
            dirPath = nil;
        }
        if(theError != nil) {
            dirPath = nil;
        }
    }
    return dirPath;
}

@end
