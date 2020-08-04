//
//  SEGFileStorage.h
//  Analytics
//
//  Copyright © 2016 Segment. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SEGStorage.h"


@interface SEGFileStorage : NSObject <SEGStorage>

@property (nonatomic, strong, nullable) id<SEGCrypto> crypto;

- (instancetype _Nonnull)initWithFolder:(NSURL *_Nonnull)folderURL crypto:(id<SEGCrypto> _Nullable)crypto;

- (NSURL *_Nonnull)urlForKey:(NSString *_Nonnull)key;

+ (NSURL *_Nullable)applicationSupportDirectoryURL;
+ (NSURL *_Nullable)cachesDirectoryURL;

@end
