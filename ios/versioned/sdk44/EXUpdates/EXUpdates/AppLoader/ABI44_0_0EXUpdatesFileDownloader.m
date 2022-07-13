//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesCrypto.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesErrorRecovery.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesFileDownloader.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesSelectionPolicies.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesMultipartStreamReader.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesParameterParser.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesManifestHeaders.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAppController.h>

@import ABI44_0_0EASClient;

#if __has_include(<ABI44_0_0EXUpdates/ABI44_0_0EXUpdates-Swift.h>)
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdates-Swift.h>
#else
#import "ABI44_0_0EXUpdates-Swift.h"
#endif

NS_ASSUME_NONNULL_BEGIN

NSTimeInterval const ABI44_0_0EXUpdatesDefaultTimeoutInterval = 60;

NSString * const ABI44_0_0EXUpdatesMultipartManifestPartName = @"manifest";
NSString * const ABI44_0_0EXUpdatesMultipartExtensionsPartName = @"extensions";
NSString * const ABI44_0_0EXUpdatesMultipartCertificateChainPartName = @"certificate_chain";

NSString * const ABI44_0_0EXUpdatesFileDownloaderErrorDomain = @"ABI44_0_0EXUpdatesFileDownloader";
const NSInteger ABI44_0_0EXUpdatesFileDownloaderErrorCodeFileWriteError = 1002;
const NSInteger ABI44_0_0EXUpdatesFileDownloaderErrorCodeManifestVerificationError = 1003;
const NSInteger ABI44_0_0EXUpdatesFileDownloaderErrorCodeNoCompatibleUpdateError = 1009;
const NSInteger ABI44_0_0EXUpdatesFileDownloaderErrorCodeMismatchedManifestFiltersError = 1021;
const NSInteger ABI44_0_0EXUpdatesFileDownloaderErrorCodeManifestParseError = 1022;
const NSInteger ABI44_0_0EXUpdatesFileDownloaderErrorCodeInvalidResponseError = 1040;
const NSInteger ABI44_0_0EXUpdatesFileDownloaderErrorCodeManifestStringError = 1041;
const NSInteger ABI44_0_0EXUpdatesFileDownloaderErrorCodeManifestJSONError = 1042;
const NSInteger ABI44_0_0EXUpdatesFileDownloaderErrorCodeManifestSignatureError = 1043;
const NSInteger ABI44_0_0EXUpdatesFileDownloaderErrorCodeMultipartParsingError = 1044;
const NSInteger ABI44_0_0EXUpdatesFileDownloaderErrorCodeMultipartMissingManifestError = 1045;
const NSInteger ABI44_0_0EXUpdatesFileDownloaderErrorCodeMissingMultipartBoundaryError = 1047;
const NSInteger ABI44_0_0EXUpdatesFileDownloaderErrorCodeCodeSigningSignatureError = 1048;

@interface ABI44_0_0EXUpdatesFileDownloader () <NSURLSessionDataDelegate>

@property (nonatomic, strong) NSURLSession *session;
@property (nonatomic, strong) NSURLSessionConfiguration *sessionConfiguration;
@property (nonatomic, strong) ABI44_0_0EXUpdatesConfig *config;

@end

@implementation ABI44_0_0EXUpdatesFileDownloader

- (instancetype)initWithUpdatesConfig:(ABI44_0_0EXUpdatesConfig *)updatesConfig
{
  return [self initWithUpdatesConfig:updatesConfig
             URLSessionConfiguration:NSURLSessionConfiguration.defaultSessionConfiguration];
}

- (instancetype)initWithUpdatesConfig:(ABI44_0_0EXUpdatesConfig *)updatesConfig
              URLSessionConfiguration:(NSURLSessionConfiguration *)sessionConfiguration
{
  if (self = [super init]) {
    _sessionConfiguration = sessionConfiguration;
    _session = [NSURLSession sessionWithConfiguration:_sessionConfiguration delegate:self delegateQueue:nil];
    _config = updatesConfig;
  }
  return self;
}

- (void)dealloc
{
  [_session finishTasksAndInvalidate];
}

+ (dispatch_queue_t)assetFilesQueue
{
  static dispatch_queue_t theQueue;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theQueue) {
      theQueue = dispatch_queue_create("expo.controller.AssetFilesQueue", DISPATCH_QUEUE_SERIAL);
    }
  });
  return theQueue;
}

- (void)downloadFileFromURL:(NSURL *)url
                     toPath:(NSString *)destinationPath
               extraHeaders:(NSDictionary *)extraHeaders
               successBlock:(ABI44_0_0EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI44_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock
{
  [self downloadDataFromURL:url extraHeaders:extraHeaders successBlock:^(NSData *data, NSURLResponse *response) {
    NSError *error;
    if ([data writeToFile:destinationPath options:NSDataWritingAtomic error:&error]) {
      successBlock(data, response);
    } else {
      errorBlock([NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                     code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeFileWriteError
                                 userInfo:@{
                                   NSLocalizedDescriptionKey: [NSString stringWithFormat:@"Could not write to path %@: %@", destinationPath, error.localizedDescription],
                                   NSUnderlyingErrorKey: error
                                 }
                  ]);
    }
  } errorBlock:errorBlock];
}

- (NSURLRequest *)createManifestRequestWithURL:(NSURL *)url extraHeaders:(nullable NSDictionary *)extraHeaders
{
  NSURLRequestCachePolicy cachePolicy = _sessionConfiguration ? _sessionConfiguration.requestCachePolicy : NSURLRequestUseProtocolCachePolicy;

  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url cachePolicy:cachePolicy timeoutInterval:ABI44_0_0EXUpdatesDefaultTimeoutInterval];
  [self _setManifestHTTPHeaderFields:request withExtraHeaders:extraHeaders];

  return request;
}

- (NSURLRequest *)createGenericRequestWithURL:(NSURL *)url extraHeaders:(NSDictionary *)extraHeaders
{
  // pass any custom cache policy onto this specific request
  NSURLRequestCachePolicy cachePolicy = _sessionConfiguration ? _sessionConfiguration.requestCachePolicy : NSURLRequestUseProtocolCachePolicy;

  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url cachePolicy:cachePolicy timeoutInterval:ABI44_0_0EXUpdatesDefaultTimeoutInterval];
  [self _setHTTPHeaderFields:request extraHeaders:extraHeaders];

  return request;
}

- (void)parseManifestResponse:(NSHTTPURLResponse *)httpResponse
                     withData:(NSData *)data
                     database:(ABI44_0_0EXUpdatesDatabase *)database
                 successBlock:(ABI44_0_0EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                   errorBlock:(ABI44_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock {
  NSDictionary *headerDictionary = [httpResponse allHeaderFields];
  id contentTypeRaw;
  for (NSString *key in headerDictionary) {
    if ([key caseInsensitiveCompare: @"content-type"] == NSOrderedSame) {
      contentTypeRaw = headerDictionary[key];
    }
  }

  NSString *contentType;
  if (contentTypeRaw != nil && [contentTypeRaw isKindOfClass:[NSString class]]) {
    contentType = contentTypeRaw;
  } else {
    contentType = @"";
  }

  if ([[contentType lowercaseString] hasPrefix:@"multipart/"]) {
    NSDictionary<NSString *, NSString *> *contentTypeParameters = [[ABI44_0_0EXUpdatesParameterParser new] parseParameterString:contentType withDelimiter:';'];
    NSString *boundaryParameterValue = contentTypeParameters[@"boundary"];

    if (boundaryParameterValue == nil) {
      NSError *error = [NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                           code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeMissingMultipartBoundaryError
                                       userInfo:@{
        NSLocalizedDescriptionKey: @"Missing boundary in multipart manifest content-type",
      }];
      errorBlock(error);
      return;
    }

    return [self parseMultipartManifestResponse:httpResponse
                                       withData:data
                                       database:database
                                       boundary:boundaryParameterValue
                                   successBlock:successBlock
                                     errorBlock:errorBlock];
  } else {
    // can use valueForHTTPHeaderField after dropping iOS 12 support
    NSDictionary *responseHeaders = [httpResponse allHeaderFields];
    ABI44_0_0EXUpdatesManifestHeaders *manifestHeaders = [[ABI44_0_0EXUpdatesManifestHeaders alloc] initWithProtocolVersion:responseHeaders[@"expo-protocol-version"]
                                                                                     serverDefinedHeaders:responseHeaders[@"expo-server-defined-headers"]
                                                                                          manifestFilters:responseHeaders[@"expo-manifest-filters"]
                                                                                        manifestSignature:responseHeaders[@"expo-manifest-signature"]
                                                                                                signature:responseHeaders[@"expo-signature"]];

    return [self parseManifestBodyData:data
                       manifestHeaders:manifestHeaders
                            extensions:@{}
  certificateChainFromManifestResponse:nil
                              database:database
                          successBlock:successBlock
                            errorBlock:errorBlock];
  }
}

- (void)parseMultipartManifestResponse:(NSHTTPURLResponse *)httpResponse
                              withData:(NSData *)data
                              database:(ABI44_0_0EXUpdatesDatabase *)database
                              boundary:(NSString *)boundary
                          successBlock:(ABI44_0_0EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                            errorBlock:(ABI44_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock {
  NSInputStream *inputStream = [[NSInputStream alloc] initWithData:data];
  ABI44_0_0EXUpdatesMultipartStreamReader *reader = [[ABI44_0_0EXUpdatesMultipartStreamReader alloc] initWithInputStream:inputStream boundary:boundary];

  __block NSDictionary *manifestPartHeaders = nil;
  __block NSData *manifestPartData = nil;
  __block NSData *extensionsData = nil;
  __block NSData *certificateChainStringData = nil;

  BOOL completed = [reader readAllPartsWithCompletionCallback:^(NSDictionary *headers, NSData *content, BOOL done) {
    id contentDispositionRaw;
    for (NSString *key in headers) {
      if ([key caseInsensitiveCompare: @"content-disposition"] == NSOrderedSame) {
        contentDispositionRaw = headers[key];
      }
    }

    NSString *contentDisposition = nil;
    if (contentDispositionRaw != nil && [contentDispositionRaw isKindOfClass:[NSString class]]) {
      contentDisposition = contentDispositionRaw;
    }

    if (contentDisposition != nil) {
      NSDictionary<NSString *, NSString *> *contentDispositionParameters = [[ABI44_0_0EXUpdatesParameterParser new] parseParameterString:contentDisposition withDelimiter:';'];
      NSString *contentDispositionNameFieldValue = contentDispositionParameters[@"name"];
      if (contentDispositionNameFieldValue != nil) {
        if ([contentDispositionNameFieldValue isEqualToString:ABI44_0_0EXUpdatesMultipartManifestPartName]) {
          manifestPartHeaders = headers;
          manifestPartData = content;
        } else if ([contentDispositionNameFieldValue isEqualToString:ABI44_0_0EXUpdatesMultipartExtensionsPartName]) {
          extensionsData = content;
        } else if ([contentDispositionNameFieldValue isEqualToString:ABI44_0_0EXUpdatesMultipartCertificateChainPartName]) {
          certificateChainStringData = content;
        }
      }
    }
  }];

  if (!completed) {
    NSError *error = [NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                         code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeMultipartParsingError
                                     userInfo:@{
      NSLocalizedDescriptionKey: @"Could not read multipart manifest response",
    }];
    errorBlock(error);
    return;
  }

  if (manifestPartHeaders == nil || manifestPartData == nil) {
    NSError *error = [NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                         code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeMultipartMissingManifestError
                                     userInfo:@{
      NSLocalizedDescriptionKey: @"Multipart manifest response missing manifest part",
    }];
    errorBlock(error);
    return;
  }

  NSDictionary *extensions;
  if (extensionsData != nil) {
    NSError *extensionsParsingError;
    id parsedExtensions = [NSJSONSerialization JSONObjectWithData:extensionsData options:kNilOptions error:&extensionsParsingError];
    if (extensionsParsingError) {
      errorBlock(extensionsParsingError);
      return;
    }

    if ([parsedExtensions isKindOfClass:[NSDictionary class]]) {
      extensions = parsedExtensions;
    } else {
      NSError *error = [NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                           code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeMultipartParsingError
                                       userInfo:@{
        NSLocalizedDescriptionKey: @"Failed to parse multipart manifest extensions",
      }];
      errorBlock(error);
      return;
    }
  }

  NSString *certificateChain = nil;
  if (certificateChainStringData != nil) {
    certificateChain = [[NSString alloc] initWithData:certificateChainStringData encoding:NSUTF8StringEncoding];
  }

  NSDictionary *responseHeaders = [httpResponse allHeaderFields];
  ABI44_0_0EXUpdatesManifestHeaders *manifestHeaders = [[ABI44_0_0EXUpdatesManifestHeaders alloc] initWithProtocolVersion:responseHeaders[@"expo-protocol-version"]
                                                                                   serverDefinedHeaders:responseHeaders[@"expo-server-defined-headers"]
                                                                                        manifestFilters:responseHeaders[@"expo-manifest-filters"]
                                                                                      manifestSignature:responseHeaders[@"expo-manifest-signature"]
                                                                                              signature:manifestPartHeaders[@"expo-signature"]];

  return [self parseManifestBodyData:manifestPartData
                     manifestHeaders:manifestHeaders
                          extensions:extensions
certificateChainFromManifestResponse:certificateChain
                            database:database
                        successBlock:successBlock
                          errorBlock:errorBlock];
}

- (void)parseManifestBodyData:(NSData *)manifestBodyData
              manifestHeaders:(ABI44_0_0EXUpdatesManifestHeaders *)manifestHeaders
                   extensions:(NSDictionary *)extensions
certificateChainFromManifestResponse:(nullable NSString *)certificateChainFromManifestResponse
                     database:(ABI44_0_0EXUpdatesDatabase *)database
                 successBlock:(ABI44_0_0EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                   errorBlock:(ABI44_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock {
  id headerSignature = manifestHeaders.manifestSignature;

  NSError *error;
  id manifestBodyJson = [NSJSONSerialization JSONObjectWithData:manifestBodyData options:kNilOptions error:&error];
  if (error) {
    errorBlock(error);
    return;
  }

  NSDictionary *updateResponseDictionary = [self _extractUpdateResponseDictionary:manifestBodyJson error:&error];
  if (error) {
    errorBlock(error);
    return;
  }

  id bodyManifestString = updateResponseDictionary[@"manifestString"];
  id bodySignature = updateResponseDictionary[@"signature"];
  BOOL isSignatureInBody = bodyManifestString != nil && bodySignature != nil;

  id signature = isSignatureInBody ? bodySignature : headerSignature;
  id manifestString = isSignatureInBody ? bodyManifestString : [[NSString alloc] initWithData:manifestBodyData encoding:NSUTF8StringEncoding];

  // XDL serves unsigned manifests with the `signature` key set to "UNSIGNED".
  // We should treat these manifests as unsigned rather than signed with an invalid signature.
  BOOL isUnsignedFromXDL = [(NSString *)signature isEqualToString:@"UNSIGNED"];

  if (![manifestString isKindOfClass:[NSString class]]) {
    errorBlock([NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                   code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeManifestStringError
                               userInfo:@{
                                 NSLocalizedDescriptionKey: @"manifestString should be a string",
                               }
                ]);
    return;
  }
  NSDictionary *manifest = [NSJSONSerialization JSONObjectWithData:[(NSString *)manifestString dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:&error];
  if (error || !manifest || ![manifest isKindOfClass:[NSDictionary class]]) {
    errorBlock([NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                   code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeManifestJSONError
                               userInfo:@{
                                 NSLocalizedDescriptionKey: @"manifest should be a valid JSON object",
                               }
                ]);
    return;
  }


  if (signature != nil && !isUnsignedFromXDL) {
    if (![signature isKindOfClass:[NSString class]]) {
      errorBlock([NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                     code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeManifestSignatureError
                                 userInfo:@{
                                   NSLocalizedDescriptionKey: @"signature should be a string",
                                 }
                  ]);
      return;
    }
    [ABI44_0_0EXUpdatesCrypto verifySignatureWithData:(NSString *)manifestString
                                   signature:(NSString *)signature
                                      config:self->_config
                                successBlock:^(BOOL isValid) {
                                                if (isValid) {
                                                  [self _createUpdateWithManifest:manifest
                                                                 manifestBodyData:manifestBodyData
                                                                  manifestHeaders:manifestHeaders
                                                                       extensions:extensions
                                             certificateChainFromManifestResponse:certificateChainFromManifestResponse
                                                                         database:database
                                                                       isVerified:YES
                                                                     successBlock:successBlock
                                                                       errorBlock:errorBlock];
                                                } else {
                                                  NSError *error = [NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                                                                       code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeManifestVerificationError
                                                                                   userInfo:@{NSLocalizedDescriptionKey: @"Manifest verification failed"}];
                                                  errorBlock(error);
                                                }
                                              }
                                  errorBlock:^(NSError *error) {
                                                errorBlock(error);
                                              }
    ];
  } else {
    [self _createUpdateWithManifest:manifest
                   manifestBodyData:manifestBodyData
                    manifestHeaders:manifestHeaders
                         extensions:extensions
certificateChainFromManifestResponse:certificateChainFromManifestResponse
                           database:database
                         isVerified:NO
                       successBlock:successBlock
                         errorBlock:errorBlock];
  }
}

- (void)downloadManifestFromURL:(NSURL *)url
                   withDatabase:(ABI44_0_0EXUpdatesDatabase *)database
                   extraHeaders:(nullable NSDictionary *)extraHeaders
                   successBlock:(ABI44_0_0EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                     errorBlock:(ABI44_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock
{
  NSURLRequest *request = [self createManifestRequestWithURL:url extraHeaders:extraHeaders];
  [self _downloadDataWithRequest:request successBlock:^(NSData *data, NSURLResponse *response) {
    if (![response isKindOfClass:[NSHTTPURLResponse class]]) {
      errorBlock([NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                     code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeInvalidResponseError
                                 userInfo:@{
                                   NSLocalizedDescriptionKey: @"response must be a NSHTTPURLResponse",
                                 }
                  ]);
      return;
    }
    return [self parseManifestResponse:(NSHTTPURLResponse *)response
                              withData:data
                              database:database
                          successBlock:successBlock
                            errorBlock:errorBlock];
  } errorBlock:errorBlock];
}

- (void)_createUpdateWithManifest:(NSDictionary *)manifest
                 manifestBodyData:(NSData *)manifestBodyData
                  manifestHeaders:(ABI44_0_0EXUpdatesManifestHeaders *)manifestHeaders
                       extensions:(NSDictionary *)extensions
certificateChainFromManifestResponse:(nullable NSString *)certificateChainFromManifestResponse
                         database:(ABI44_0_0EXUpdatesDatabase *)database
                       isVerified:(BOOL)isVerified
                     successBlock:(ABI44_0_0EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                       errorBlock:(ABI44_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock
{
  NSMutableDictionary *mutableManifest = manifest.mutableCopy;
  if (_config.expectsSignedManifest) {
    // There are a few cases in Expo Go where we still want to use the unsigned manifest anyway, so don't mark it as unverified.
    mutableManifest[@"isVerified"] = @(isVerified);
  }

  // check code signing if code signing is configured
  // 1. verify the code signing signature (throw if invalid)
  // 2. then, if the code signing certificate is only valid for a particular project, verify that the manifest
  //    has the correct info for code signing. If the code signing certificate doesn't specify a particular
  //    project, it is assumed to be valid for all projects
  // 3. mark the manifest as verified if both of these pass
  ABI44_0_0EXUpdatesCodeSigningConfiguration *codeSigningConfiguration = _config.codeSigningConfiguration;
  if (codeSigningConfiguration) {
    NSError *error;
    ABI44_0_0EXUpdatesSignatureValidationResult *signatureValidationResult = [codeSigningConfiguration validateSignatureWithSignature:manifestHeaders.signature
                                                  signedData:manifestBodyData
                            manifestResponseCertificateChain:certificateChainFromManifestResponse
                                                       error:&error];
    if (error) {
      NSString *message = [ABI44_0_0EXUpdatesCodeSigningErrorUtils messageForError:error.code];
      errorBlock([NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                     code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeCodeSigningSignatureError
                                 userInfo:@{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"Downloaded manifest signature is invalid: %@", message]}]);
      return;
    }

    if (signatureValidationResult.validationResult == ABI44_0_0EXUpdatesValidationResultInvalid) {
      errorBlock([NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                     code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeCodeSigningSignatureError
                                 userInfo:@{NSLocalizedDescriptionKey: @"Manifest download was successful, but signature was incorrect"}]);
      return;
    }

    if (signatureValidationResult.validationResult != ABI44_0_0EXUpdatesValidationResultSkipped) {
      ABI44_0_0EXUpdatesExpoProjectInformation *expoProjectInformation = signatureValidationResult.expoProjectInformation;
      if (expoProjectInformation != nil) {
        NSError *error;
        ABI44_0_0EXUpdatesUpdate *update;
        @try {
          update = [ABI44_0_0EXUpdatesUpdate updateWithManifest:mutableManifest
                                       manifestHeaders:manifestHeaders
                                            extensions:extensions
                                                config:_config
                                              database:database
                                                 error:&error];
        }
        @catch (NSException *exception) {
          // Catch any assertions related to parsing the manifest JSON,
          // this will ensure invalid manifests can be easily debugged.
          // For example, this will catch nullish sdkVersion assertions.
          error = [NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                      code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeManifestParseError
                                  userInfo:@{NSLocalizedDescriptionKey: [@"Failed to parse manifest: " stringByAppendingString:exception.reason] }];
        }
        if (error) {
          errorBlock(error);
          return;
        }

        ABI44_0_0EXManifestsManifest *manifestForProjectInformation = update.manifest;
        if (![expoProjectInformation.projectId isEqualToString:manifestForProjectInformation.easProjectId] ||
            ![expoProjectInformation.scopeKey isEqualToString:manifestForProjectInformation.scopeKey]) {
          errorBlock([NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                         code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeCodeSigningSignatureError
                                     userInfo:@{NSLocalizedDescriptionKey: @"Invalid certificate for manifest project ID or scope key"}]);
          return;
        }
      }

      mutableManifest[@"isVerified"] = @YES;
    }
  }



  NSError *error;
  ABI44_0_0EXUpdatesUpdate *update;
  @try {
    update = [ABI44_0_0EXUpdatesUpdate updateWithManifest:mutableManifest
                                 manifestHeaders:manifestHeaders
                                      extensions:extensions
                                          config:_config
                                        database:database
                                           error:&error];
  }
  @catch (NSException *exception) {
    // Catch any assertions related to parsing the manifest JSON,
    // this will ensure invalid manifests can be easily debugged.
    // For example, this will catch nullish sdkVersion assertions.
    error = [NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeManifestParseError
                            userInfo:@{NSLocalizedDescriptionKey: [@"Failed to parse manifest: " stringByAppendingString:exception.reason] }];
  }

  if (error) {
    errorBlock(error);
    return;
  }

  if (![ABI44_0_0EXUpdatesSelectionPolicies doesUpdate:update matchFilters:update.manifestFilters]) {
    NSError *error = [NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                         code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeMismatchedManifestFiltersError
                                     userInfo:@{NSLocalizedDescriptionKey: @"Downloaded manifest is invalid; provides filters that do not match its content"}];
    errorBlock(error);
  } else {
    successBlock(update);
  }
}

- (void)downloadDataFromURL:(NSURL *)url
               extraHeaders:(NSDictionary *)extraHeaders
               successBlock:(ABI44_0_0EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(ABI44_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock
{
  NSURLRequest *request = [self createGenericRequestWithURL:url extraHeaders:extraHeaders];
  [self _downloadDataWithRequest:request successBlock:successBlock errorBlock:errorBlock];
}

- (void)_downloadDataWithRequest:(NSURLRequest *)request
                    successBlock:(ABI44_0_0EXUpdatesFileDownloaderSuccessBlock)successBlock
                      errorBlock:(ABI44_0_0EXUpdatesFileDownloaderErrorBlock)errorBlock
{
  NSURLSessionDataTask *task = [_session dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    if (!error && [response isKindOfClass:[NSHTTPURLResponse class]]) {
      NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
      if (httpResponse.statusCode < 200 || httpResponse.statusCode >= 300) {
        NSStringEncoding encoding = [self _encodingFromResponse:response];
        NSString *body = [[NSString alloc] initWithData:data encoding:encoding];
        error = [self _errorFromResponse:httpResponse body:body];
      }
    }

    if (error) {
      errorBlock(error);
    } else {
      successBlock(data, response);
    }
  }];
  [task resume];
}

- (nullable NSDictionary *)_extractUpdateResponseDictionary:(id)parsedJson error:(NSError **)error
{
  if ([parsedJson isKindOfClass:[NSDictionary class]]) {
    return (NSDictionary *)parsedJson;
  } else if ([parsedJson isKindOfClass:[NSArray class]]) {
    // TODO: either add support for runtimeVersion or deprecate multi-manifests
    for (id providedManifest in (NSArray *)parsedJson) {
      if ([providedManifest isKindOfClass:[NSDictionary class]] && providedManifest[@"sdkVersion"]){
        NSString *sdkVersion = providedManifest[@"sdkVersion"];
        NSArray<NSString *> *supportedSdkVersions = [_config.sdkVersion componentsSeparatedByString:@","];
        if ([supportedSdkVersions containsObject:sdkVersion]){
          return providedManifest;
        }
      }
    }
  }

  if (error) {
    *error = [NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain
                                 code:ABI44_0_0EXUpdatesFileDownloaderErrorCodeNoCompatibleUpdateError
                             userInfo:@{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"No compatible update found at %@. Only %@ are supported.", _config.updateUrl.absoluteString, _config.sdkVersion]}];
  }
  return nil;
}

- (void)_setHTTPHeaderFields:(NSMutableURLRequest *)request
                extraHeaders:(NSDictionary *)extraHeaders
{
  for (NSString *key in extraHeaders) {
    [request setValue:extraHeaders[key] forHTTPHeaderField:key];
  }

  [request setValue:@"ios" forHTTPHeaderField:@"Expo-Platform"];
  [request setValue:@"1" forHTTPHeaderField:@"Expo-API-Version"];
  [request setValue:@"BARE" forHTTPHeaderField:@"Expo-Updates-Environment"];
  [request setValue:EASClientID.uuid.UUIDString forHTTPHeaderField:@"EAS-Client-ID"];

  for (NSString *key in _config.requestHeaders) {
    [request setValue:_config.requestHeaders[key] forHTTPHeaderField:key];
  }
}

- (void)_setManifestHTTPHeaderFields:(NSMutableURLRequest *)request withExtraHeaders:(nullable NSDictionary *)extraHeaders
{
  // apply extra headers before anything else, so they don't override preset headers
  if (extraHeaders) {
    for (NSString *key in extraHeaders) {
      id value = extraHeaders[key];
      if ([value isKindOfClass:[NSString class]]) {
        [request setValue:value forHTTPHeaderField:key];
      } else if ([value isKindOfClass:[NSNumber class]]) {
        if (CFGetTypeID((__bridge CFTypeRef)(value)) == CFBooleanGetTypeID()) {
          [request setValue:((NSNumber *)value).boolValue ? @"true" : @"false" forHTTPHeaderField:key];
        } else {
          [request setValue:((NSNumber *)value).stringValue forHTTPHeaderField:key];
        }
      } else {
        [request setValue:[(NSObject *)value description] forHTTPHeaderField:key];
      }
    }
  }

  [request setValue:@"multipart/mixed,application/expo+json,application/json" forHTTPHeaderField:@"Accept"];
  [request setValue:@"ios" forHTTPHeaderField:@"Expo-Platform"];
  [request setValue:@"1" forHTTPHeaderField:@"Expo-API-Version"];
  [request setValue:@"BARE" forHTTPHeaderField:@"Expo-Updates-Environment"];
  [request setValue:EASClientID.uuid.UUIDString forHTTPHeaderField:@"EAS-Client-ID"];
  [request setValue:@"true" forHTTPHeaderField:@"Expo-JSON-Error"];
  [request setValue:(_config.expectsSignedManifest ? @"true" : @"false") forHTTPHeaderField:@"Expo-Accept-Signature"];
  [request setValue:_config.releaseChannel forHTTPHeaderField:@"Expo-Release-Channel"];

  NSString *runtimeVersion = _config.runtimeVersion;
  if (runtimeVersion) {
    [request setValue:runtimeVersion forHTTPHeaderField:@"Expo-Runtime-Version"];
  } else {
    [request setValue:_config.sdkVersion forHTTPHeaderField:@"Expo-SDK-Version"];
  }

  NSString *previousFatalError = [ABI44_0_0EXUpdatesErrorRecovery consumeErrorLog];
  if (previousFatalError) {
    // some servers can have max length restrictions for headers,
    // so we restrict the length of the string to 1024 characters --
    // this should satisfy the requirements of most servers
    if ([previousFatalError length] > 1024) {
      previousFatalError = [previousFatalError substringToIndex:1024];
    }
    [request setValue:previousFatalError forHTTPHeaderField:@"Expo-Fatal-Error"];
  }

  for (NSString *key in _config.requestHeaders) {
    [request setValue:_config.requestHeaders[key] forHTTPHeaderField:key];
  }

  ABI44_0_0EXUpdatesCodeSigningConfiguration *codeSigningConfiguration = _config.codeSigningConfiguration;
  if (codeSigningConfiguration) {
    [request setValue:[codeSigningConfiguration createAcceptSignatureHeader] forHTTPHeaderField:@"expo-expect-signature"];
  }
}

+ (NSDictionary *)extraHeadersWithDatabase:(ABI44_0_0EXUpdatesDatabase *)database
                                    config:(ABI44_0_0EXUpdatesConfig *)config
                            launchedUpdate:(nullable ABI44_0_0EXUpdatesUpdate *)launchedUpdate
                            embeddedUpdate:(nullable ABI44_0_0EXUpdatesUpdate *)embeddedUpdate
{
  NSError *headersError;
  NSMutableDictionary *extraHeaders = [database serverDefinedHeadersWithScopeKey:config.scopeKey error:&headersError].mutableCopy ?: [NSMutableDictionary new];
  if (headersError) {
    NSLog(@"Error selecting serverDefinedHeaders from database: %@", headersError.localizedDescription);
  }

  if (launchedUpdate) {
    extraHeaders[@"Expo-Current-Update-ID"] = launchedUpdate.updateId.UUIDString.lowercaseString;
  }
  if (embeddedUpdate) {
    extraHeaders[@"Expo-Embedded-Update-ID"] = embeddedUpdate.updateId.UUIDString.lowercaseString;
  }

  return extraHeaders.copy;
}

#pragma mark - NSURLSessionTaskDelegate

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task willPerformHTTPRedirection:(NSHTTPURLResponse *)response newRequest:(NSURLRequest *)request completionHandler:(void (^)(NSURLRequest *))completionHandler
{
  completionHandler(request);
}

#pragma mark - NSURLSessionDataDelegate

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask willCacheResponse:(NSCachedURLResponse *)proposedResponse completionHandler:(void (^)(NSCachedURLResponse *cachedResponse))completionHandler
{
  completionHandler(proposedResponse);
}

#pragma mark - Parsing the response

- (NSStringEncoding)_encodingFromResponse:(NSURLResponse *)response
{
  if (response.textEncodingName) {
    CFStringRef cfEncodingName = (__bridge CFStringRef)response.textEncodingName;
    CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding(cfEncodingName);
    if (cfEncoding != kCFStringEncodingInvalidId) {
      return CFStringConvertEncodingToNSStringEncoding(cfEncoding);
    }
  }
  // Default to UTF-8
  return NSUTF8StringEncoding;
}

- (NSError *)_errorFromResponse:(NSHTTPURLResponse *)response body:(NSString *)body
{
  NSDictionary *userInfo = @{
                             NSLocalizedDescriptionKey: body,
                             };
  return [NSError errorWithDomain:ABI44_0_0EXUpdatesFileDownloaderErrorDomain code:response.statusCode userInfo:userInfo];
}

@end

NS_ASSUME_NONNULL_END
