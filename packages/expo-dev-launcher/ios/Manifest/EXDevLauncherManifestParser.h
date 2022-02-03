// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXManifests/EXManifestsManifest.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^IsManifestURL)(BOOL isManifestURL);
typedef void (^OnManifestParsed)(EXManifestsManifest *manifest);
typedef void (^OnManifestError)(NSError *error);

@interface EXDevLauncherManifestParser : NSObject

- (instancetype)initWithURL:(NSURL *)url
             installationID:(NSString *)installationID
                    session:(NSURLSession *)session;

- (void)isManifestURLWithCompletion:(IsManifestURL)completion
                            onError:(OnManifestError)onError;

- (void)tryToParseManifest:(OnManifestParsed)onParsed
                   onError:(OnManifestError)onError;

@end

NS_ASSUME_NONNULL_END
