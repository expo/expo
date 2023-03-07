//  Copyright © 2019 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Derivation of ParameterParser class in the apache commons file upload
 * project: https://commons.apache.org/proper/commons-fileupload/
 *
 * A simple parser intended to parse sequences of name/value pairs.
 *
 * Parameter values are expected to be enclosed in quotes if they
 * contain unsafe characters, such as '=' characters or separators.
 * Parameter values are optional and can be omitted.
 */
@interface EXUpdatesParameterParser : NSObject

- (NSDictionary *)parseParameterString:(NSString *)parameterString withDelimiter:(unichar)delimiter;

@end

NS_ASSUME_NONNULL_END
