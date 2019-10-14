//
//  SEGCrypto.h
//  Analytics
//
//  Copyright © 2016 Segment. All rights reserved.
//

#import <Foundation/Foundation.h>

@protocol SEGCrypto <NSObject>

- (NSData *_Nullable)encrypt:(NSData *_Nonnull)data;
- (NSData *_Nullable)decrypt:(NSData *_Nonnull)data;

@end
