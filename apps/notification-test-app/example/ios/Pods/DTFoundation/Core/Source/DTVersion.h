//
//  DTVersion.h
//  DTFoundation
//
//  Created by Oliver Drobnik on 11/25/11.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.

/**
  Class that represents a version number comprised of major, minor and maintenance number separated by dots. For example "1.2.2".
  This encapsulation simplifies comparing versions against each other. Sub-numbers that are omitted on creating a `DTVersion` are assumed to be 0.
 */
@interface DTVersion : NSObject
{
	NSUInteger _major;
	NSUInteger _minor;
	NSUInteger _maintenance;
	NSUInteger _build;
}

/**-------------------------------------------------------------------------------------
 @name Properties
 ---------------------------------------------------------------------------------------
 */

/**
 The major version number
 */
@property (nonatomic, readonly) NSUInteger major;

/**
 The minor version number
 */
@property (nonatomic, readonly) NSUInteger minor;


/**
 The maintenance/hotfix version number
 */
@property (nonatomic, readonly) NSUInteger maintenance;

/**
 The build number
 */
@property (nonatomic, readonly) NSUInteger build;

/**-------------------------------------------------------------------------------------
 @name Creating Versions
 ---------------------------------------------------------------------------------------
 */

/**
 Initializes the receiver with major, minor and maintenance version.
 @param major The major version number
 @param minor The minor version number
 @param maintenance The maintainance/hotfix version number
 @returns The initialized `DTVersion`
 */
- (DTVersion *)initWithMajor:(NSUInteger)major minor:(NSUInteger)minor maintenance:(NSUInteger)maintenance;

/**
 Initializes the receiver with major, minor and maintenance version.
 @param major The major version number
 @param minor The minor version number
 @param maintenance The maintainance/hotfix version number
 @param build The build number
 @returns The initialized `DTVersion`
 */
- (DTVersion *)initWithMajor:(NSUInteger)major minor:(NSUInteger)minor maintenance:(NSUInteger)maintenance build:(NSUInteger)build;

/**
 creates and returns a DTVersion object initialized using the provided string
 @param versionString The `NSString` to create a `DTVersion` from
 @returns A DTVersion object or <code>nil</code> if the string is not a valid version number 
 */
+ (DTVersion *)versionWithString:(NSString *)versionString;

/**
 creates and retuns a DTVersion object initialized with the version information of the current application
 @returns A DTVersion object or <code>nil</code> if the string of the current application is not a valid version number 
 */
+ (DTVersion *)appBundleVersion;

/**
 creates and retuns a DTVersion object initialized with the version information of the operating system
 @returns A DTVersion object or <code>nil</code> if the string of the current application is not a valid version number 
 */
+ (DTVersion *)osVersion;

/**-------------------------------------------------------------------------------------
 @name Comparing Versions
 ---------------------------------------------------------------------------------------
 */

/**
 @param versionString The OS version as `NSString` to compare the receiver to
 @returns <code>true</code> if the given version string is valid and less then the osVersion
*/
+ (BOOL)osVersionIsLessThen:(NSString *)versionString;

/**
 @param versionString The OS version as `NSString` to compare the receiver to
 @returns <code>true</code> if the given version string is valid and greater then the osVersion
*/
+ (BOOL)osVersionIsGreaterThen:(NSString *)versionString;

/**
 @param version The `DTVersion` to compare the receiver to
 @returns <code>true</code> if the give version is less then this version
*/
- (BOOL)isLessThenVersion:(DTVersion *)version;

/**
 @param version The `DTVersion` to compare the receiver to
 @returns <code>true</code> if the give version is greater then this version
*/
- (BOOL)isGreaterThenVersion:(DTVersion *)version;

/**
 @param versionString The version as `NSString` to compare the receiver to
 @returns <code>true</code> if the give version is less then this version string
*/
- (BOOL)isLessThenVersionString:(NSString *)versionString;

/**
 @param versionString The version as `NSString` to compare the receiver to
* @returns <code>true</code> if the give version is greater then version string
*/
- (BOOL)isGreaterThenVersionString:(NSString *)versionString;

/**
 Compares the receiver against a passed `DTVersion` instance
 @param version The `DTVersion` to compare the receiver to
 @returns `YES` is the versions are equal
 */
- (BOOL)isEqualToVersion:(DTVersion *)version;

/**
 Compares the receiver against a passed version as `NSString`
 @param versionString The version as `NSString` to compare the receiver to
 @returns `YES` is the versions are equal
 */
- (BOOL)isEqualToString:(NSString *)versionString;

/**
 Compares the receiver against a passed object
 @param object An object of either `NSString` or `DTVersion`
 @returns `YES` is the versions are equal
 */
- (BOOL)isEqual:(id)object;

/**
 Compares the receiver against a passed `DTVersion` instance
 @param version The `DTVersion` to compare the receiver to
 @returns The comparison result
 */
- (NSComparisonResult)compare:(DTVersion *)version;

@end
