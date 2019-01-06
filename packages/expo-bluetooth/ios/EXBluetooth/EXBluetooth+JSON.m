// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXBluetooth/EXBluetooth+JSON.h>
#import <EXCore/EXUtilities.h>

@implementation EXBluetooth (JSON)

+ (NSString *)CBPeripheralState_NativeToJSON:(CBPeripheralState)input
{
  switch (input) {
    case CBPeripheralStateDisconnected:
      return @"disconnected";
    case CBPeripheralStateConnecting:
      return @"connecting";
    case CBPeripheralStateConnected:
      return @"connected";
    case CBPeripheralStateDisconnecting:
      return @"disconnecting";
    default:
      return @"unknown";
  }
}

+ (NSMutableArray *)CBServiceArray_NativeToJSON:(NSArray<CBService *> *)input
{
  NSMutableArray *output = [NSMutableArray new];
  for (CBService *value in input) {
    NSDictionary *serializedValue = [[self class] CBService_NativeToJSON:value];
    [output addObject:EXNullIfNil(serializedValue)];
  }
  return output;
}

+ (NSMutableArray *)CBCharacteristicArray_NativeToJSON:(NSArray<CBCharacteristic *> *)input
{
  NSMutableArray *output = [NSMutableArray new];
  for (CBCharacteristic *value in input) {
    NSDictionary *serializedValue = [[self class] CBCharacteristic_NativeToJSON:value];
    [output addObject:EXNullIfNil(serializedValue)];
  }
  return output;
}

+ (NSMutableArray<NSString *> *)CBCharacteristicProperties_NativeToJSON:(CBCharacteristicProperties)input
{
  NSMutableArray *props = [NSMutableArray new];
  
  if ((input & CBCharacteristicPropertyBroadcast) != 0x0) {
    [props addObject:@"broadcast"];
  }
  if ((input & CBCharacteristicPropertyRead) != 0x0) {
    [props addObject:@"read"];
  }
  if ((input & CBCharacteristicPropertyWriteWithoutResponse) != 0x0) {
    [props addObject:@"writeWithoutResponse"];
  }
  if ((input & CBCharacteristicPropertyWrite) != 0x0) {
    [props addObject:@"write"];
  }
  if ((input & CBCharacteristicPropertyNotify) != 0x0) {
    [props addObject:@"notify"];
  }
  if ((input & CBCharacteristicPropertyIndicate) != 0x0) {
    [props addObject:@"indicate"];
  }
  if ((input & CBCharacteristicPropertyAuthenticatedSignedWrites) != 0x0) {
    [props addObject:@"autheticateSignedWrites"];
  }
  if ((input & CBCharacteristicPropertyExtendedProperties) != 0x0) {
    [props addObject:@"extendedProperties"];
  }
  if ((input & CBCharacteristicPropertyNotifyEncryptionRequired) != 0x0) {
    [props addObject:@"notifyEncryptionRequired"];
  }
  if ((input & CBCharacteristicPropertyIndicateEncryptionRequired) != 0x0) {
    [props addObject:@"indicateEncryptionRequired"];
  }
  return props;
}

+ (NSString *)CBManagerState_NativeToJSON:(CBManagerState)input
{
  switch (input) {
    case CBManagerStateResetting:
    return @"resetting";
    case CBManagerStateUnsupported:
    return @"unsupported";
    case CBManagerStateUnauthorized:
    return @"unauthorized";
    case CBManagerStatePoweredOff:
    return @"poweredOff";
    case CBManagerStatePoweredOn:
    return @"poweredOn";
//    case CBManagerStateUnknown:
    default:
    return @"unknown";
  }
}

+ (NSMutableArray *)CBDescriptorList_NativeToJSON:(NSArray<CBDescriptor *> *)input
{
  NSMutableArray *output = [NSMutableArray new];
  for (CBDescriptor *value in input) {
    NSDictionary *serializedValue = [[self class] CBDescriptor_NativeToJSON:value];
    [output addObject:EXNullIfNil(serializedValue)];
  }
  return output;
}

+ (NSMutableArray *)CBPeripheralList_NativeToJSON:(NSArray<CBPeripheral *> *)input
{
  NSMutableArray *output = [NSMutableArray new];
  for (CBPeripheral *value in input) {
    NSDictionary *serializedValue = [[self class] CBPeripheral_NativeToJSON:value];
    [output addObject:EXNullIfNil(serializedValue)];
  }
  return output;
}

+ (NSDictionary *)NSError_NativeToJSON:(NSError *)input
{
  if (!input) return nil;
  
  NSDictionary *userInfo = [input userInfo];
  NSString *underlyingError = [[userInfo objectForKey:NSUnderlyingErrorKey] localizedDescription];
  NSString *errorCode = [NSString stringWithFormat:@"%ld", (long) input.code];
  return @{
           @"code": errorCode,
           @"description": EXNullIfEmpty(input.localizedDescription),
           @"reason": EXNullIfEmpty(input.localizedFailureReason),
           @"suggestion": EXNullIfEmpty(input.localizedRecoverySuggestion),
           @"underlayingError": EXNullIfEmpty(underlyingError)
           };
}

+ (NSDictionary *)advertisementData_NativeToJSON:(NSDictionary<NSString *,id> *)input
{
  NSString *localNameKey = input[CBAdvertisementDataLocalNameKey];
  NSNumber *txPowerLevel = input[CBAdvertisementDataTxPowerLevelKey];
  NSNumber *isConnectable = input[CBAdvertisementDataIsConnectable];
  
  NSData *manufacturerData = input[CBAdvertisementDataManufacturerDataKey];
  NSString *manufacturerDataValue = @"";
  if (input[CBAdvertisementDataManufacturerDataKey] != nil) {
    manufacturerDataValue = [NSString stringWithFormat:@"%lu bytes",(unsigned long)manufacturerData.length];
  }

  NSDictionary *serviceData = [[self class] serviceData_NativeToJSON:input[CBAdvertisementDataServiceDataKey]];
  
  NSArray *serviceUUIDs = [[self class] CBUUIDList_NativeToJSON:input[CBAdvertisementDataServiceUUIDsKey]];
  NSArray *overflowServiceUUIDs = [[self class] CBUUIDList_NativeToJSON:input[CBAdvertisementDataOverflowServiceUUIDsKey]];
  NSArray *solicitedServiceUUIDs = [[self class] CBUUIDList_NativeToJSON:input[CBAdvertisementDataSolicitedServiceUUIDsKey]];

  return @{
        @"localName": EXNullIfEmpty(localNameKey),
        @"txPowerLevel": EXNullIfNil(txPowerLevel),
        @"isConnectable": @([isConnectable boolValue]),
        @"manufacturerData": EXNullIfEmpty(manufacturerDataValue),
        @"serviceData": EXNullIfNil(serviceData),
        @"serviceUUIDs": EXNullIfNil(serviceUUIDs),
        @"overflowServiceUUIDs": EXNullIfNil(overflowServiceUUIDs),
        @"solicitedServiceUUIDs": EXNullIfNil(solicitedServiceUUIDs)
        };
}

+ (NSString *)CBUUID_NativeToJSON:(CBUUID *)input
{
  if (!input) return nil;
  // TODO: Bacon: Maybe we should return all of the data??
  return [input UUIDString];
}


+ (NSMutableArray<NSString *> *)CBUUIDList_NativeToJSON:(NSArray<CBUUID *> *)input
{
  if (!input) return nil;
  
  NSMutableArray *output = [NSMutableArray new];
  for (CBUUID *value in input) {
    NSString *serializedValue = [[self class] CBUUID_NativeToJSON:value];
    [output addObject:EXNullIfEmpty(serializedValue)];
  }
  return output;
}

+ (NSMutableArray<CBUUID *> *)CBUUIDList_JSONToNative:(NSArray *)input
{
  if (!input) return nil;
  
  NSMutableArray *output = [NSMutableArray new];
  for (id value in input) {
    if ([value isKindOfClass:[NSString class]]) {
      // TODO: Bacon: Maybe add support for generating CBUUID from Data (ArrayBuffer)
      CBUUID *uuid = [CBUUID UUIDWithString:(NSString *)value];
      [output addObject:uuid];
    }
  }
  // nil makes searches default to "search for everything"
  if (output.count == 0) {
    return nil;
  }
  return output;
}


+ (NSDictionary *)serviceData_NativeToJSON:(NSDictionary<CBUUID *, NSData *> *)input
{
  if (!input) return nil;
  
  NSMutableDictionary *output = [NSMutableDictionary new];
  for (CBUUID *key in [input allKeys]) {
    NSData *value = [input objectForKey:key];
    [output setObject:[[self class] NSData_NativeToJSON:value] forKey:[key UUIDString]];
  }
  return output;
}

+ (NSDictionary *)CBDescriptor_NativeToJSON:(CBDescriptor *)input
{
  if (!input) return nil;
  
  return @{
           @"uuid": [[input UUID] UUIDString],
           @"characteristic": [[[input characteristic] UUID] UUIDString],
//           @"value": [input value] // TODO: Bacon: Find out what this is. (id)
           };
}
  
+ (NSDictionary *)CBCharacteristic_NativeToJSON:(CBCharacteristic *)input
{
  if (!input) return nil;

  return @{
           @"uuid": [[input UUID] UUIDString],
           @"service": [[[input service] UUID] UUIDString],
           @"properties": [[self class] CBCharacteristicProperties_NativeToJSON:[input properties]],
//           @"value": EXNullIfNil([input value]), //TODO: Bacon: Find out what this is. (NSData)
           @"descriptors": EXNullIfNil([[self class] CBDescriptorList_NativeToJSON:[input descriptors]]),
           @"isNotifying": @([input isNotifying])
//           @"isBroadcasted": @([input isBroadcasted])
           };
}

+ (NSDictionary *)CBService_NativeToJSON:(CBService *)input
{
  if (!input) return nil;
  
  return @{
           @"uuid": [[input UUID] UUIDString],
           @"peripheral": [[input peripheral] identifier],
           @"isPrimary": @([input isPrimary]),
           @"includedServices": [[self class] CBServiceArray_NativeToJSON:[input includedServices]],
           @"characteristics": [[self class] CBCharacteristicArray_NativeToJSON:[input characteristics]]
           };
}

+ (NSDictionary *)CBPeripheral_NativeToJSON:(CBPeripheral *)input
{
  if (!input) return nil;

  return @{
           @"id": [[input identifier] UUIDString],
           @"name": EXNullIfEmpty([input name]),
           @"RSSI": EXNullIfNil([input RSSI]),
           @"state": EXNullIfNil([[self class] CBPeripheralState_NativeToJSON:[input state]]),
           @"services": [[self class] CBServiceArray_NativeToJSON:[input services]],
           @"canSendWriteWithoutResponse": @([input canSendWriteWithoutResponse])
           };
}

+ (NSDictionary *)CBCentralManager_NativeToJSON:(CBCentralManager *)input
{
  if (!input) return nil;

  return @{
           @"state": [[self class] CBManagerState_NativeToJSON:[input state]],
           @"isScanning": @([input isScanning])
           };
}

+ (NSDictionary *)NSData_NativeToJSON:(NSData *)input
{
  return @{
           @"data": [input base64EncodedStringWithOptions:0],
           @"type": @"ArrayBuffer"
           };
}


@end
