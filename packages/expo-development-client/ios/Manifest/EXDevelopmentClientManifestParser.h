// Copyright 2015-present 650 Industries. All rights reserved.


NS_ASSUME_NONNULL_BEGIN
@class EXDevelopmentClientManifest;

typedef void (^OnManifestParsed)(EXDevelopmentClientManifest *manifest);
typedef void (^OnInvalidManifestURL)();
typedef void (^OnManifestError)(NSError *error);

@interface EXDevelopmentClientManifestParser : NSObject

- (instancetype)initWithURL:(NSURL *)url session:(NSURLSession *)session;

- (void)tryToParseManifest:(OnManifestParsed)onParsed onInalidURL:(OnInvalidManifestURL)onInalidURL onError:(OnManifestError)onError;

@end

NS_ASSUME_NONNULL_END
