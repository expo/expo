//
//  This file is from https://gist.github.com/zydeco/6292773
//
//  Created by Jesús A. Álvarez on 2008-12-17.
//  Copyright 2008-2009 namedfork.net. All rights reserved.
//

#import "SDFileAttributeHelper.h"
#import <sys/xattr.h>

@implementation SDFileAttributeHelper

+ (NSArray*)extendedAttributeNamesAtPath:(NSString*)path traverseLink:(BOOL)follow error:(NSError**)err {
    int flags = follow? 0 : XATTR_NOFOLLOW;
    
    // get size of name list
    ssize_t nameBuffLen = listxattr([path fileSystemRepresentation], NULL, 0, flags);
    if (nameBuffLen == -1) {
        if (err) *err = [NSError errorWithDomain:NSPOSIXErrorDomain code:errno userInfo:
            [NSDictionary dictionaryWithObjectsAndKeys:
             [NSString stringWithUTF8String:strerror(errno)], @"error",
             @"listxattr", @"function",
             path, @":path",
             [NSNumber numberWithBool:follow], @":traverseLink",
             nil]
            ];
        return nil;
    } else if (nameBuffLen == 0) return [NSArray array];
    
    // get name list
    NSMutableData *nameBuff = [NSMutableData dataWithLength:nameBuffLen];
    listxattr([path fileSystemRepresentation], [nameBuff mutableBytes], nameBuffLen, flags);
    
    // convert to array
    NSMutableArray * names = [NSMutableArray arrayWithCapacity:5];
    char *nextName, *endOfNames = [nameBuff mutableBytes] + nameBuffLen;
    for(nextName = [nameBuff mutableBytes]; nextName < endOfNames; nextName += 1+strlen(nextName))
        [names addObject:[NSString stringWithUTF8String:nextName]];
    return [NSArray arrayWithArray:names];
}

+ (BOOL)hasExtendedAttribute:(NSString*)name atPath:(NSString*)path traverseLink:(BOOL)follow error:(NSError**)err {
    int flags = follow? 0 : XATTR_NOFOLLOW;
    
    // get size of name list
    ssize_t nameBuffLen = listxattr([path fileSystemRepresentation], NULL, 0, flags);
    if (nameBuffLen == -1) {
        if (err) *err = [NSError errorWithDomain:NSPOSIXErrorDomain code:errno userInfo:
            [NSDictionary dictionaryWithObjectsAndKeys:
             [NSString stringWithUTF8String:strerror(errno)], @"error",
             @"listxattr", @"function",
             path, @":path",
             [NSNumber numberWithBool:follow], @":traverseLink",
             nil]
            ];
        return NO;
    } else if (nameBuffLen == 0) return NO;
    
    // get name list
    NSMutableData *nameBuff = [NSMutableData dataWithLength:nameBuffLen];
    listxattr([path fileSystemRepresentation], [nameBuff mutableBytes], nameBuffLen, flags);
    
    // find our name
    char *nextName, *endOfNames = [nameBuff mutableBytes] + nameBuffLen;
    for(nextName = [nameBuff mutableBytes]; nextName < endOfNames; nextName += 1+strlen(nextName))
        if (strcmp(nextName, [name UTF8String]) == 0) return YES;
    return NO;
}

+ (NSData*)extendedAttribute:(NSString*)name atPath:(NSString*)path traverseLink:(BOOL)follow error:(NSError**)err {
    int flags = follow? 0 : XATTR_NOFOLLOW;
    // get length
    ssize_t attrLen = getxattr([path fileSystemRepresentation], [name UTF8String], NULL, 0, 0, flags);
    if (attrLen == -1) {
        if (err) *err = [NSError errorWithDomain:NSPOSIXErrorDomain code:errno userInfo:
                         [NSDictionary dictionaryWithObjectsAndKeys:
                          [NSString stringWithUTF8String:strerror(errno)], @"error",
                          @"getxattr", @"function",
                          name, @":name",
                          path, @":path",
                          [NSNumber numberWithBool:follow], @":traverseLink",
                          nil]
                         ];
        return nil;
    }
    
    // get attribute data
    NSMutableData * attrData = [NSMutableData dataWithLength:attrLen];
    getxattr([path fileSystemRepresentation], [name UTF8String], [attrData mutableBytes], attrLen, 0, flags);
    return attrData;
}

+ (BOOL)setExtendedAttribute:(NSString*)name value:(NSData*)value atPath:(NSString*)path traverseLink:(BOOL)follow overwrite:(BOOL)overwrite error:(NSError**)err {
    int flags = (follow? 0 : XATTR_NOFOLLOW) | (overwrite? 0 : XATTR_CREATE);
    if (0 == setxattr([path fileSystemRepresentation], [name UTF8String], [value bytes], [value length], 0, flags)) return YES;
    // error
    if (err) *err = [NSError errorWithDomain:NSPOSIXErrorDomain code:errno userInfo:
                     [NSDictionary dictionaryWithObjectsAndKeys:
                      [NSString stringWithUTF8String:strerror(errno)], @"error",
                      @"setxattr", @"function",
                      name, @":name",
                      [NSNumber numberWithUnsignedInteger:[value length]], @":value.length",
                      path, @":path",
                      [NSNumber numberWithBool:follow], @":traverseLink",
                      [NSNumber numberWithBool:overwrite], @":overwrite",
                      nil]
                     ];
    return NO;
}

+ (BOOL)removeExtendedAttribute:(NSString*)name atPath:(NSString*)path traverseLink:(BOOL)follow error:(NSError**)err {
    int flags = (follow? 0 : XATTR_NOFOLLOW);
    if (0 == removexattr([path fileSystemRepresentation], [name UTF8String], flags)) return YES;
    // error
    if (err) *err = [NSError errorWithDomain:NSPOSIXErrorDomain code:errno userInfo:
                     [NSDictionary dictionaryWithObjectsAndKeys:
                      [NSString stringWithUTF8String:strerror(errno)], @"error",
                      @"removexattr", @"function",
                      name, @":name",
                      path, @":path",
                      [NSNumber numberWithBool:follow], @":traverseLink",
                      nil]
                     ];
    return NO;
}

@end
