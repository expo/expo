//
//  NSString+DTUtilities.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 4/16/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//


/** 
 A collection of utility additions for `NSString`.
 */

@interface NSString (DTUtilities)

/**-------------------------------------------------------------------------------------
 @name Working with Identifiers
 ---------------------------------------------------------------------------------------
 */

/** Creates a new string that contains a generated UUID. 
 
 @return The path to the app's Caches folder.
 */
+ (NSString *)stringWithUUID;


/**-------------------------------------------------------------------------------------
 @name Working with Checksums
 ---------------------------------------------------------------------------------------
 */

/** creates an MD5 checksum 
 
 @return returns an MD5 hash for the receiver.
 */
- (NSString *)md5Checksum;



@end
