//  Copyright © 2019 650 Industries. All rights reserved.

@interface EXUpdatesAsset : NSObject

@property (nonatomic, strong) NSURL *url;
@property (nonatomic, strong) NSString *type;
@property (nonatomic, strong) NSDictionary *metadata;
@property (nonatomic, strong) NSString *nsBundleFilename; // used for embedded assets

@property (nonatomic, strong) NSString *filename;
@property (nonatomic, assign) BOOL isLaunchAsset;

@end
