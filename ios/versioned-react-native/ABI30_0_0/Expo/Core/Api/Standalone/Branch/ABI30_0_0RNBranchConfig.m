//
//  ABI30_0_0RNBranchConfig.m
//  Pods
//
//  Created by Jimmy Dee on 6/7/17.
//
//

#import <ReactABI30_0_0/ABI30_0_0RCTLog.h>

#import "ABI30_0_0RNBranchConfig.h"

NSString * _Nonnull const ABI30_0_0RNBranchConfigDebugModeOption = @"debugMode";
NSString * _Nonnull const ABI30_0_0RNBranchConfigBranchKeyOption = @"branchKey";
NSString * _Nonnull const ABI30_0_0RNBranchConfigLiveKeyOption = @"liveKey";
NSString * _Nonnull const ABI30_0_0RNBranchConfigTestKeyOption = @"testKey";
NSString * _Nonnull const ABI30_0_0RNBranchConfigUseTestInstanceOption = @"useTestInstance";
NSString * _Nonnull const ABI30_0_0RNBranchConfigDelayInitToCheckForSearchAdsOption = @"delayInitToCheckForSearchAds";
NSString * _Nonnull const ABI30_0_0RNBranchConfigAppleSearchAdsDebugModeOption = @"appleSearchAdsDebugMode";

@interface ABI30_0_0RNBranchConfig()
@property (nonatomic) NSDictionary *configuration;
@property (nonatomic, readonly) NSData *configFileContents;
@property (nonatomic) NSURL *configFileURL;
@end

@implementation ABI30_0_0RNBranchConfig

+ (ABI30_0_0RNBranchConfig * _Nonnull)instance
{
    @synchronized(self) {
        static ABI30_0_0RNBranchConfig *_instance;
        static dispatch_once_t once = 0;
        dispatch_once(&once, ^{
            _instance = [[ABI30_0_0RNBranchConfig alloc] init];
        });
        return _instance;
    }
}

- (instancetype)init
{
    self = [super init];
    if (self) {
        [self findConfigFile];
        [self loadConfigFile];
    }
    return self;
}

- (void)loadConfigFile
{
    NSData *data = self.configFileContents;
    if (!data) return;

    NSError *error;
    id object = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
    if (!object || error) {
        ABI30_0_0RCTLogError(@"Failed to parse branch.json. Error: %@", error.localizedDescription);
        return;
    }

    if (![object isKindOfClass:NSDictionary.class]) {
        ABI30_0_0RCTLogError(@"Contents of branch.json should be a JSON object.");
        return;
    }

    self.configuration = object;
}

- (NSData *)configFileContents
{
    if (!self.configFileURL) return nil;
    ABI30_0_0RCTLogInfo(@"Loading %@", self.configFileURL.pathComponents.lastObject);

    NSError *error;
    NSData *data = [NSData dataWithContentsOfURL:self.configFileURL options:0 error:&error];
    if (!data || error) {
        ABI30_0_0RCTLogError(@"Failed to load %@. Error: %@", self.configFileURL, error.localizedDescription);
        return nil;
    }
    return data;
}

- (void)findConfigFile
{
    if (self.configFileURL) return;

    __block NSURL *configFileURL;
    NSBundle *mainBundle = NSBundle.mainBundle;
    NSArray *filesToCheck =
    @[
#ifdef DEBUG
      @"branch.ios.debug",
      @"branch.debug",
#endif // DEBUG
      @"branch.ios",
      @"branch"
      ];

    [filesToCheck enumerateObjectsUsingBlock:^(NSString *  _Nonnull file, NSUInteger idx, BOOL * _Nonnull stop) {
        configFileURL = [mainBundle URLForResource:file withExtension:@"json"];
        *stop = (configFileURL != nil);
    }];

    if (!configFileURL) {
        ABI30_0_0RCTLogInfo(@"Could not find branch.json in app bundle.");
        return;
    }

    self.configFileURL = configFileURL;
}

- (BOOL)debugMode
{
    NSNumber *number = self[ABI30_0_0RNBranchConfigDebugModeOption];
    return number.boolValue;
}

- (BOOL)useTestInstance
{
    NSNumber *number = self[ABI30_0_0RNBranchConfigUseTestInstanceOption];
    return number.boolValue;
}

- (BOOL)delayInitToCheckForSearchAds
{
    NSNumber *number = self[ABI30_0_0RNBranchConfigDelayInitToCheckForSearchAdsOption];
    return number.boolValue;
}

- (BOOL)appleSearchAdsDebugMode
{
    NSNumber *number = self[ABI30_0_0RNBranchConfigAppleSearchAdsDebugModeOption];
    return number.boolValue;
}

- (NSString *)branchKey
{
    return self[ABI30_0_0RNBranchConfigBranchKeyOption];
}

- (NSString *)liveKey
{
    return self[ABI30_0_0RNBranchConfigLiveKeyOption];
}

- (NSString *)testKey
{
    return self[ABI30_0_0RNBranchConfigTestKeyOption];
}

- (id)objectForKey:(NSString *)key
{
    return self.configuration[key];
}

- (id)objectForKeyedSubscript:(NSString *)key
{
    return self.configuration[key];
}

@end
