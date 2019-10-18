//
//  DTExtendedFileAttributes.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 3/6/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

/**
 This class provides read/write access to extended file attributes of a file or folder. It wraps the standard xattr Posix functions to do that.
 
 Because the file system does not keep track of the data types saved in extended attributes this API so far reads and writes strings.
*/
@interface DTExtendedFileAttributes : NSObject


/**
 @name Creating an Extended File Attribute Manager
 */


/**
 Creates an Extended File Attribute Manager.
 
 @param path The file path
 */
- (id)initWithPath:(NSString *)path;


/**
 @name Reading/Writing Extended Attributes
 */

/**
 Removes an extended file attribute from the receiver.
 
 @param attribute The name of the attribute.
 @returns `YES` if successful.
 */
- (BOOL)removeAttribute:(NSString *)attribute;


/**
 Sets the value of an extended file attribute for the receiver.
 
 If the value is `nil` then this is the same as calling <removeAttribute:>.
 
 @param value The string to save for this attribute.
 @param attribute The name of the attribute.
 @returns `YES` if successful.
 */
- (BOOL)setValue:(NSString *)value forAttribute:(NSString *)attribute;


/**
 Gets the value of an extended file attribute from the receiver.
 
 @param attribute The name of the attribute.
 @returns The string for the value or `nil` if the value is not set.
 */
- (NSString *)valueForAttribute:(NSString *)attribute;

@end
