//
//  DTFolderMonitor.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 05.08.13.
//  Copyright (c) 2013 Cocoanetics. All rights reserved.
//

#import "DTFolderMonitor.h"

@implementation DTFolderMonitor
{
	NSURL *_URL;
	DTFolderMonitorBlock _block;
	
	int _fileDescriptor;
	dispatch_queue_t _queue;
	dispatch_source_t _source;
}

+ (DTFolderMonitor *)folderMonitorForURL:(NSURL *)URL block:(DTFolderMonitorBlock)block
{
	return [[DTFolderMonitor alloc] initWithURL:URL block:block];
}

- (instancetype)initWithURL:(NSURL *)URL block:(DTFolderMonitorBlock)block
{
	NSParameterAssert(URL);
	NSParameterAssert(block);
	NSAssert([URL isFileURL], @"URL Parameter must be a folder URL");
	
	self = [super init];
	
	if (self)
	{
		_URL = URL;
		_block = [block copy];
		_queue = dispatch_queue_create("DTFolderMonitor Queue", 0);
	}
	
	return self;
}

- (void)dealloc
{
	[self stopMonitoring];
	
#if !OS_OBJECT_USE_OBJC
	dispatch_release(_queue);
#endif
}

- (void)startMonitoring
{
	@synchronized(self)
	{
		if (_source)
		{
			return;
		}
		
		_fileDescriptor = open([_URL.path fileSystemRepresentation], O_EVTONLY);
		
		if (!_fileDescriptor) {
			return;
		}
        
		// watch the file descriptor for writes
		_source = dispatch_source_create(DISPATCH_SOURCE_TYPE_VNODE, _fileDescriptor, DISPATCH_VNODE_WRITE, _queue);
		
		// call the passed block if the source is modified
		dispatch_source_set_event_handler(_source, _block);
		
		// close the file descriptor when the dispatch source is cancelled
		dispatch_source_set_cancel_handler(_source, ^{
			
			close(self->_fileDescriptor);
		});
		
		// at this point the dispatch source is paused, so start watching
		dispatch_resume(_source);
	}
}

- (void)stopMonitoring
{
	@synchronized(self)
	{
		if (!_source)
		{
			return;
		}
		
		dispatch_source_cancel(_source);
		
#if !OS_OBJECT_USE_OBJC
		dispatch_release(_source);
#endif
		_source = nil;
	}
}

@end
