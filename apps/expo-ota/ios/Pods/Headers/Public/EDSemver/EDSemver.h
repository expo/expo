//
//  EDSemver.h
//  semver
//
//  Created by Andrew Sliwinski on 7/4/13.
//  Copyright (c) 2013 Andrew Sliwinski. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface EDSemver : NSObject

/*!
 *  The major version number (API changes)
 */
@property (readonly) NSInteger major;
/*!
 *  The minor version (functionality added in a backwards compatible manor)
 */
@property (readonly) NSInteger minor;
/*!
 *  The patch version (bug fixes made in a backwards compatible manor)
 */
@property (readonly) NSInteger patch;
/*!
 *  The prerelease number, preceded with -, e.g. 1.2.3-alpha1
 */
@property (readonly, nullable) NSString *prerelease;
/*!
 *  The build number, preceded with +, e.g. 1.2.3+456
 */
@property (readonly, nullable) NSString *build;

/*!
 *  The current semver spec version
 *
 *  @return The spec version as a string
 */
+ (nonnull NSString *)spec;
/*!
 *  Create a semver object with a version string
 *
 *  @param aString The version string
 *
 *  @return The semver object
 */
+ (nonnull instancetype)semverWithString:(nonnull NSString *)aString;

/*!
 *  Create a semver object with a version string
 *
 *  @param aString The version string
 *
 *  @return The semver object
 */
- (nonnull instancetype)initWithString:(nonnull NSString *)aString;

/*!
 *  Compare semver objects
 *
 *  @param aVersion The version string
 *
 *  @return The semver object
 */
- (NSComparisonResult)compare:(nonnull EDSemver *)aVersion;
/*!
 *  Is version equal to another version
 *  Implemented using `compare:`. Returns NO parameter is nil
 *
 *  @param object Another version
 *
 *  @return YES if equal, NO otherwise
 */
- (BOOL)isEqualTo:(nullable id)object;
/*!
 *  Is version less than another version.
 *  Implemented using `compare:`. Returns NO parameter is nil
 *
 *  @param object Another version
 *
 *  @return YES if less than, NO otherwise
 */
- (BOOL)isLessThan:(nullable id)object;
/*!
 *  Is version greater than than another version.
 *  Implemented using `compare:`. Returns NO parameter is nil
 *
 *  @param object Another version
 *
 *  @return YES if greater than, NO otherwise
 */
- (BOOL)isGreaterThan:(nullable id)object;

/*!
 *  Is the semver object valid?
 *
 *  @return YES if valid, NO otherwise
 */
- (BOOL)isValid;

@end
