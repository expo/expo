//
//  SEGUserDefaultsStorage.h
//  Analytics
//
//  Created by Tony Xiao on 8/24/16.
//  Copyright © 2016 Segment. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SEGStorage.h"


@interface SEGUserDefaultsStorage : NSObject <SEGStorage>

@property (nonatomic, strong, nullable) id<SEGCrypto> crypto;
@property (nonnull, nonatomic, readonly) NSUserDefaults *defaults;
@property (nullable, nonatomic, readonly) NSString *namespacePrefix;

- (instancetype _Nonnull)initWithDefaults:(NSUserDefaults *_Nonnull)defaults namespacePrefix:(NSString *_Nullable)namespacePrefix crypto:(id<SEGCrypto> _Nullable)crypto;

@end
