//
//  NSString+DTFormatNumbers.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 11/25/11.
//  Copyright (c) 2011 Cocoanetics. All rights reserved.
//


/** 
 A collection of category extensions for `NSString` dealing with the formatting of numbers in special contexts. 
 */

@interface NSString (DTFormatNumbers)

/**-------------------------------------------------------------------------------------
 @name Formatting File Sizes 
 ---------------------------------------------------------------------------------------
 */


/** Formats the passed number as a byte value in a form that is pleasing to the user when displayed next to a progress bar.
 
 Output numbers are rounded to one decimal place. Bytes are not abbreviated because most users might not be used to B for that. Higher units are kB, MB, GB and TB.
 
 @param bytes The value of the bytes to be formatted
 @return Returns the formatted string.

 */
+ (NSString *)stringByFormattingBytes:(long long)bytes;

@end
