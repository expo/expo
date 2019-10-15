//
//  NSString+DTPaths.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 2/15/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//


/** 
 A collection of useful additions for `NSString` to deal with paths.
 */

@interface NSString (DTPaths)

/**-------------------------------------------------------------------------------------
 @name Getting Standard Paths
 ---------------------------------------------------------------------------------------
 */

/** Determines the path to the Library/Caches folder in the current application's sandbox.
 
 The return value is cached on the first call.
 
 @return The path to the app's Caches folder.
 */
+ (NSString * _Nonnull)cachesPath;


/** Determines the path to the Documents folder in the current application's sandbox.
 
 The return value is cached on the first call.
 
 @return The path to the app's Documents folder.
 */
+ (NSString * _Nonnull)documentsPath;

/**-------------------------------------------------------------------------------------
 @name Getting Temporary Paths
 ---------------------------------------------------------------------------------------
 */

/** Determines the path for temporary files in the current application's sandbox.
 
 The return value is cached on the first call. This value is different in Simulator than on the actual device. In Simulator you get a reference to /tmp wheras on iOS devices it is a special folder inside the application folder.
 
 @return The path to the app's folder for temporary files.
 */
+ (NSString * _Nonnull)temporaryPath;


/** Creates a unique filename that can be used for one temporary file or folder.
 
 The returned string is different on every call. It is created by combining the result from temporaryPath with a unique UUID.
 
 @return The generated temporary path.
 */
+ (NSString * _Nonnull)pathForTemporaryFile;


/**-------------------------------------------------------------------------------------
 @name Working with Paths
 ---------------------------------------------------------------------------------------
 */

/** Appends or Increments a sequence number in brackets 
 
 If the receiver already has a number suffix then it is incremented. If not then (1) is added.
 
 @return The incremented path
*/
- (NSString * _Nonnull)pathByIncrementingSequenceNumber;


/** Removes a sequence number in brackets 
 
 If the receiver number suffix then it is removed. If not the receiver is returned.
 
 @return The modified path
 */
- (NSString * _Nonnull)pathByDeletingSequenceNumber;




@end
