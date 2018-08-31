//
//  ABI30_0_0RNBranchConfig.h
//  Pods
//
//  Created by Jimmy Dee on 6/7/17.
//
//

#import <Foundation/Foundation.h>

extern NSString * _Nonnull const ABI30_0_0RNBranchConfigDebugModeOption;
extern NSString * _Nonnull const ABI30_0_0RNBranchConfigBranchKeyOption;
extern NSString * _Nonnull const ABI30_0_0RNBranchConfigLiveKeyOption;
extern NSString * _Nonnull const ABI30_0_0RNBranchConfigTestKeyOption;
extern NSString * _Nonnull const ABI30_0_0RNBranchConfigUseTestInstanceOption;
extern NSString * _Nonnull const ABI30_0_0RNBranchConfigDelayInitToCheckForSearchAdsOption;
extern NSString * _Nonnull const ABI30_0_0RNBranchConfigAppleSearchAdsDebugModeOption;

@interface ABI30_0_0RNBranchConfig : NSObject

@property (class, readonly, nonnull) ABI30_0_0RNBranchConfig *instance;
@property (nonatomic, readonly, nullable) NSURL *configFileURL;
@property (nonatomic, readonly) BOOL debugMode;
@property (nonatomic, readonly, nullable) NSString *branchKey;
@property (nonatomic, readonly, nullable) NSString *liveKey;
@property (nonatomic, readonly, nullable) NSString *testKey;
@property (nonatomic, readonly) BOOL useTestInstance;
@property (nonatomic, readonly) BOOL delayInitToCheckForSearchAds;
@property (nonatomic, readonly) BOOL appleSearchAdsDebugMode;

- (nullable id)objectForKey:(NSString * _Nonnull)key;
- (nullable id)objectForKeyedSubscript:(NSString * _Nonnull)key;

@end
