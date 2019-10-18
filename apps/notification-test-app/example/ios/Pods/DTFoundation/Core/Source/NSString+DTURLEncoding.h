//
//  NSString+DTURLEncoding.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 4/16/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

/** 
 A collection of useful additions for `NSString` to deal with URL encoding.
 */

@interface NSString (DTURLEncoding)

/**-------------------------------------------------------------------------------------
 @name Encoding Strings for URLs
 ---------------------------------------------------------------------------------------
 */


/** Encoding suitable for use in URLs.
 
 stringByAddingPercentEscapes does not replace serveral characters which are problematics in URLs.
 
 @return The encoded version of the receiver.
 */
- (NSString *)stringByURLEncoding;

@end
