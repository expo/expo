//
//  This file is from https://gist.github.com/zydeco/6292773
//
//  Created by Jesús A. Álvarez on 2008-12-17.
//  Copyright 2008-2009 namedfork.net. All rights reserved.
//

#import <Foundation/Foundation.h>

/// File Extended Attribute (xattr) helper methods
@interface SDFileAttributeHelper : NSObject

+ (nullable NSArray<NSString *> *)extendedAttributeNamesAtPath:(nonnull NSString *)path traverseLink:(BOOL)follow error:(NSError * _Nullable * _Nullable)err;
+ (BOOL)hasExtendedAttribute:(nonnull NSString *)name atPath:(nonnull NSString *)path traverseLink:(BOOL)follow error:(NSError * _Nullable * _Nullable)err;
+ (nullable NSData *)extendedAttribute:(nonnull NSString *)name atPath:(nonnull NSString *)path traverseLink:(BOOL)follow error:(NSError * _Nullable * _Nullable)err;
+ (BOOL)setExtendedAttribute:(nonnull NSString *)name value:(nonnull NSData *)value atPath:(nonnull NSString *)path traverseLink:(BOOL)follow overwrite:(BOOL)overwrite error:(NSError * _Nullable * _Nullable)err;
+ (BOOL)removeExtendedAttribute:(nonnull NSString *)name atPath:(nonnull NSString *)path traverseLink:(BOOL)follow error:(NSError * _Nullable * _Nullable)err;

@end
