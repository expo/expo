//
//  DTBase64Coding.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 04.03.13.
//  Copyright (c) 2013 Cocoanetics. All rights reserved.
//

/**
 Utility class for encoding and decoding data in base64 format.
 
 This was formerly a category on `NSData` but since Matt Gallagher's category has become so enormously popular people where reporting more and more conflicts. Thus we decided to move it into a properly named class.
 
 Since all methods are class methods you never need to actually initialize it, doing so will raises a `DTAbstractClassException`.
 */

@interface DTBase64Coding : NSObject

/**
 Encoding and Decoding
 */

/**
 Encodes data as base64 string.
 @param data The data to encode
 @returns The encoded string
 */
+ (NSString *)stringByEncodingData:(NSData *)data;

/**
 Encodes data as base64 string.
 @param string The string with data encoded in base64 format
 @returns data The decoded data
 */
+ (NSData *)dataByDecodingString:(NSString *)string;

@end
