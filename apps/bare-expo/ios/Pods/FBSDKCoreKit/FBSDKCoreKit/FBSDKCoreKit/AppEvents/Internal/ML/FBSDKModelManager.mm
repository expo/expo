// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "TargetConditionals.h"

#if !TARGET_OS_TV

 #import "FBSDKModelManager.h"

 #import "FBSDKAppEvents+Internal.h"
 #import "FBSDKFeatureExtractor.h"
 #import "FBSDKFeatureManager.h"
 #import "FBSDKGraphRequest.h"
 #import "FBSDKGraphRequestConnection.h"
 #import "FBSDKIntegrityManager.h"
 #import "FBSDKInternalUtility.h"
 #import "FBSDKMLMacros.h"
 #import "FBSDKModelParser.h"
 #import "FBSDKModelRuntime.hpp"
 #import "FBSDKModelUtility.h"
 #import "FBSDKSettings.h"
 #import "FBSDKSuggestedEventsIndexer.h"

static NSString *const INTEGRITY_NONE = @"none";
static NSString *const INTEGRITY_ADDRESS = @"address";
static NSString *const INTEGRITY_HEALTH = @"health";

extern FBSDKAppEventName FBSDKAppEventNameCompletedRegistration;
extern FBSDKAppEventName FBSDKAppEventNameAddedToCart;
extern FBSDKAppEventName FBSDKAppEventNamePurchased;
extern FBSDKAppEventName FBSDKAppEventNameInitiatedCheckout;

static NSString *_directoryPath;
static NSMutableDictionary<NSString *, id> *_modelInfo;
static std::unordered_map<std::string, fbsdk::MTensor> _MTMLWeights;

NS_ASSUME_NONNULL_BEGIN

@implementation FBSDKModelManager

 #pragma mark - Public methods

+ (void)enable
{
  @try {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      NSString *languageCode = [[NSLocale currentLocale] objectForKey:NSLocaleLanguageCode];
      // If the languageCode could not be fetched successfully, it's regarded as "en" by default.
      if (languageCode && ![languageCode isEqualToString:@"en"]) {
        return;
      }

      NSString *dirPath = [NSTemporaryDirectory() stringByAppendingPathComponent:FBSDK_ML_MODEL_PATH];
      if (![[NSFileManager defaultManager] fileExistsAtPath:dirPath]) {
        [[NSFileManager defaultManager] createDirectoryAtPath:dirPath withIntermediateDirectories:YES attributes:NULL error:NULL];
      }
      _directoryPath = dirPath;
      _modelInfo = [[NSUserDefaults standardUserDefaults] objectForKey:MODEL_INFO_KEY];
      NSDate *timestamp = [[NSUserDefaults standardUserDefaults] objectForKey:MODEL_REQUEST_TIMESTAMP_KEY];
      if ([_modelInfo count] == 0 || ![FBSDKFeatureManager isEnabled:FBSDKFeatureModelRequest] || ![self isValidTimestamp:timestamp]) {
        // fetch api
        FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                                      initWithGraphPath:[NSString stringWithFormat:@"%@/model_asset", [FBSDKSettings appID]]];

        [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
          if (!error) {
            NSDictionary<NSString *, id> *resultDictionary = [FBSDKTypeUtility dictionaryValue:result];
            NSDictionary<NSString *, id> *modelInfo = [self convertToDictionary:resultDictionary[MODEL_DATA_KEY]];
            if (modelInfo) {
              _modelInfo = [modelInfo mutableCopy];
              [self processMTML];
              // update cache for model info and timestamp
              [[NSUserDefaults standardUserDefaults] setObject:_modelInfo forKey:MODEL_INFO_KEY];
              [[NSUserDefaults standardUserDefaults] setObject:[NSDate date] forKey:MODEL_REQUEST_TIMESTAMP_KEY];
            }
          }
          [self checkFeaturesAndExecuteForMTML];
        }];
      } else {
        [self checkFeaturesAndExecuteForMTML];
      }
    });
  } @catch (NSException *exception) {
    NSLog(@"Fail to enable model manager, exception reason: %@", exception.reason);
  }
}

+ (nullable NSDictionary *)getRulesForKey:(NSString *)useCase
{
  @try {
    NSDictionary<NSString *, id> *model = [FBSDKTypeUtility dictionary:_modelInfo objectForKey:useCase ofType:NSObject.class];
    if (model && model[VERSION_ID_KEY]) {
      NSString *filePath = [_directoryPath stringByAppendingPathComponent:[NSString stringWithFormat:@"%@_%@.rules", useCase, model[VERSION_ID_KEY]]];
      if (filePath) {
        NSData *ruelsData = [NSData dataWithContentsOfFile:filePath options:NSDataReadingMappedIfSafe error:nil];
        NSDictionary *rules = [FBSDKTypeUtility JSONObjectWithData:ruelsData options:0 error:nil];
        return rules;
      }
    }
  } @catch (NSException *exception) {
    NSLog(@"Fail to get rules for usecase %@ from ml model, exception reason: %@", useCase, exception.reason);
  }
  return nil;
}

+ (nullable NSData *)getWeightsForKey:(NSString *)useCase
{
  if (!_modelInfo || !_directoryPath) {
    return nil;
  }
  if ([useCase hasPrefix:MTMLKey]) {
    useCase = MTMLKey;
  }
  NSDictionary<NSString *, id> *model = [FBSDKTypeUtility dictionary:_modelInfo objectForKey:useCase ofType:NSObject.class];
  if (model && model[VERSION_ID_KEY]) {
    NSString *path = [_directoryPath stringByAppendingPathComponent:[NSString stringWithFormat:@"%@_%@.weights", useCase, model[VERSION_ID_KEY]]];
    if (!path) {
      return nil;
    }
    return [NSData dataWithContentsOfFile:path
                                  options:NSDataReadingMappedIfSafe
                                    error:nil];
  }
  return nil;
}

+ (nullable NSArray *)getThresholdsForKey:(NSString *)useCase
{
  if (!_modelInfo) {
    return nil;
  }
  NSDictionary<NSString *, id> *modelInfo = _modelInfo[useCase];
  if (!modelInfo) {
    return nil;
  }
  return modelInfo[THRESHOLDS_KEY];
}

 #pragma mark - Integrity Inferencer method

+ (BOOL)processIntegrity:(nullable NSString *)param
{
  NSString *integrityType = INTEGRITY_NONE;
  @try {
    if (param.length == 0 || _MTMLWeights.size() == 0) {
      return false;
    }
    NSArray<NSString *> *integrityMapping = [self getIntegrityMapping];
    NSString *text = [FBSDKModelUtility normalizeText:param];
    const char *bytes = [text UTF8String];
    if ((int)strlen(bytes) == 0) {
      return false;
    }
    NSArray *thresholds = [FBSDKModelManager getThresholdsForKey:MTMLTaskIntegrityDetectKey];
    if (thresholds.count != integrityMapping.count) {
      return false;
    }
    const fbsdk::MTensor &res = fbsdk::predictOnMTML("integrity_detect", bytes, _MTMLWeights, nullptr);
    const float *res_data = res.data();
    for (int i = 0; i < thresholds.count; i++) {
      if ((float)res_data[i] >= (float)[[FBSDKTypeUtility array:thresholds objectAtIndex:i] floatValue]) {
        integrityType = [FBSDKTypeUtility array:integrityMapping objectAtIndex:i];
        break;
      }
    }
  } @catch (NSException *exception) {
    NSLog(@"Fail to process parameter for integrity usecase, exception reason: %@", exception.reason);
  }
  return ![integrityType isEqualToString:INTEGRITY_NONE];
}

 #pragma mark - SuggestedEvents Inferencer method

+ (NSString *)processSuggestedEvents:(NSString *)textFeature denseData:(nullable float *)denseData
{
  @try {
    NSArray<NSString *> *eventMapping = [FBSDKModelManager getSuggestedEventsMapping];
    if (textFeature.length == 0 || _MTMLWeights.size() == 0 || !denseData) {
      return SUGGESTED_EVENT_OTHER;
    }
    const char *bytes = [textFeature UTF8String];
    if ((int)strlen(bytes) == 0) {
      return SUGGESTED_EVENT_OTHER;
    }

    NSArray *thresholds = [FBSDKModelManager getThresholdsForKey:MTMLTaskAppEventPredKey];
    if (thresholds.count != eventMapping.count) {
      return SUGGESTED_EVENT_OTHER;
    }

    const fbsdk::MTensor &res = fbsdk::predictOnMTML("app_event_pred", bytes, _MTMLWeights, denseData);
    const float *res_data = res.data();
    for (int i = 0; i < thresholds.count; i++) {
      if ((float)res_data[i] >= (float)[[FBSDKTypeUtility array:thresholds objectAtIndex:i] floatValue]) {
        return [FBSDKTypeUtility array:eventMapping objectAtIndex:i];
      }
    }
  } @catch (NSException *exception) {
    NSLog(@"Fail to process suggested events, exception reason: %@", exception.reason);
  }
  return SUGGESTED_EVENT_OTHER;
}

 #pragma mark - Private methods

+ (BOOL)isValidTimestamp:(NSDate *)timestamp
{
  if (!timestamp) {
    return NO;
  }
  return ([[NSDate date] timeIntervalSinceDate:timestamp] < MODEL_REQUEST_INTERVAL);
}

+ (void)processMTML
{
  NSString *mtmlAssetUri = nil;
  long mtmlVersionId = 0;
  for (NSString *useCase in _modelInfo) {
    NSDictionary<NSString *, id> *model = _modelInfo[useCase];
    if ([useCase hasPrefix:MTMLKey]) {
      mtmlAssetUri = model[ASSET_URI_KEY];
      long thisVersionId = [model[VERSION_ID_KEY] longValue];
      mtmlVersionId = thisVersionId > mtmlVersionId ? thisVersionId : mtmlVersionId;
    }
  }
  if (mtmlAssetUri && mtmlVersionId > 0) {
    [FBSDKTypeUtility dictionary:_modelInfo setObject:@{
       USE_CASE_KEY : MTMLKey,
       ASSET_URI_KEY : mtmlAssetUri,
       VERSION_ID_KEY : [NSNumber numberWithLong:mtmlVersionId],
     } forKey:MTMLKey];
  }
}

+ (void)checkFeaturesAndExecuteForMTML
{
  [self getModelAndRules:MTMLKey onSuccess:^() {
    NSData *data = [FBSDKModelManager getWeightsForKey:MTMLKey];
    _MTMLWeights = [FBSDKModelParser parseWeightsData:data];
    if (![FBSDKModelParser validateWeights:_MTMLWeights forKey:MTMLKey]) {
      return;
    }

    if ([FBSDKFeatureManager isEnabled:FBSDKFeatureSuggestedEvents]) {
      [self getModelAndRules:MTMLTaskAppEventPredKey onSuccess:^() {
        [FBSDKFeatureExtractor loadRulesForKey:MTMLTaskAppEventPredKey];
        [FBSDKSuggestedEventsIndexer enable];
      }];
    }

    if ([FBSDKFeatureManager isEnabled:FBSDKFeatureIntelligentIntegrity]) {
      [self getModelAndRules:MTMLTaskIntegrityDetectKey onSuccess:^() {
        [FBSDKIntegrityManager enable];
      }];
    }
  }];
}

+ (void)getModelAndRules:(NSString *)useCaseKey
               onSuccess:(FBSDKDownloadCompletionBlock)handler
{
  dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
  dispatch_group_t group = dispatch_group_create();

  NSDictionary<NSString *, id> *model = [FBSDKTypeUtility dictionary:_modelInfo objectForKey:useCaseKey ofType:NSObject.class];
  if (!model || !_directoryPath) {
    return;
  }

  NSFileManager *fileManager = [NSFileManager defaultManager];
  // download model asset only if not exist before
  NSString *assetUrlString = [FBSDKTypeUtility dictionary:model objectForKey:ASSET_URI_KEY ofType:NSObject.class];
  NSString *assetFilePath;
  if (assetUrlString.length > 0) {
    [self clearCacheForModel:model suffix:@".weights"];
    NSString *fileName = useCaseKey;
    if ([useCaseKey hasPrefix:MTMLKey]) {
      // all mtml tasks share the same weights file
      fileName = MTMLKey;
    }
    assetFilePath = [_directoryPath stringByAppendingPathComponent:[NSString stringWithFormat:@"%@_%@.weights", fileName, model[VERSION_ID_KEY]]];
    [self download:assetUrlString filePath:assetFilePath queue:queue group:group];
  }

  // download rules
  NSString *rulesUrlString = [FBSDKTypeUtility dictionary:model objectForKey:RULES_URI_KEY ofType:NSObject.class];
  NSString *rulesFilePath = nil;
  // rules are optional and rulesUrlString may be empty
  if (rulesUrlString.length > 0) {
    [self clearCacheForModel:model suffix:@".rules"];
    rulesFilePath = [_directoryPath stringByAppendingPathComponent:[NSString stringWithFormat:@"%@_%@.rules", useCaseKey, model[VERSION_ID_KEY]]];
    [self download:rulesUrlString filePath:rulesFilePath queue:queue group:group];
  }
  dispatch_group_notify(group,
    dispatch_get_main_queue(), ^{
      if (handler) {
        if ([fileManager fileExistsAtPath:assetFilePath] && (!rulesFilePath || [fileManager fileExistsAtPath:rulesFilePath])) {
          handler();
        }
      }
    });
}

+ (void)clearCacheForModel:(NSDictionary<NSString *, id> *)model
                    suffix:(NSString *)suffix
{
  NSFileManager *fileManager = [NSFileManager defaultManager];
  NSString *useCase = model[USE_CASE_KEY];
  NSString *version = model[VERSION_ID_KEY];
  NSArray<NSString *> *files = [fileManager contentsOfDirectoryAtPath:_directoryPath error:nil];
  NSString *prefixWithVersion = [NSString stringWithFormat:@"%@_%@", useCase, version];
  for (NSString *file in files) {
    if ([file hasSuffix:suffix] && [file hasPrefix:useCase] && ![file hasPrefix:prefixWithVersion]) {
      [fileManager removeItemAtPath:[_directoryPath stringByAppendingPathComponent:file] error:nil];
    }
  }
}

+ (void)download:(NSString *)urlString
        filePath:(NSString *)filePath
           queue:(dispatch_queue_t)queue
           group:(dispatch_group_t)group
{
  if (!filePath || [[NSFileManager defaultManager] fileExistsAtPath:filePath]) {
    return;
  }
  dispatch_group_async(group,
    queue, ^{
      NSURL *url = [NSURL URLWithString:urlString];
      NSData *urlData = [NSData dataWithContentsOfURL:url];
      if (urlData) {
        [urlData writeToFile:filePath atomically:YES];
      }
    });
}

+ (nullable NSMutableDictionary<NSString *, id> *)convertToDictionary:(NSArray<NSDictionary<NSString *, id> *> *)models
{
  if ([models count] == 0) {
    return nil;
  }
  NSMutableDictionary<NSString *, id> *modelInfo = [NSMutableDictionary dictionary];
  for (NSDictionary<NSString *, id> *model in models) {
    if (model[USE_CASE_KEY]) {
      [modelInfo addEntriesFromDictionary:@{model[USE_CASE_KEY] : model}];
    }
  }
  return modelInfo;
}

+ (NSArray<NSString *> *)getIntegrityMapping
{
  return @[INTEGRITY_NONE, INTEGRITY_ADDRESS, INTEGRITY_HEALTH];
}

+ (NSArray<NSString *> *)getSuggestedEventsMapping
{
  return
  @[SUGGESTED_EVENT_OTHER,
    FBSDKAppEventNameCompletedRegistration,
    FBSDKAppEventNameAddedToCart,
    FBSDKAppEventNamePurchased,
    FBSDKAppEventNameInitiatedCheckout];
}

@end

NS_ASSUME_NONNULL_END

#endif
