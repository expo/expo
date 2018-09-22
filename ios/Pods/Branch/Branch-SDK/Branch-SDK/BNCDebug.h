/**
 @file          BNCDebug.h
 @package       Branch-SDK
 @brief         Debugging Support.

 @author        Edward Smith
 @date          October 2016
 @copyright     Copyright © 2016 Branch. All rights reserved.
*/

/**
    @discusion

    # BNCDebug

    ## Useful run time debugging environmental variables

    Set DYLD_IMAGE_SUFFIX to _debug to load debug versions of dynamic libraries.
    Set NSDebugEnabled to YES to enable obj-c debug checks.
    Set NSZombieEnabled to YES to enable zombies to help catch the referencing of released objects.
    Set NSAutoreleaseFreedObjectCheckEnabled to YES to catch autorelease problems.
    Set MallocStackLoggingNoCompact to YES to track and save all memory allocations. Memory intensive.

    Check NSDebug.h for more debug switches. 
    Also check Apple Technical Note TN2124, TN2239, and question QA1887 for more info.

    Useful exception breakpoints to set:

        objc_exception_throw
        NSInternalInconsistencyException

    May be helpful for iPhone Simulator: GTM_DISABLE_IPHONE_LAUNCH_DAEMONS 1

    Useful lldb macros (Works after Xcode 5.0):

       command script import lldb.macosx.heap

    Search the heap for all references to the pointer 0x0000000116e13920:

       ptr_refs -m 0x0000000116e13920
*/

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif


///@functiongroup Debugging Functions


///@return  Returns true if the app is currently attached to a debugger.
extern BOOL BNCDebuggerIsAttached(void);


///@param   object An obj-c instance, class, or meta-class.
///@return  Returns an NSString with a dump of the methods and member variables of the instance,
///         class, or meta-class.
extern NSString* _Nonnull BNCDebugStringFromObject(id _Nullable object);


///@return  Returns the names of all loaded classes as an array of NSStrings.
extern NSArray<NSString*> * _Nonnull BNCDebugArrayOfReqisteredClasses(void);


///@return  Returns an NSString indicating the name of the enclosing method.
#define BNCSStringForCurrentMethod() \
    NSStringFromSelector(_cmd)


///@return  Returns an NSString indicating the name of the enclosing function.
#define BNCSStringForCurrentFunction() \
    [NSString stringWithFormat:@"%s", __FUNCTION__]


/// Stops execution at the current execution point.
/// If attached to a debugger, current app will halt and wait for the debugger.
/// If not attached to a debugger then the current app will probably quit executing.
#define BNCDebugBreakpoint() \
    do { raise(SIGINT); } while (0)


#ifdef __cplusplus
}
#endif
