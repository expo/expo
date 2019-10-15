//
//  NSFileWrapper+DTCopying.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 10/19/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

#import "NSFileWrapper+DTCopying.h"

@implementation NSFileWrapper (DTCopying)

- (NSFileWrapper *)fileWrapperByDeepCopying
{
	if ([self isDirectory])
	{
		NSMutableDictionary *subFileWrappers = [NSMutableDictionary dictionary];
		
		[self.fileWrappers enumerateKeysAndObjectsUsingBlock:^(NSString *fileName, NSFileWrapper *fileWrapper, BOOL *stop) {
			NSFileWrapper *copyWrapper = [fileWrapper fileWrapperByDeepCopying];
            subFileWrappers[fileName] = copyWrapper;
		}];
		
		NSFileWrapper *fileWrapper = [[NSFileWrapper alloc] initDirectoryWithFileWrappers:subFileWrappers];
		
		return fileWrapper;
	}
	
	NSFileWrapper *fileWrapper = [[NSFileWrapper alloc] initRegularFileWithContents:self.regularFileContents];
	return fileWrapper;
}

@end
