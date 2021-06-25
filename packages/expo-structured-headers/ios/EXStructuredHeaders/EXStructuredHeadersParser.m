//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXStructuredHeaders/EXStructuredHeadersParser.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, EXStructuredHeadersParserNumberType) {
  EXStructuredHeadersParserNumberTypeInteger,
  EXStructuredHeadersParserNumberTypeDecimal
};

static NSString * const EXStructuredHeadersParserErrorDomain = @"EXStructuredHeadersParser";

@interface EXStructuredHeadersParser ()

@property (nonatomic, strong) NSString *raw;
@property (nonatomic, assign) NSUInteger position;

@property (nonatomic, assign) EXStructuredHeadersParserFieldType fieldType;
@property (nonatomic, assign) BOOL shouldIgnoreParameters;

@end

@implementation EXStructuredHeadersParser

- (instancetype)initWithRawInput:(NSString *)raw fieldType:(EXStructuredHeadersParserFieldType)fieldType
{
  return [self initWithRawInput:raw fieldType:fieldType ignoringParameters:NO];
}

- (instancetype)initWithRawInput:(NSString *)raw fieldType:(EXStructuredHeadersParserFieldType)fieldType ignoringParameters:(BOOL)shouldIgnoreParameters
{
  if (self = [super init]) {
    _raw = raw;
    _position = 0;
    _fieldType = fieldType;
    _shouldIgnoreParameters = shouldIgnoreParameters;
  }
  return self;
}

- (nullable id)parseStructuredFieldsWithError:(NSError ** _Nullable)error
{
  // 4.2

  // check for non-ASCII characters
  for (int i = 0; i < _raw.length; i++) {
    unichar ch = [_raw characterAtIndex:i];
    if (ch < 0x00 || ch > 0x7F) {
      if (error) *error = [self errorWithMessage:[NSString stringWithFormat:@"Invalid character at index %i", i]];
      return nil;
    }
  }

  [self removeLeadingSP];

  id output;
  switch (_fieldType) {
    case EXStructuredHeadersParserFieldTypeList:
      output = [self _parseAListWithError:error];
      break;
    case EXStructuredHeadersParserFieldTypeDictionary:
      output = [self _parseADictionaryWithError:error];
      break;
    case EXStructuredHeadersParserFieldTypeItem:
      output = [self _parseAnItemWithError:error];
      break;
    default:
      if (error) *error = [self errorWithMessage:@"Invalid field type given to parser"];
      break;
  }
  if (!output) return nil;

  [self removeLeadingSP];
  if ([self hasRemaining]) {
    if (error) *error = [self errorWithMessage:@"Failed to parse structured fields; unexpected trailing characters found"];
    return nil;
  }

  return output;
}

- (nullable NSArray *)_parseAListWithError:(NSError ** _Nullable)error
{
  // 4.2.1
  NSMutableArray *members = [NSMutableArray new];
  while ([self hasRemaining]) {
    id itemOrInnerList = [self _parseAnItemOrInnerListWithError:error];
    if (!itemOrInnerList) return nil;
    [members addObject:itemOrInnerList];

    [self removeLeadingOWS];
    if (![self hasRemaining]) {
      return [members copy];
    }

    if ([self consume] != ',') {
      if (error) *error = [self errorWithMessage:@"Failed to parse list; invalid character after list member"];
      return nil;
    }

    [self removeLeadingOWS];
    if (![self hasRemaining]) {
      if (error) *error = [self errorWithMessage:@"List cannot have a trailing comma"];
      return nil;
    }
  }

  return [members copy];
}

- (nullable id)_parseAnItemOrInnerListWithError:(NSError ** _Nullable)error
{
  // 4.2.1.1
  if ([self compareNextChar:'(']) {
    return [self _parseAnInnerListWithError:error];
  } else {
    return [self _parseAnItemWithError:error];
  }
}

- (nullable NSArray *)_parseAnInnerListWithError:(NSError ** _Nullable)error
{
  // 4.2.1.2
  if ([self consume] != '(') {
    if (error) *error = [self errorWithMessage:@"Inner list must start with '('"];
    return nil;
  }

  NSMutableArray *innerList = [NSMutableArray new];
  while ([self hasRemaining]) {
    [self removeLeadingSP];

    if ([self compareNextChar:')']) {
      [self advance];
      NSDictionary *parameters = [self _parseParametersWithError:error];
      if (!parameters) return nil;
      return [self _memberEntryWithValue:innerList.copy parameters:parameters];
    }

    id item = [self _parseAnItemWithError:error];
    if (!item) return nil;
    [innerList addObject:item];

    if (![self compareNextCharWithSet:@" )"]) {
      if (error) *error = [self errorWithMessage:@"Failed to parse inner list; invalid character after item"];
      return nil;
    }
  }

  if (error) *error = [self errorWithMessage:@"Failed to parse inner list; end of list not found"];
  return nil;
}

- (nullable NSDictionary *)_parseADictionaryWithError:(NSError ** _Nullable)error
{
  // 4.2.2
  NSMutableDictionary *dictionary = [NSMutableDictionary new];
  while ([self hasRemaining]) {
    NSString *key = [self _parseAKeyWithError:error];
    if (!key) return nil;

    id member;
    if ([self compareNextChar:'=']) {
      [self advance];
      member = [self _parseAnItemOrInnerListWithError:error];
      if (!member) return nil;
    } else {
      NSDictionary *parameters = [self _parseParametersWithError:error];
      if (!parameters) return nil;
      member = [self _memberEntryWithValue:@(YES) parameters:parameters];
    }

    dictionary[key] = member;
    [self removeLeadingOWS];
    if (![self hasRemaining]) {
      return [dictionary copy];
    }

    if ([self consume] != ',') {
      if (error) *error = [self errorWithMessage:@"Failed to parse dictionary; invalid character after member"];
      return nil;
    }

    [self removeLeadingOWS];
    if (![self hasRemaining]) {
      if (error) *error = [self errorWithMessage:@"Dictionary cannot have a trailing comma"];
      return nil;
    }
  }

  return [dictionary copy];
}

- (nullable id)_parseAnItemWithError:(NSError ** _Nullable)error
{
  // 4.2.3
  id bareItem = [self _parseABareItemWithError:error];
  if (!bareItem) return nil;
  NSDictionary *parameters = [self _parseParametersWithError:error];
  if (!parameters) return nil;
  return [self _memberEntryWithValue:bareItem parameters:parameters];
}

- (nullable id)_parseABareItemWithError:(NSError ** _Nullable)error
{
  // 4.2.3.1
  unichar firstChar = [self peek];
  if ([self isDigit:firstChar] || firstChar == '-') {
    return [self _parseAnIntegerOrDecimalWithError:error];
  } else if (firstChar == '"') {
    return [self _parseAStringWithError:error];
  } else if ([self isAlpha:firstChar] || firstChar == '*') {
    return [self _parseATokenWithError:error];
  } else if (firstChar == ':') {
    return [self _parseAByteSequenceWithError:error];
  } else if (firstChar == '?') {
    return [self _parseABooleanWithError:error];
  } else {
    if (error) *error = [self errorWithMessage:@"Unrecognized item type"];
    return nil;
  }
}

- (nullable NSDictionary *)_parseParametersWithError:(NSError ** _Nullable)error
{
  // 4.2.3.2
  NSMutableDictionary *parameters = [NSMutableDictionary new];
  while ([self hasRemaining]) {
    if (![self compareNextChar:';']) {
      break;
    }
    [self advance];
    [self removeLeadingSP];
    NSString *key = [self _parseAKeyWithError:error];
    if (!key) return nil;
    id value = @(YES);
    if ([self compareNextChar:'=']) {
      [self advance];
      value = [self _parseABareItemWithError:error];
      if (!value) return nil;
    }
    parameters[key] = value;
  }
  return [parameters copy];
}

- (nullable NSString *)_parseAKeyWithError:(NSError ** _Nullable)error
{
  // 4.2.3.3
  unichar firstChar = [self peek];
  if (![self isLowercaseAlpha:firstChar] && firstChar != '*') {
    if (error) *error = [self errorWithMessage:@"Key must begin with a lowercase letter or '*'"];
    return nil;
  }

  NSMutableString *outputString = [NSMutableString stringWithCapacity:[self remainingLength]];
  while ([self hasRemaining]) {
    unichar nextChar = [self peek];
    if (![self isLowercaseAlpha:nextChar] && ![self isDigit:nextChar] && ![self compareChar:nextChar withSet:@"_-.*"]) {
      return [outputString copy];
    } else {
      [outputString appendFormat:@"%c", nextChar];
      [self advance];
    }
  }

  return [outputString copy];
}

- (nullable NSNumber *)_parseAnIntegerOrDecimalWithError:(NSError ** _Nullable)error
{
  // 4.2.4
  EXStructuredHeadersParserNumberType type = EXStructuredHeadersParserNumberTypeInteger;
  NSInteger sign = 1;
  NSMutableString *inputNumber = [NSMutableString stringWithCapacity:20];

  if ([self compareNextChar:'-']) {
    [self advance];
    sign = -1;
  }

  if (![self hasRemaining]) {
    if (error) *error = [self errorWithMessage:@"Integer or decimal cannot be empty"];
    return nil;
  }

  if (![self isDigit:[self peek]]) {
    if (error) *error = [self errorWithMessage:@"Integer or decimal must begin with a digit"];
    return nil;
  }

  while ([self hasRemaining]) {
    unichar nextChar = [self consume];
    if ([self isDigit:nextChar]) {
      [inputNumber appendFormat:@"%c", nextChar];
    } else if (type == EXStructuredHeadersParserNumberTypeInteger && nextChar == '.') {
      if (inputNumber.length > 12) {
        if (error) *error = [self errorWithMessage:@"Decimal cannot have more than 12 digits before the decimal point"];
        return nil;
      }
      [inputNumber appendFormat:@"%c", nextChar];
      type = EXStructuredHeadersParserNumberTypeDecimal;
    } else {
      [self backout];
      break;
    }

    if (type == EXStructuredHeadersParserNumberTypeInteger && inputNumber.length > 15) {
      if (error) *error = [self errorWithMessage:@"Integer cannot have more than 15 digits"];
      return nil;
    } else if (type == EXStructuredHeadersParserNumberTypeDecimal && inputNumber.length > 16) {
      if (error) *error = [self errorWithMessage:@"Decimal cannot have more than 16 characters"];
      return nil;
    }
  }

  if (type == EXStructuredHeadersParserNumberTypeInteger) {
    return @(inputNumber.longLongValue * sign);
  } else {
    if ([inputNumber hasSuffix:@"."]) {
      if (error) *error = [self errorWithMessage:@"Decimal cannot end with the character '.'"];
      return nil;
    }
    if ([inputNumber rangeOfString:@"."].location + 3 < inputNumber.length - 1) {
      if (error) *error = [self errorWithMessage:@"Decimal cannot have more than 3 digits after the decimal point"];
      return nil;
    }
    return @(inputNumber.doubleValue * sign);
  }
}

- (nullable NSString *)_parseAStringWithError:(NSError ** _Nullable)error
{
  // 4.2.5
  NSMutableString *outputString = [NSMutableString stringWithCapacity:[self remainingLength]];

  if (![self compareNextChar:'"']) {
    if (error) *error = [self errorWithMessage:@"String must begin with the character '\"'"];
    return nil;
  }

  [self advance];
  while ([self hasRemaining]) {
    unichar nextChar = [self consume];
    if (nextChar == '\\') {
      if (![self hasRemaining]) {
        if (error) *error = [self errorWithMessage:@"String cannot end with the character '\\'"];
        return nil;
      }
      unichar followingChar = [self consume];
      if (![self compareChar:followingChar withSet:@"\"\\"]) {
        if (error) *error = [self errorWithMessage:@"String cannot contain '\\' followed by an invalid character"];
        return nil;
      }
      [outputString appendFormat:@"%c", followingChar];
    } else if (nextChar == '"') {
      return [outputString copy];
    } else if (nextChar < 0x20 || nextChar >= 0x7F) {
      if (error) *error = [self errorWithMessage:@"Invalid character in string"];
      return nil;
    } else {
      [outputString appendFormat:@"%c", nextChar];
    }
  }

  if (error) *error = [self errorWithMessage:@"String must have a closing '\"'"];
  return nil;
}

- (nullable NSString *)_parseATokenWithError:(NSError ** _Nullable)error
{
  // 4.2.6
  unichar firstChar = [self peek];
  if (![self isAlpha:firstChar] && firstChar != '*') {
    if (error) *error = [self errorWithMessage:@"Token must begin with an alphabetic character or '*'"];
    return nil;
  }

  NSMutableString *outputString = [NSMutableString stringWithCapacity:[self remainingLength]];
  while ([self hasRemaining]) {
    // the only allowed characters are tchar, ':', and '/'
    // check to see if nextChar is outside this set
    unichar nextChar = [self peek];
    if (nextChar <= ' ' || nextChar >= 0x7F || [self compareChar:nextChar withSet:@"\"(),;<=>?@[\\]{}"]) {
      return [outputString copy];
    } else {
      [outputString appendFormat:@"%c", [self consume]];
    }
  }

  return [outputString copy];
}

- (nullable NSData *)_parseAByteSequenceWithError:(NSError ** _Nullable)error
{
  // 4.2.7
  if (![self compareNextChar:':']) {
    if (error) *error = [self errorWithMessage:@"Byte sequence must begin with ':'"];
    return nil;
  }

  [self advance];
  NSMutableString *inputByteSequence = [NSMutableString stringWithCapacity:[self remainingLength]];
  while ([self hasRemaining]) {
    unichar nextChar = [self consume];
    if (nextChar == ':') {
      return [[NSData alloc] initWithBase64EncodedString:inputByteSequence options:kNilOptions];
    } else if (![self isBase64:nextChar]) {
      if (error) *error = [self errorWithMessage:@"Byte sequence can only contain valid base64 characters"];
      return nil;
    } else {
      [inputByteSequence appendFormat:@"%c", nextChar];
    }
  }

  if (error) *error = [self errorWithMessage:@"Byte sequence must have a closing ':'"];
  return nil;
}

- (nullable NSNumber *)_parseABooleanWithError:(NSError ** _Nullable)error
{
  // 4.2.8
  if (![self compareNextChar:'?']) {
    if (error) *error = [self errorWithMessage:@"Boolean must begin with '?'"];
    return nil;
  }

  [self advance];
  unichar nextChar = [self peek];
  if (nextChar == '1') {
    [self advance];
    return @(YES);
  } else if (nextChar == '0') {
    [self advance];
    return @(NO);
  } else {
    if (error) *error = [self errorWithMessage:@"Invalid value for boolean"];
    return nil;
  }
}

# pragma mark - ignoring parameters

- (nullable id)_memberEntryWithValue:(id)value parameters:(NSDictionary *)parameters
{
  if (_shouldIgnoreParameters) {
    return value;
  } else {
    return @[value, parameters];
  }
}

# pragma mark - utility methods

- (BOOL)hasRemaining
{
  return _position < _raw.length;
}

- (NSUInteger)remainingLength
{
  return _raw.length - _position;
}

- (unichar)peek
{
  return [self hasRemaining] ? [_raw characterAtIndex:_position] : (unichar) -1;
}

- (void)advance
{
  _position++;
}

- (void)backout
{
  _position--;
}

- (unichar)consume
{
  unichar thisChar = [self peek];
  [self advance];
  return thisChar;
}

- (BOOL)compareNextChar:(unichar)match
{
  return [self hasRemaining] ? [self peek] == match : NO;
}

- (BOOL)compareNextCharWithSet:(NSString *)charset
{
  return [self hasRemaining] ? [self compareChar:[self peek] withSet:charset] : NO;
}

- (void)removeLeadingSP
{
  while ([self compareNextChar:' ']) {
    [self advance];
  }
}

- (void)removeLeadingOWS
{
  while ([self compareNextChar:' '] || [self compareNextChar:'\t']) {
    [self advance];
  }
}

- (BOOL)compareChar:(unichar)ch withSet:(NSString *)charset
{
  return [charset containsString:[NSString stringWithFormat:@"%c", ch]];
}

- (BOOL)isDigit:(unichar)ch
{
  return ch >= '0' && ch <= '9';
}

- (BOOL)isLowercaseAlpha:(unichar)ch
{
  return ch >= 'a' && ch <= 'z';
}

- (BOOL)isAlpha:(unichar)ch
{
  return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z');
}

- (BOOL)isBase64:(unichar)ch
{
  return (ch >= '0' && ch <= '9') || (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch == '+' || ch == '/' || ch == '=';
}

- (NSError *)errorWithMessage:(NSString *)message
{
  return [NSError errorWithDomain:EXStructuredHeadersParserErrorDomain code:1 userInfo:@{
    NSLocalizedDescriptionKey: message
  }];
}

@end

NS_ASSUME_NONNULL_END
