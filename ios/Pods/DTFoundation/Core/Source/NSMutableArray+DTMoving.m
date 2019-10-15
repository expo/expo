//
//  NSMutableArray+DTMoving.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 9/27/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

#import "NSMutableArray+DTMoving.h"

@implementation NSMutableArray (DTMoving)

// credit: http://www.cocoabuilder.com/archive/cocoa/189484-nsarray-move-items-at-indexes.html

- (void)moveObjectsAtIndexes:(NSIndexSet *)indexes toIndex:(NSUInteger)idx
{
	NSArray *objectsToMove = [self objectsAtIndexes:indexes];
	
	// If any of the removed objects come before the index, we want to decrement the index appropriately
	idx -= [indexes countOfIndexesInRange:(NSRange){0, idx}];
	
	[self removeObjectsAtIndexes:indexes];
	[self replaceObjectsInRange:(NSRange){idx,0} withObjectsFromArray:objectsToMove];
}

@end
