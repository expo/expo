//  Copyright © 2019 650 Industries. All rights reserved.

@interface EXUpdatesAsset : NSObject

/**
 * properties determined by asset source
 */
@property (nonatomic, strong) NSURL * _Nonnull url;
@property (nonatomic, strong) NSString * _Nonnull type;
@property (nonatomic, strong) NSDictionary * _Nullable metadata;
@property (nonatomic, strong) NSString * _Nullable nsBundleFilename; // used for embedded assets
@property (nonatomic, assign) BOOL isLaunchAsset;

/**
 * properties determined at runtime by updates implementation
 */
@property (nonatomic, strong) NSData * _Nullable data;
@property (nonatomic, strong) NSURLResponse * _Nullable response;
@property (nonatomic, strong) NSDate * _Nullable downloadTime;
@property (nonatomic, strong) NSString * _Nullable filename;

/**
 * properties EXUpdatesAsset can derive on its own
 */
@property (nonatomic, readonly) NSString * _Nullable contentHash;
@property (nonatomic, readonly) NSString * _Nullable atomicHash;
@property (nonatomic, readonly) NSDictionary * _Nullable headers;

- (instancetype _Nonnull)initWithUrl:(NSURL * _Nonnull)url type:(NSString * _Nonnull)type;

@end
