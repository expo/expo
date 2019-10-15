//
//  NSFileWrapper+DTCopying.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 10/19/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

/**
 Methods for copying file wrappers.
 */
@interface NSFileWrapper (DTCopying)

/**
 Creates a copy of the receiver by deep copying all contained sub filewrappers.
 */
- (NSFileWrapper *)fileWrapperByDeepCopying;

@end
