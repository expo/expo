//
//  DTASN1Serialization.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 3/9/13.
//  Copyright (c) 2013 Cocoanetics. All rights reserved.
//

#import "DTASN1Parser.h"

/**
 Convenience factory for deserializing ASN.1 data
 */
@interface DTASN1Serialization : NSObject

/**
 Creates an object from ASN.1 data
 @param data The ASN.1 data
 @returns The deserialized object or `nil` if an error occured
 */
+ (nullable id)objectWithData:(nonnull NSData *)data;

@end
