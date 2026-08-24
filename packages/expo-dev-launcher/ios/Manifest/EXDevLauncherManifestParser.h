// Copyright 2015-present 650 Industries. All rights reserved.

@import EXManifests;

NS_ASSUME_NONNULL_BEGIN

typedef void (^IsManifestURL)(BOOL isManifestURL);
typedef void (^OnManifestParsed)(EXManifestsManifest *manifest);
typedef void (^OnManifestError)(NSError *error);

@interface EXDevLauncherManifestParser : NSObject

/**
 * YES once `isManifestURLWithCompletion:` classified the response as a live Expo dev server
 * (`Content-Type: application/expo+json`) rather than a published/EAS-Update manifest. The response
 * is still a manifest — its body is the only reliable source of the bundle URL and the transform
 * options — but the caller can use this to take the lightweight manifest path instead of the
 * `expo-updates` one.
 */
@property (nonatomic, readonly) BOOL isDevServerContentType;

- (instancetype)initWithURL:(NSURL *)url
             installationID:(NSString *)installationID
                    session:(NSURLSession *)session
             requestTimeout:(NSTimeInterval)requestTimeout;

- (void)isManifestURLWithCompletion:(IsManifestURL)completion
                            onError:(OnManifestError)onError;

- (void)tryToParseManifest:(OnManifestParsed)onParsed
                   onError:(OnManifestError)onError;

@end

NS_ASSUME_NONNULL_END
