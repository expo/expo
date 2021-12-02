//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesParameterParser.h>

@interface EXUpdatesParameterParser (Private)
@end

@implementation EXUpdatesParameterParser {
  // String to be parsed.
  NSString *_chars;
  
  // Current position in the string.
  int _pos;
  
  // Maximum position in the string.
  NSUInteger _len;
  
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
  while ((_i1 < _i2) && [[NSCharacterSet whitespaceCharacterSet] characterIsMember:[_chars characterAtIndex:_i1]]) {
    _i1++;
  }
  
  // Trim trailing white spaces
  while ((_i2 > _i1) && [[NSCharacterSet whitespaceCharacterSet] characterIsMember:[_chars characterAtIndex:(_i2 - 1)]]) {
      _i2--;
  }
  
  // Strip away quotation marks if necessary
  if (quoted
      && ((_i2 - _i1) >= 2)
      && ([_chars characterAtIndex:_i1] == '"')
      && ([_chars characterAtIndex:(_i2 - 1)] == '"')) {
      _i1++;
      _i2--;
  }
  
  NSString *result = nil;
  if (_i2 > _i1) {
    result = [_chars substringWithRange:NSMakeRange(_i1, _i2 - _i1)];
  }
  return result;
}

/**
 * Parses out a token until any of the given terminators
 * is encountered.
 */
- (NSString *)parseTokenWithTerminators:(NSCharacterSet *)terminators {
  unichar ch;
  _i1 = _pos;
  _i2 = _pos;
  while ([self hasChar]) {
    ch = [_chars characterAtIndex:_pos];
    if ([terminators characterIsMember:ch]) {
      break;
    }
    _i2++;
    _pos++;
  }
  return [self getTokenWithQuoted:false];
}

/**
 * Parses out a token until any of the given terminators
 * is encountered outside the quotation marks.
 */
- (NSString *)parseQuotedTokenWithTerminators:(NSCharacterSet *)terminators {
  unichar ch;
  _i1 = _pos;
  _i2 = _pos;
  BOOL quoted = false;
  BOOL charEscaped = false;
  
  while ([self hasChar]) {
    ch = [_chars characterAtIndex:_pos];
    if (!quoted && [terminators characterIsMember:ch]) {
      break;
    }
    if (!charEscaped && ch == '"') {
      quoted = !quoted;
    }
    charEscaped = (!charEscaped && ch == '\\');
    _i2++;
    _pos++;
  }
  
  return [self getTokenWithQuoted:true];
}

/**
 * Are there any characters left to parse?
 */
- (BOOL)hasChar {
  return _pos < _len;
}

/**
 * Extracts a map of name/value pairs from the given string. Names are expected to be unique.
 */
- (NSDictionary<NSString *, NSString *> *)parseParameterString:(NSString *)parameterString withDelimiter:(NSString *)delimiter {
  _chars = parameterString;
  _len = parameterString.length;
  
  NSMutableDictionary *params = [NSMutableDictionary new];
  
  NSString *paramName;
  NSString *paramValue;
  
  while ([self hasChar]) {
    paramName = [self parseTokenWithTerminators:[NSCharacterSet characterSetWithCharactersInString:[NSString stringWithFormat:@"%@=", delimiter]]];
    paramValue = nil;
    
    if ([self hasChar] && [_chars characterAtIndex:_pos] == '=') {
      _pos++; // skip '='
      paramValue = [self parseQuotedTokenWithTerminators:[NSCharacterSet characterSetWithCharactersInString:delimiter]];
    }
    
    if ([self hasChar] && ([_chars characterAtIndex:_pos] == [delimiter characterAtIndex:0])) {
      _pos++; // skip separator
    }
    
    if (paramName != nil && paramName.length > 0) {
      [params setValue:(paramValue ?: [NSNull null]) forKey:paramName];
    }
  }
  
  return params;
}

@end
