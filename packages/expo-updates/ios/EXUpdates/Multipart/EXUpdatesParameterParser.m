//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesParameterParser.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesParameterParser {
  // String to be parsed.
  NSString *_parameterString;
  
  // Current position in the string.
  int _currentPosition;
  
  // Start of a token.
  int _i1;
  
  // End of a token.
  int _i2;
}

/**
 * A helper method to process the parsed token. This method removes
 * leading and trailing blanks as well as enclosing quotation marks,
 * when necessary.
 */
- (nullable NSString *)getTokenWithQuoted:(BOOL)quoted {
  // Trim leading white spaces
  while ((_i1 < _i2) && [[NSCharacterSet whitespaceCharacterSet] characterIsMember:[_parameterString characterAtIndex:_i1]]) {
    _i1++;
  }
  
  // Trim trailing white spaces
  while ((_i2 > _i1) && [[NSCharacterSet whitespaceCharacterSet] characterIsMember:[_parameterString characterAtIndex:(_i2 - 1)]]) {
      _i2--;
  }
  
  // Strip away quotation marks if necessary
  if (quoted
      && ((_i2 - _i1) >= 2)
      && ([_parameterString characterAtIndex:_i1] == '"')
      && ([_parameterString characterAtIndex:(_i2 - 1)] == '"')) {
      _i1++;
      _i2--;
  }
  
  NSString *result = nil;
  if (_i2 > _i1) {
    result = [_parameterString substringWithRange:NSMakeRange(_i1, _i2 - _i1)];
  }
  return result;
}

/**
 * Parses out a token until any of the given terminators
 * is encountered.
 */
- (NSString *)parseTokenWithTerminators:(NSCharacterSet *)terminators {
  unichar ch;
  _i1 = _currentPosition;
  _i2 = _currentPosition;
  while ([self hasChar]) {
    ch = [_parameterString characterAtIndex:_currentPosition];
    if ([terminators characterIsMember:ch]) {
      break;
    }
    _i2++;
    _currentPosition++;
  }
  return [self getTokenWithQuoted:false];
}

/**
 * Parses out a token until any of the given terminators
 * is encountered outside the quotation marks.
 */
- (NSString *)parseQuotedTokenWithTerminators:(NSCharacterSet *)terminators {
  unichar ch;
  _i1 = _currentPosition;
  _i2 = _currentPosition;
  BOOL quoted = false;
  BOOL charEscaped = false;
  
  while ([self hasChar]) {
    ch = [_parameterString characterAtIndex:_currentPosition];
    if (!quoted && [terminators characterIsMember:ch]) {
      break;
    }
    if (!charEscaped && ch == '"') {
      quoted = !quoted;
    }
    charEscaped = (!charEscaped && ch == '\\');
    _i2++;
    _currentPosition++;
  }
  
  return [self getTokenWithQuoted:true];
}

/**
 * Are there any characters left to parse?
 */
- (BOOL)hasChar {
  return _currentPosition < _parameterString.length;
}

/**
 * Extracts a map of name/value pairs from the given string. Names are expected to be unique.
 */
- (NSDictionary *)parseParameterString:(NSString *)parameterString withDelimiter:(unichar)delimiter {
  _parameterString = parameterString;
  
  NSMutableDictionary *params = [NSMutableDictionary new];
  
  NSString *paramName;
  NSString *paramValue;
  
  NSCharacterSet *charSetDelimiter = [NSCharacterSet characterSetWithCharactersInString:[NSString stringWithFormat:@"%C", delimiter]];
  NSCharacterSet *charSetDelimiterAndEquals = [NSCharacterSet characterSetWithCharactersInString:[NSString stringWithFormat:@"%C=", delimiter]];
  
  while ([self hasChar]) {
    paramName = [self parseTokenWithTerminators:charSetDelimiterAndEquals];
    paramValue = nil;
    
    if ([self hasChar] && [_parameterString characterAtIndex:_currentPosition] == '=') {
      _currentPosition++; // skip '='
      paramValue = [self parseQuotedTokenWithTerminators:charSetDelimiter];
    }
    
    if ([self hasChar] && ([_parameterString characterAtIndex:_currentPosition] == delimiter)) {
      _currentPosition++; // skip separator
    }
    
    if (paramName != nil && paramName.length > 0) {
      [params setValue:(paramValue ?: [NSNull null]) forKey:paramName];
    }
  }
  
  return params;
}

@end

NS_ASSUME_NONNULL_END
