//
//  NSDictionary+DTError.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 4/16/12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

/**
 A collection of useful additions for `NSDictionary` to deal with Property Lists and also to get error handling for malformed data.
 */

@interface NSDictionary (DTError)

/**-------------------------------------------------------------------------------------
 @name Property List Error Handling
 ---------------------------------------------------------------------------------------
 */

/** 
 Creates and returns a dictionary using the keys and values found in a file specified by a given URL.
 
 @param URL An URL. The file identified by URL must contain a string representation of a property list whose root object is a dictionary.
 @param error If an error occurs, upon returns contains an NSError object that describes the problem. If you are not interested in possible errors, pass in `NULL`.
 @return A new dictionary that contains the dictionary at path, or `nil` if there is a file error or if the contents of the file are an invalid representation of a dictionary.
 */
+ (NSDictionary *)dictionaryWithContentsOfURL:(NSURL *)URL error:(NSError **)error;

/** 
 Creates and returns a dictionary using the keys and values found in a file specified by a given path.
 
 @param path A full or relative pathname. The file identified by path must contain a string representation of a property list whose root object is a dictionary.
 @param error If an error occurs, upon returns contains an NSError object that describes the problem. If you are not interested in possible errors, pass in `NULL`.
 @return A new dictionary that contains the dictionary at path, or `nil` if there is a file error or if the contents of the file are an invalid representation of a dictionary.
 */
+ (NSDictionary *)dictionaryWithContentsOfFile:(NSString *)path error:(NSError **)error;

/** 
 Creates and returns a dictionary using the keys and values found in the given data.
 
 @param data The data object identified by data must contain a string representation of a property list whose root object is a dictionary.
 @param error If an error occurs, upon returns contains an NSError object that describes the problem. If you are not interested in possible errors, pass in `NULL`.
 @return A new dictionary that contains the dictionary at path, or `nil` if there is a file error or if the contents of the file are an invalid representation of a dictionary.
 */
+ (NSDictionary *)dictionaryWithContentsOfData:(NSData *)data error:(NSError **)error;

@end
