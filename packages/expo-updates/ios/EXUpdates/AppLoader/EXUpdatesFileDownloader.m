//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesCrypto.h>
#import <EXUpdates/EXUpdatesErrorRecovery.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>
#import <EXUpdates/EXUpdatesSelectionPolicies.h>
#import <EXUpdates/EXUpdatesMultipartStreamReader.h>
#import <EXUpdates/EXUpdatesParameterParser.h>
#import <EXUpdates/EXUpdatesManifestHeaders.h>
#import <EXUpdates/EXUpdatesAppController.h>

@import EASClient;

#if __has_include(<EXUpdates/EXUpdates-Swift.h>)
#import <EXUpdates/EXUpdates-Swift.h>
#else
#import "EXUpdates-Swift.h"
#endif

NS_ASSUME_NONNULL_BEGIN

NSTimeInterval const EXUpdatesDefaultTimeoutInterval = 60;

NSString * const EXUpdatesMultipartManifestPartName = @"manifest";
NSString * const EXUpdatesMultipartExtensionsPartName = @"extensions";
NSString * const EXUpdatesMultipartCertificateChainPartName = @"certificate_chain";

NSString * const EXUpdatesFileDownloaderErrorDomain = @"EXUpdatesFileDownloader";
const NSInteger EXUpdatesFileDownloaderErrorCodeFileWriteError = 1002;
const NSInteger EXUpdatesFileDownloaderErrorCodeManifestVerificationError = 1003;
const NSInteger EXUpdatesFileDownloaderErrorCodeFileHashMismatchError = 1004;
const NSInteger EXUpdatesFileDownloaderErrorCodeNoCompatibleUpdateError = 1009;
const NSInteger EXUpdatesFileDownloaderErrorCodeMismatchedManifestFiltersError = 1021;
const NSInteger EXUpdatesFileDownloaderErrorCodeManifestParseError = 1022;
const NSInteger EXUpdatesFileDownloaderErrorCodeInvalidResponseError = 1040;
const NSInteger EXUpdatesFileDownloaderErrorCodeManifestStringError = 1041;
const NSInteger EXUpdatesFileDownloaderErrorCodeManifestJSONError = 1042;
const NSInteger EXUpdatesFileDownloaderErrorCodeManifestSignatureError = 1043;
const NSInteger EXUpdatesFileDownloaderErrorCodeMultipartParsingError = 1044;
const NSInteger EXUpdatesFileDownloaderErrorCodeMultipartMissingManifestError = 1045;
const NSInteger EXUpdatesFileDownloaderErrorCodeMissingMultipartBoundaryError = 1047;
const NSInteger EXUpdatesFileDownloaderErrorCodeCodeSigningSignatureError = 1048;

@interface EXUpdatesFileDownloader () <NSURLSessionDataDelegate>

@property (nonatomic, strong) NSURLSession *session;
@property (nonatomic, strong) NSURLSessionConfiguration *sessionConfiguration;
@property (nonatomic, strong) EXUpdatesConfig *config;
@property (nonatomic, strong) EXUpdatesLogger *logger;

@end

/**
 * Utility class that holds all the logic for downloading data and files, such as update manifests
 * and assets, using NSURLSession.
 */
@implementation EXUpdatesFileDownloader

- (instancetype)initWithUpdatesConfig:(EXUpdatesConfig *)updatesConfig
{
  return [self initWithUpdatesConfig:updatesConfig
             URLSessionConfiguration:NSURLSessionConfiguration.defaultSessionConfiguration];
}

- (instancetype)initWithUpdatesConfig:(EXUpdatesConfig *)updatesConfig
              URLSessionConfiguration:(NSURLSessionConfiguration *)sessionConfiguration
{
  if (self = [super init]) {
    _sessionConfiguration = sessionConfiguration;
    _session = [NSURLSession sessionWithConfiguration:_sessionConfiguration delegate:self delegateQueue:nil];
    _config = updatesConfig;
    _logger = [EXUpdatesLogger new];
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
              verifyingHash:(nullable NSString *)expectedBase64URLEncodedSHA256Hash
                     toPath:(NSString *)destinationPath
               extraHeaders:(NSDictionary *)extraHeaders
               successBlock:(EXUpdatesFileDownloaderWithHashSuccessBlock)successBlock
                 errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock
{
  [self downloadDataFromURL:url extraHeaders:extraHeaders successBlock:^(NSData *data, NSURLResponse *response) {
    NSString *hashBase64String = [EXUpdatesUtils base64UrlEncodedSHA256WithData:data];
    if (expectedBase64URLEncodedSHA256Hash && ![expectedBase64URLEncodedSHA256Hash isEqualToString:hashBase64String]) {
      NSString *errorMessage = [NSString stringWithFormat:@"File download was successful but base64url-encoded SHA-256 did not match expected; expected: %@; actual: %@", expectedBase64URLEncodedSHA256Hash, hashBase64String];
      [self->_logger error:errorMessage code:EXUpdatesErrorCodeAssetsFailedToLoad updateId:nil assetId:expectedBase64URLEncodedSHA256Hash];
      errorBlock([NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                     code:EXUpdatesFileDownloaderErrorCodeFileHashMismatchError
                                 userInfo:@{
        NSLocalizedDescriptionKey: errorMessage
      }
                 ]);
      return;
    }

    NSError *error;
    if ([data writeToFile:destinationPath options:NSDataWritingAtomic error:&error]) {
      successBlock(data, response, hashBase64String);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Could not write to path %@: %@", destinationPath, error.localizedDescription];
      [self->_logger error:errorMessage code:EXUpdatesErrorCodeAssetsFailedToLoad updateId:nil assetId:expectedBase64URLEncodedSHA256Hash];
      errorBlock([NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                     code:EXUpdatesFileDownloaderErrorCodeFileWriteError
                                 userInfo:@{
                                   NSLocalizedDescriptionKey: errorMessage,
                                   NSUnderlyingErrorKey: error
                                 }
                  ]);
    }
  } errorBlock:errorBlock];
}

- (NSURLRequest *)createManifestRequestWithURL:(NSURL *)url extraHeaders:(nullable NSDictionary *)extraHeaders
{
  NSURLRequestCachePolicy cachePolicy = _sessionConfiguration ? _sessionConfiguration.requestCachePolicy : NSURLRequestUseProtocolCachePolicy;

  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url cachePolicy:cachePolicy timeoutInterval:EXUpdatesDefaultTimeoutInterval];
  [self _setManifestHTTPHeaderFields:request withExtraHeaders:extraHeaders];

  return request;
}

- (NSURLRequest *)createGenericRequestWithURL:(NSURL *)url extraHeaders:(NSDictionary *)extraHeaders
{
  // pass any custom cache policy onto this specific request
  NSURLRequestCachePolicy cachePolicy = _sessionConfiguration ? _sessionConfiguration.requestCachePolicy : NSURLRequestUseProtocolCachePolicy;

  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url cachePolicy:cachePolicy timeoutInterval:EXUpdatesDefaultTimeoutInterval];
  [self _setHTTPHeaderFields:request extraHeaders:extraHeaders];

  return request;
}

- (void)parseManifestResponse:(NSHTTPURLResponse *)httpResponse
                     withData:(NSData *)data
                     database:(EXUpdatesDatabase *)database
                 successBlock:(EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                   errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock {
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
    NSDictionary<NSString *, NSString *> *contentTypeParameters = [[EXUpdatesParameterParser new] parseParameterString:contentType withDelimiter:';'];
    NSString *boundaryParameterValue = contentTypeParameters[@"boundary"];

    if (boundaryParameterValue == nil) {
      NSString *errorMessage = @"Missing boundary in multipart manifest content-type";
      [self->_logger error:errorMessage code:EXUpdatesErrorCodeAssetsFailedToLoad];
      NSError *error = [NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                           code:EXUpdatesFileDownloaderErrorCodeMissingMultipartBoundaryError
                                       userInfo:@{
        NSLocalizedDescriptionKey: errorMessage,
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
    EXUpdatesManifestHeaders *manifestHeaders = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:responseHeaders[@"expo-protocol-version"]
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
                              database:(EXUpdatesDatabase *)database
                              boundary:(NSString *)boundary
                          successBlock:(EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                            errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock {
  NSInputStream *inputStream = [[NSInputStream alloc] initWithData:data];
  EXUpdatesMultipartStreamReader *reader = [[EXUpdatesMultipartStreamReader alloc] initWithInputStream:inputStream boundary:boundary];

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
      NSDictionary<NSString *, NSString *> *contentDispositionParameters = [[EXUpdatesParameterParser new] parseParameterString:contentDisposition withDelimiter:';'];
      NSString *contentDispositionNameFieldValue = contentDispositionParameters[@"name"];
      if (contentDispositionNameFieldValue != nil) {
        if ([contentDispositionNameFieldValue isEqualToString:EXUpdatesMultipartManifestPartName]) {
          manifestPartHeaders = headers;
          manifestPartData = content;
        } else if ([contentDispositionNameFieldValue isEqualToString:EXUpdatesMultipartExtensionsPartName]) {
          extensionsData = content;
        } else if ([contentDispositionNameFieldValue isEqualToString:EXUpdatesMultipartCertificateChainPartName]) {
          certificateChainStringData = content;
        }
      }
    }
  }];

  if (!completed) {
    NSError *error = [NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                         code:EXUpdatesFileDownloaderErrorCodeMultipartParsingError
                                     userInfo:@{
      NSLocalizedDescriptionKey: @"Could not read multipart manifest response",
    }];
    [self->_logger error:error.localizedDescription code:EXUpdatesErrorCodeAssetsFailedToLoad];
    errorBlock(error);
    return;
  }

  if (manifestPartHeaders == nil || manifestPartData == nil) {
    NSError *error = [NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                         code:EXUpdatesFileDownloaderErrorCodeMultipartMissingManifestError
                                     userInfo:@{
      NSLocalizedDescriptionKey: @"Multipart manifest response missing manifest part",
    }];
    [self->_logger error:error.userInfo[NSLocalizedDescriptionKey] code:EXUpdatesErrorCodeAssetsFailedToLoad];
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
      NSError *error = [NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                           code:EXUpdatesFileDownloaderErrorCodeMultipartParsingError
                                       userInfo:@{
        NSLocalizedDescriptionKey: @"Failed to parse multipart manifest extensions",
      }];
      [self->_logger error:error.userInfo[NSLocalizedDescriptionKey] code:EXUpdatesErrorCodeAssetsFailedToLoad];
      errorBlock(error);
      return;
    }
  }

  NSString *certificateChain = nil;
  if (certificateChainStringData != nil) {
    certificateChain = [[NSString alloc] initWithData:certificateChainStringData encoding:NSUTF8StringEncoding];
  }

  NSDictionary *responseHeaders = [httpResponse allHeaderFields];
  EXUpdatesManifestHeaders *manifestHeaders = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:responseHeaders[@"expo-protocol-version"]
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
              manifestHeaders:(EXUpdatesManifestHeaders *)manifestHeaders
                   extensions:(NSDictionary *)extensions
certificateChainFromManifestResponse:(nullable NSString *)certificateChainFromManifestResponse
                     database:(EXUpdatesDatabase *)database
                 successBlock:(EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                   errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock {
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
    NSString *errorMessage = @"manifestString should be a string";
    [self->_logger error:errorMessage code:EXUpdatesErrorCodeUpdateHasInvalidSignature];
    errorBlock([NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                   code:EXUpdatesFileDownloaderErrorCodeManifestStringError
                               userInfo:@{
                                 NSLocalizedDescriptionKey: errorMessage,
                               }
                ]);
    return;
  }
  NSDictionary *manifest = [NSJSONSerialization JSONObjectWithData:[(NSString *)manifestString dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:&error];
  if (error || !manifest || ![manifest isKindOfClass:[NSDictionary class]]) {
    NSString *errorMessage = @"manifest should be a valid JSON object";
    [self->_logger error:errorMessage code:EXUpdatesErrorCodeUpdateHasInvalidSignature];
    errorBlock([NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                   code:EXUpdatesFileDownloaderErrorCodeManifestJSONError
                               userInfo:@{
                                 NSLocalizedDescriptionKey: errorMessage,
                               }
                ]);
    return;
  }


  if (signature != nil && !isUnsignedFromXDL) {
    if (![signature isKindOfClass:[NSString class]]) {
      NSString *errorMessage = @"signature should be a string";
      [self->_logger error:errorMessage code:EXUpdatesErrorCodeUpdateHasInvalidSignature];
      errorBlock([NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                     code:EXUpdatesFileDownloaderErrorCodeManifestSignatureError
                                 userInfo:@{
                                   NSLocalizedDescriptionKey: errorMessage,
                                 }
                  ]);
      return;
    }
    [EXUpdatesCrypto verifySignatureWithData:(NSString *)manifestString
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
                                                  NSError *error = [NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                                                                       code:EXUpdatesFileDownloaderErrorCodeManifestVerificationError
                                                                                   userInfo:@{NSLocalizedDescriptionKey: @"Manifest verification failed"}];
                                                  [self->_logger error:error.userInfo[NSLocalizedDescriptionKey] code:EXUpdatesErrorCodeUpdateHasInvalidSignature];
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
                   withDatabase:(EXUpdatesDatabase *)database
                   extraHeaders:(nullable NSDictionary *)extraHeaders
                   successBlock:(EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                     errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock
{
  NSURLRequest *request = [self createManifestRequestWithURL:url extraHeaders:extraHeaders];
  [self _downloadDataWithRequest:request successBlock:^(NSData *data, NSURLResponse *response) {
    if (![response isKindOfClass:[NSHTTPURLResponse class]]) {
      NSString *errorMessage = @"response must be a NSHTTPURLResponse";
      [self->_logger error:errorMessage code:EXUpdatesErrorCodeUpdateFailedToLoad];
      errorBlock([NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                     code:EXUpdatesFileDownloaderErrorCodeInvalidResponseError
                                 userInfo:@{
                                   NSLocalizedDescriptionKey: errorMessage ,
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
                  manifestHeaders:(EXUpdatesManifestHeaders *)manifestHeaders
                       extensions:(NSDictionary *)extensions
certificateChainFromManifestResponse:(nullable NSString *)certificateChainFromManifestResponse
                         database:(EXUpdatesDatabase *)database
                       isVerified:(BOOL)isVerified
                     successBlock:(EXUpdatesFileDownloaderManifestSuccessBlock)successBlock
                       errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock
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
  EXUpdatesCodeSigningConfiguration *codeSigningConfiguration = _config.codeSigningConfiguration;
  if (codeSigningConfiguration) {
    NSError *error;
    EXUpdatesSignatureValidationResult *signatureValidationResult = [codeSigningConfiguration validateSignatureWithSignature:manifestHeaders.signature
                                                  signedData:manifestBodyData
                            manifestResponseCertificateChain:certificateChainFromManifestResponse
                                                       error:&error];
    if (error) {
      NSString *message = [EXUpdatesCodeSigningErrorUtils messageForError:error.code];
      NSString *errorMessage = [NSString stringWithFormat:@"Downloaded manifest signature is invalid: %@", message];
      [self->_logger error:errorMessage code:EXUpdatesErrorCodeUpdateCodeSigningError];
      errorBlock([NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                     code:EXUpdatesFileDownloaderErrorCodeCodeSigningSignatureError
                                 userInfo:@{NSLocalizedDescriptionKey: errorMessage}] );
      return;
    }

    if (signatureValidationResult.validationResult == EXUpdatesValidationResultInvalid) {
      NSString *errorMessage = @"Manifest download was successful, but signature was incorrect";
      [self->_logger error:errorMessage code:EXUpdatesErrorCodeUpdateCodeSigningError];
      errorBlock([NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                     code:EXUpdatesFileDownloaderErrorCodeCodeSigningSignatureError
                                 userInfo:@{NSLocalizedDescriptionKey: errorMessage }]);
      return;
    }

    if (signatureValidationResult.validationResult != EXUpdatesValidationResultSkipped) {
      EXUpdatesExpoProjectInformation *expoProjectInformation = signatureValidationResult.expoProjectInformation;
      if (expoProjectInformation != nil) {
        NSError *error;
        EXUpdatesUpdate *update;
        @try {
          update = [EXUpdatesUpdate updateWithManifest:mutableManifest
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
          error = [NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                      code:EXUpdatesFileDownloaderErrorCodeManifestParseError
                                  userInfo:@{NSLocalizedDescriptionKey: [@"Failed to parse manifest: " stringByAppendingString:exception.reason] }];
        }
        if (error) {
          [self->_logger error:error.userInfo[NSLocalizedDescriptionKey] code:EXUpdatesErrorCodeUpdateCodeSigningError];
          errorBlock(error);
          return;
        }

        EXManifestsManifest *manifestForProjectInformation = update.manifest;
        if (![expoProjectInformation.projectId isEqualToString:manifestForProjectInformation.easProjectId] ||
            ![expoProjectInformation.scopeKey isEqualToString:manifestForProjectInformation.scopeKey]) {
          NSString *errorMessage = @"Invalid certificate for manifest project ID or scope key";
          [self->_logger error:errorMessage code:EXUpdatesErrorCodeUpdateCodeSigningError];
          errorBlock([NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                         code:EXUpdatesFileDownloaderErrorCodeCodeSigningSignatureError
                                     userInfo:@{NSLocalizedDescriptionKey: errorMessage}]);
          return;
        }
      }

      [self->_logger info:@"Update code signature verified successfully"];
      mutableManifest[@"isVerified"] = @YES;
    }
  }



  NSError *error;
  EXUpdatesUpdate *update;
  @try {
    update = [EXUpdatesUpdate updateWithManifest:mutableManifest
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
    error = [NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                code:EXUpdatesFileDownloaderErrorCodeManifestParseError
                            userInfo:@{NSLocalizedDescriptionKey: [@"Failed to parse manifest: " stringByAppendingString:exception.reason] }];
  }

  if (error) {
    [self->_logger error:error.userInfo[NSLocalizedDescriptionKey] code:EXUpdatesErrorCodeUpdateFailedToLoad];
    errorBlock(error);
    return;
  }

  if (![EXUpdatesSelectionPolicies doesUpdate:update matchFilters:update.manifestFilters]) {
    NSError *error = [NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                         code:EXUpdatesFileDownloaderErrorCodeMismatchedManifestFiltersError
                                     userInfo:@{NSLocalizedDescriptionKey: @"Downloaded manifest is invalid; provides filters that do not match its content"}];
    [self->_logger error:error.userInfo[NSLocalizedDescriptionKey] code:EXUpdatesErrorCodeUpdateFailedToLoad];
    errorBlock(error);
  } else {
    successBlock(update);
  }
}

- (void)downloadDataFromURL:(NSURL *)url
               extraHeaders:(NSDictionary *)extraHeaders
               successBlock:(EXUpdatesFileDownloaderSuccessBlock)successBlock
                 errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock
{
  NSURLRequest *request = [self createGenericRequestWithURL:url extraHeaders:extraHeaders];
  [self _downloadDataWithRequest:request successBlock:successBlock errorBlock:errorBlock];
}

- (void)_downloadDataWithRequest:(NSURLRequest *)request
                    successBlock:(EXUpdatesFileDownloaderSuccessBlock)successBlock
                      errorBlock:(EXUpdatesFileDownloaderErrorBlock)errorBlock
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
      [self->_logger error:error.userInfo[NSLocalizedDescriptionKey] code:EXUpdatesErrorCodeUpdateFailedToLoad];
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
    *error = [NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain
                                 code:EXUpdatesFileDownloaderErrorCodeNoCompatibleUpdateError
                             userInfo:@{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"No compatible update found at %@. Only %@ are supported.", _config.updateUrl.absoluteString, _config.sdkVersion]}];
  }
  return nil;
}

+ (void)_setHTTPHeaderFields:(nullable NSDictionary *)headers onRequest:(NSMutableURLRequest *)request {
  if (!headers) {
    return;
  }
  
  for (NSString *key in headers) {
    id value = headers[key];
    if ([value isKindOfClass:[NSString class]]) {
      [request setValue:value forHTTPHeaderField:key];
    } else if ([value isKindOfClass:[NSNumber class]]) {
      if (CFGetTypeID((__bridge CFTypeRef)(value)) == CFBooleanGetTypeID()) {
        [request setValue:((NSNumber *)value).boolValue ? @"true" : @"false" forHTTPHeaderField:key];
      } else {
        [request setValue:((NSNumber *)value).stringValue forHTTPHeaderField:key];
      }
    } else if ([value isKindOfClass:[NSNull class]]) {
      [request setValue:@"null" forHTTPHeaderField:key];
    } else {
      [request setValue:[(NSObject *)value description] forHTTPHeaderField:key];
    }
  }
}

- (void)_setHTTPHeaderFields:(NSMutableURLRequest *)request
                extraHeaders:(NSDictionary *)extraHeaders
{
  [EXUpdatesFileDownloader _setHTTPHeaderFields:extraHeaders onRequest:request];

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
  [EXUpdatesFileDownloader _setHTTPHeaderFields:extraHeaders onRequest:request];

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

  NSString *previousFatalError = [EXUpdatesErrorRecovery consumeErrorLog];
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

  EXUpdatesCodeSigningConfiguration *codeSigningConfiguration = _config.codeSigningConfiguration;
  if (codeSigningConfiguration) {
    [request setValue:[codeSigningConfiguration createAcceptSignatureHeader] forHTTPHeaderField:@"expo-expect-signature"];
  }
}

+ (NSDictionary *)extraHeadersWithDatabase:(EXUpdatesDatabase *)database
                                    config:(EXUpdatesConfig *)config
                            launchedUpdate:(nullable EXUpdatesUpdate *)launchedUpdate
                            embeddedUpdate:(nullable EXUpdatesUpdate *)embeddedUpdate
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
  return [NSError errorWithDomain:EXUpdatesFileDownloaderErrorDomain code:response.statusCode userInfo:userInfo];
}

@end

NS_ASSUME_NONNULL_END
