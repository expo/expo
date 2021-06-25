// Copyright 2015-present 650 Industries. All rights reserved.

NS_ASSUME_NONNULL_BEGIN

@class EXDevLauncherManifest;

typedef void (^IsManifestURL)(BOOL isManifestURL);
typedef void (^OnManifestParsed)(EXDevLauncherManifest *manifest);
typedef void (^OnManifestError)(NSError *error);

@interface EXDevLauncherManifestParser : NSObject

- (instancetype)initWithURL:(NSURL *)url session:(NSURLSession *)session;

- (void)isManifestURLWithCompletion:(IsManifestURL)completion
                            onError:(OnManifestError)onError;

- (void)tryToParseManifest:(OnManifestParsed)onParsed
                   onError:(OnManifestError)onError;

@end

NS_ASSUME_NONNULL_END
