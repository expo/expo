//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesSignatureHeaderInfo.h>
#import <EXStructuredHeaders/EXStructuredHeadersParser.h>

@interface EXUpdatesSignatureHeaderInfo (Private)

- (instancetype)initWithSignature:(NSString *)signature
                            keyId:(NSString *)keyId
                        algorithm:(EXUpdatesCodeSigningAlgorithm)algorithm;

@end

@implementation EXUpdatesSignatureHeaderInfo

- (instancetype)initWithSignature:(NSString *)signature keyId:(NSString *)keyId algorithm:(EXUpdatesCodeSigningAlgorithm)algorithm {
  if (self = [super init]) {
    _signature = signature;
    _keyId = keyId;
    _algorithm = algorithm;
  }
  return self;
}

+ (instancetype)parseSignatureHeader:(NSString *)signatureHeader {
  if (!signatureHeader) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"No expo-signature header specified" userInfo:nil];
  }
  
  EXStructuredHeadersParser *parser = [[EXStructuredHeadersParser alloc] initWithRawInput:signatureHeader
                                                                                fieldType:EXStructuredHeadersParserFieldTypeDictionary
                                                                       ignoringParameters:YES];
  
  NSError *error;
  NSDictionary *parserOutput = [parser parseStructuredFieldsWithError:&error];
  if (!parserOutput || error || ![parserOutput isKindOfClass:[NSDictionary class]]) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:[NSString stringWithFormat:@"Error parsing expo-signature header value: %@", error ? error.localizedDescription : @"Header was not a structured fields dictionary"]
                                 userInfo:nil];
  }
  
  id sigFieldValue = parserOutput[EXUpdatesCodeSigningSignatureStructuredFieldKeySignature];
  id keyIdFieldValue = parserOutput[EXUpdatesCodeSigningSignatureStructuredFieldKeyKeyId];
  id algFieldValue = parserOutput[EXUpdatesCodeSigningSignatureStructuredFieldKeyAlgorithm];
  
  if (!sigFieldValue || ![sigFieldValue isKindOfClass:[NSString class]]) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:[NSString stringWithFormat:@"Structured field %@ not found in expo-signature header", EXUpdatesCodeSigningSignatureStructuredFieldKeySignature]
                                 userInfo:nil];
  }
  NSString *signature = sigFieldValue;
  NSString *keyId = (keyIdFieldValue && [keyIdFieldValue isKindOfClass:[NSString class]]) ? keyIdFieldValue : EXUpdatesCodeSigningMetadataDefaultKeyId;
  NSString *algorithm = (algFieldValue && [algFieldValue isKindOfClass:[NSString class]]) ? algFieldValue : nil;
  
  
  return [[self alloc] initWithSignature:signature
                                   keyId:keyId
                               algorithm:[EXUpdatesSignatureHeaderInfo codeSigningAlgorithmFromRawString:algorithm]];
}

+ (EXUpdatesCodeSigningAlgorithm)codeSigningAlgorithmFromRawString:(NSString *)rawString {
  if (!rawString || [rawString isEqualToString:@"rsa-v1_5-sha256"]) {
    return EXUpdatesCodeSigningAlgorithmRSA_SHA256;
  }
  
  @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                 reason:[NSString stringWithFormat:@"Invalid code signing algorithm name: %@", rawString]
                               userInfo:nil];
}

@end
