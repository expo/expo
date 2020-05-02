//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAsset.h>
#import <EXUpdates/EXUpdatesAppLauncherNoDatabase.h>
#import <EXUpdates/EXUpdatesEmbeddedAppLoader.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const kEXUpdatesErrorLogFile = @"expo-error.log";

@interface EXUpdatesAppLauncherNoDatabase ()

@property (nullable, nonatomic, strong, readwrite) EXUpdatesUpdate *launchedUpdate;
@property (nullable, nonatomic, strong, readwrite) NSURL *launchAssetUrl;
@property (nullable, nonatomic, strong, readwrite) NSMutableDictionary *assetFilesMap;

@end

@implementation EXUpdatesAppLauncherNoDatabase

- (void)launchUpdate
{
  _launchedUpdate = [EXUpdatesEmbeddedAppLoader embeddedManifest];
  if (_launchedUpdate) {
    if (_launchedUpdate.status == EXUpdatesUpdateStatusEmbedded) {
      NSAssert(_assetFilesMap == nil, @"assetFilesMap should be null for embedded updates");
      _launchAssetUrl = [[NSBundle mainBundle] URLForResource:kEXUpdatesBareEmbeddedBundleFilename withExtension:kEXUpdatesBareEmbeddedBundleFileType];
    } else {
      _launchAssetUrl = [[NSBundle mainBundle] URLForResource:kEXUpdatesEmbeddedBundleFilename withExtension:kEXUpdatesEmbeddedBundleFileType];

      NSMutableDictionary *assetFilesMap = [NSMutableDictionary new];
      for (EXUpdatesAsset *asset in _launchedUpdate.assets) {
        NSURL *localUrl = [[NSBundle mainBundle] URLForResource:asset.mainBundleFilename withExtension:asset.type];
        if (localUrl && asset.key) {
          assetFilesMap[asset.key] = localUrl.absoluteString;
        }
      }
      _assetFilesMap = assetFilesMap;
    }
  }
}

- (BOOL)isUsingEmbeddedAssets
{
  return _assetFilesMap == nil;
}

- (void)launchUpdateWithFatalError:(NSError *)error;
{
  [self launchUpdate];
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    [self _writeErrorToLog:error];
  });
}

+ (nullable NSString *)consumeError;
{
  NSString *errorLogFilePath = [[self class] _errorLogFilePath]; 
  NSData *data = [NSData dataWithContentsOfFile:errorLogFilePath options:kNilOptions error:nil];
  if (data) {
    NSError *err;
    if (![NSFileManager.defaultManager removeItemAtPath:errorLogFilePath error:&err]) {
      NSLog(@"Could not delete error log: %@", err.localizedDescription);
    }
    return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  } else {
    return nil;
  }
}

- (void)_writeErrorToLog:(NSError *)error
{
  NSString *serializedError = [NSString stringWithFormat:@"Expo encountered a fatal error: %@", [self _serializeError:error]];
  NSData *data = [serializedError dataUsingEncoding:NSUTF8StringEncoding];

  NSError *err;
  if (![data writeToFile:[[self class] _errorLogFilePath] options:NSDataWritingAtomic error:&err]) {
    NSLog(@"Could not write fatal error to log: %@", error.localizedDescription);
  }
}

- (NSString *)_serializeError:(NSError *)error
{
  NSString *localizedFailureReason = error.localizedFailureReason;
  NSError *underlyingError = error.userInfo[NSUnderlyingErrorKey];
  
  NSMutableString *serialization = [[NSString stringWithFormat:@"Time: %f\nDomain: %@\nCode: %li\nDescription: %@",
                                    [[NSDate date] timeIntervalSince1970] * 1000,
                                    error.domain,
                                    (long)error.code,
                                    error.localizedDescription] mutableCopy];
  if (localizedFailureReason) {
    [serialization appendFormat:@"\nFailure Reason: %@", localizedFailureReason];
  }
  if (underlyingError) {
    [serialization appendFormat:@"\n\nUnderlying Error:\n%@", [self _serializeError:underlyingError]];
  }
  return serialization;
}

+ (NSString *)_errorLogFilePath
{
  NSURL *applicationDocumentsDirectory = [[NSFileManager.defaultManager URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask] lastObject];
  return [[applicationDocumentsDirectory URLByAppendingPathComponent:kEXUpdatesErrorLogFile] path];
}

@end

NS_ASSUME_NONNULL_END
