//
//  NSURL+DTComparing.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 13.11.12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

/**
 Category for comparing URLs.
 
 Contrary to what you might think isEqual: does not work properly in many cases.
 */

@interface NSURL (DTComparing)

/**
 Compares the receiver with another URL
 @param URL another URL
 @returns `YES` if the receiver is equivalent with the passed URL
 */
- (BOOL)isEqualToURL:(NSURL *)URL;

@end
