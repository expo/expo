//
//  SEGFileStorage.m
//  Analytics
//
//  Copyright © 2016 Segment. All rights reserved.
//

#import "SEGUtils.h"
#import "SEGFileStorage.h"
#import "SEGCrypto.h"


@interface SEGFileStorage ()

@property (nonatomic, strong, nonnull) NSURL *folderURL;

@end


@implementation SEGFileStorage

- (instancetype)init
{
    return [self initWithFolder:[SEGFileStorage applicationSupportDirectoryURL] crypto:nil];
}

- (instancetype)initWithFolder:(NSURL *)folderURL crypto:(id<SEGCrypto>)crypto
{
    if (self = [super init]) {
        _folderURL = folderURL;
        _crypto = crypto;
        [self createDirectoryAtURLIfNeeded:folderURL];
        return self;
    }
    return nil;
}

- (void)removeKey:(NSString *)key
{
    NSURL *url = [self urlForKey:key];
    NSError *error = nil;
    if (![[NSFileManager defaultManager] removeItemAtURL:url error:&error]) {
        SEGLog(@"Unable to remove key %@ - error removing file at path %@", key, url);
    }
}

- (void)resetAll
{
    NSError *error = nil;
    if (![[NSFileManager defaultManager] removeItemAtURL:self.folderURL error:&error]) {
        SEGLog(@"ERROR: Unable to reset file storage. Path cannot be removed - %@", self.folderURL.path);
    }
    [self createDirectoryAtURLIfNeeded:self.folderURL];
}

- (void)setData:(NSData *)data forKey:(NSString *)key
{
    NSURL *url = [self urlForKey:key];
    if (self.crypto) {
        NSData *encryptedData = [self.crypto encrypt:data];
        [encryptedData writeToURL:url atomically:YES];
    } else {
        [data writeToURL:url atomically:YES];
    }

    NSError *error = nil;
    if (![url setResourceValue:@YES
                        forKey:NSURLIsExcludedFromBackupKey
                         error:&error]) {
        SEGLog(@"Error excluding %@ from backup %@", [url lastPathComponent], error);
    }
}

- (NSData *)dataForKey:(NSString *)key
{
    NSURL *url = [self urlForKey:key];
    NSData *data = [NSData dataWithContentsOfURL:url];
    if (!data) {
        SEGLog(@"WARNING: No data file for key %@", key);
        return nil;
    }
    if (self.crypto) {
        return [self.crypto decrypt:data];
    }
    return data;
}

- (NSDictionary *)dictionaryForKey:(NSString *)key
{
    return [self plistForKey:key];
}

- (void)setDictionary:(NSDictionary *)dictionary forKey:(NSString *)key
{
    [self setPlist:dictionary forKey:key];
}

- (NSArray *)arrayForKey:(NSString *)key
{
    return [self plistForKey:key];
}

- (void)setArray:(NSArray *)array forKey:(NSString *)key
{
    [self setPlist:array forKey:key];
}

- (NSString *)stringForKey:(NSString *)key
{
    return [self plistForKey:key];
}

- (void)setString:(NSString *)string forKey:(NSString *)key
{
    [self setPlist:string forKey:key];
}

+ (NSURL *)applicationSupportDirectoryURL
{
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES);
    NSString *supportPath = [paths firstObject];
    return [NSURL fileURLWithPath:supportPath];
}

- (NSURL *)urlForKey:(NSString *)key
{
    return [self.folderURL URLByAppendingPathComponent:key];
}

#pragma mark - Helpers

- (id _Nullable)plistForKey:(NSString *)key
{
    NSData *data = [self dataForKey:key];
    return data ? [self plistFromData:data] : nil;
}

- (void)setPlist:(id _Nonnull)plist forKey:(NSString *)key
{
    NSData *data = [self dataFromPlist:plist];
    if (data) {
        [self setData:data forKey:key];
    }
}

- (NSData *_Nullable)dataFromPlist:(nonnull id)plist
{
    NSError *error = nil;
    NSData *data = [NSPropertyListSerialization dataWithPropertyList:plist
                                                              format:NSPropertyListXMLFormat_v1_0
                                                             options:0
                                                               error:&error];
    if (error) {
        SEGLog(@"Unable to serialize data from plist object", error, plist);
    }
    return data;
}

- (id _Nullable)plistFromData:(NSData *_Nonnull)data
{
    NSError *error = nil;
    id plist = [NSPropertyListSerialization propertyListWithData:data
                                                         options:0
                                                          format:nil
                                                           error:&error];
    if (error) {
        SEGLog(@"Unable to parse plist from data %@", error);
    }
    return plist;
}

- (void)createDirectoryAtURLIfNeeded:(NSURL *)url
{
    if (![[NSFileManager defaultManager] fileExistsAtPath:url.path
                                              isDirectory:NULL]) {
        NSError *error = nil;
        if (![[NSFileManager defaultManager] createDirectoryAtPath:url.path
                                       withIntermediateDirectories:YES
                                                        attributes:nil
                                                             error:&error]) {
            SEGLog(@"error: %@", error.localizedDescription);
        }
    }
}

@end
