//
//  DTWeakSupport.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 6/3/13.
//  Copyright (c) 2013 Cocoanetics. All rights reserved.
//

/**
 Useful defines for building code the compiles with zeroing weak references if the deployment target allows it. This is possible from minimum supported iOS 5.0 and OS X 10.7 and above. Note that on OS X 10.7 some AppKit classes do not support having a weak ref, e.g. NSWindowController or NSViewController.
*/

#import <Availability.h>

#if __has_feature(objc_arc_weak)

	// zeroing weak refs are supported for ivars and properties
	#define DT_WEAK_VARIABLE __weak
	#define DT_WEAK_PROPERTY weak

#elif __has_feature(objc_arc)

	/// zeroing weak refs not supported, fall back to unsafe unretained and assigning
	#define DT_WEAK_VARIABLE __unsafe_unretained
	#define DT_WEAK_PROPERTY assign

#else

	// define something, as this header might be included in a non-ARC project for using compiled code from an ARC static lib
	#define DT_WEAK_VARIABLE
	#define DT_WEAK_PROPERTY assign

#endif