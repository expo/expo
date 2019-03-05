// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXBluetooth/EXBluetooth+JSON.h>
#import <EXCore/EXUtilities.h>
#import <EXBluetooth/EXBluetoothConstants.h>

@implementation EXBluetooth (JSON)

+ (NSString *)CBPeripheralStateNativeToJSON:(CBPeripheralState)input
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

+ (NSMutableArray *)EXBluetoothServiceArray_NativeToJSON:(NSArray<EXBluetoothService *> *)input
{
  NSMutableArray *output = [NSMutableArray new];
  for (EXBluetoothService *value in input) {
    NSDictionary *serializedValue = [self.class EXBluetoothServiceNativeToJSON:value];
    [output addObject:EXNullIfNil(serializedValue)];
  }
  return output;
}

+ (NSMutableArray *)EXBluetoothCharacteristicArray_NativeToJSON:(NSArray<EXBluetoothCharacteristic *> *)input
{
  NSMutableArray *output = [NSMutableArray new];
  for (EXBluetoothCharacteristic *value in input) {
    NSDictionary *serializedValue = [self.class EXBluetoothCharacteristicNativeToJSON:value];
    [output addObject:EXNullIfNil(serializedValue)];
  }
  return output;
}

+ (NSMutableArray<NSString *> *)CBAttributePermissions_NativeToJSON:(CBAttributePermissions)input
{
  NSMutableArray *props = [NSMutableArray new];
  
  if ((input & CBAttributePermissionsReadable) != 0x0) {
    [props addObject:@"readable"];
  }
  if ((input & CBAttributePermissionsWriteable) != 0x0) {
    [props addObject:@"writeable"];
  }
  if ((input & CBAttributePermissionsReadEncryptionRequired) != 0x0) {
    [props addObject:@"readEncryptionRequired"];
  }
  if ((input & CBAttributePermissionsWriteEncryptionRequired) != 0x0) {
    [props addObject:@"writeEncryptionRequired"];
  }
  return props;
}

+ (NSMutableArray<NSString *> *)CBCharacteristicPropertiesNativeToJSON:(CBCharacteristicProperties)input
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

+ (CBCharacteristicProperties)CBCharacteristicPropertiesListJSONToNative:(NSArray<NSString *> *)input
{
  CBCharacteristicProperties characteristicProperties = 0;
  for (NSString *property in input) {
    characteristicProperties |= [self.class CBCharacteristicPropertiesJSONToNative:property];
  }
  return characteristicProperties;
}

+ (CBCharacteristicProperties)CBCharacteristicPropertiesJSONToNative:(NSString *)input
{
  if ([input isEqualToString:@"broadcast"]) {
    return CBCharacteristicPropertyBroadcast;
  } else if ([input isEqualToString:@"writeWithoutResponse"]) {
    return CBCharacteristicPropertyWriteWithoutResponse;
  } else if ([input isEqualToString:@"write"]) {
    return CBCharacteristicPropertyWrite;
  } else if ([input isEqualToString:@"notify"]) {
    return CBCharacteristicPropertyNotify;
  } else if ([input isEqualToString:@"indicate"]) {
    return CBCharacteristicPropertyIndicate;
  } else if ([input isEqualToString:@"autheticateSignedWrites"]) {
    return CBCharacteristicPropertyAuthenticatedSignedWrites;
  } else if ([input isEqualToString:@"extendedProperties"]) {
    return CBCharacteristicPropertyExtendedProperties;
  } else if ([input isEqualToString:@"notifyEncryptionRequired"]) {
    return CBCharacteristicPropertyNotifyEncryptionRequired;
  } else if ([input isEqualToString:@"indicateEncryptionRequired"]) {
    return CBCharacteristicPropertyIndicateEncryptionRequired;
  } else {
    return CBCharacteristicPropertyRead;
  }
}

+ (NSString *)CBManagerStateNativeToJSON:(CBManagerState)input
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
    case CBManagerStateUnknown:
    default:
      return @"unknown";
  }
}

+ (NSMutableArray *)EXBluetoothDescriptorList_NativeToJSON:(NSArray<EXBluetoothDescriptor *> *)input
{
  NSMutableArray *output = [NSMutableArray new];
  for (EXBluetoothDescriptor *value in input) {
    NSDictionary *serializedValue = [self.class EXBluetoothDescriptorNativeToJSON:value];
    [output addObject:EXNullIfNil(serializedValue)];
  }
  return output;
}

+ (NSMutableArray *)EXBluetoothPeripheralListNativeToJSON:(NSArray<EXBluetoothPeripheral *> *)input
{
  NSMutableArray *output = [NSMutableArray new];
  for (EXBluetoothPeripheral *value in input) {
    NSDictionary *serializedValue = [self.class EXBluetoothPeripheralNativeToJSON:value];
    [output addObject:EXNullIfNil(serializedValue)];
  }
  return output;
}

+ (nullable NSDictionary *)NSErrorNativeToJSON:(NSError *)input
{
  if (!input) return nil;
  
  NSDictionary *userInfo = input.userInfo;
  NSString *underlyingError = [[userInfo objectForKey:NSUnderlyingErrorKey] localizedDescription];
  NSString *errorCode = [NSString stringWithFormat:@"%ld", (long) input.code];
  
  return @{
           @"code": errorCode,
           @"domain": input.domain,
           @"message": EXNullIfEmpty(input.localizedDescription),
           @"reason": EXNullIfEmpty(input.localizedFailureReason),
           @"suggestion": EXNullIfEmpty(input.localizedRecoverySuggestion),
           @"underlayingError": EXNullIfEmpty(underlyingError),
           @"type": @"error",
           @"_nativeClass": NSStringFromClass(input.class)
           };
}

+ (NSDictionary *)advertisementDataNativeToJSON:(NSDictionary<NSString *,id> *)input
{
  NSString *localNameKey = input[CBAdvertisementDataLocalNameKey];
  NSNumber *txPowerLevel = input[CBAdvertisementDataTxPowerLevelKey];
  NSNumber *isConnectable = input[CBAdvertisementDataIsConnectable];
  
  NSData *manufacturerData = input[CBAdvertisementDataManufacturerDataKey];
  NSString *manufacturerDataValue = @"";
  if (input[CBAdvertisementDataManufacturerDataKey] != nil) {
    manufacturerDataValue = [NSString stringWithFormat:@"%lu bytes",(unsigned long)manufacturerData.length];
  }
  
  NSDictionary *serviceData = [self.class serviceData_NativeToJSON:input[CBAdvertisementDataServiceDataKey]];
  
  NSArray *serviceUUIDs = [self.class CBUUIDList_NativeToJSON:input[CBAdvertisementDataServiceUUIDsKey]];
  NSArray *overflowServiceUUIDs = [self.class CBUUIDList_NativeToJSON:input[CBAdvertisementDataOverflowServiceUUIDsKey]];
  NSArray *solicitedServiceUUIDs = [self.class CBUUIDList_NativeToJSON:input[CBAdvertisementDataSolicitedServiceUUIDsKey]];
  
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

+ (nullable NSString *)CBUUID_NativeToJSON:(CBUUID *)input
{
  if (!input) return nil;
  // TODO: Bacon: Maybe we should return all of the data??
  return [input UUIDString];
}

+ (nullable NSMutableArray<NSString *> *)CBUUIDList_NativeToJSON:(NSArray<CBUUID *> *)input
{
  if (!input) return nil;
  
  NSMutableArray *output = [NSMutableArray new];
  for (CBUUID *value in input) {
    NSString *serializedValue = [self.class CBUUID_NativeToJSON:value];
    [output addObject:EXNullIfEmpty(serializedValue)];
  }
  return output;
}

+ (nullable NSMutableArray<CBUUID *> *)CBUUIDListJSONToNative:(NSArray *)input
{
  if (!input) return nil;
  
  NSMutableArray *output = [NSMutableArray new];
  for (id value in input) {
    if ([value isKindOfClass:NSString.class]) {
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

+ (nullable NSDictionary *)serviceData_NativeToJSON:(NSDictionary<CBUUID *, NSData *> *)input
{
  if (!input) return nil;
  
  NSMutableDictionary *output = [NSMutableDictionary new];
  for (CBUUID *key in input.allKeys) {
    NSData *value = [input objectForKey:key];
    [output setObject:EXNullIfEmpty([self.class NSData_NativeToJSON:value]) forKey:key.UUIDString];
  }
  return output;
}

+ (NSDictionary *)ScanningOptionsJSONToNative:(nullable NSDictionary *)input
{
  if (!input) return @{};
  NSMutableDictionary *output = [NSMutableDictionary new];
  
  if (input[@"iosAllowDuplicates"] && [input[@"iosAllowDuplicates"] boolValue]) {
    output[CBCentralManagerScanOptionAllowDuplicatesKey] = input[@"iosAllowDuplicates"];
  }
  
  if (input[@"iosSolicitedServiceUUIDs"] && [input[@"iosSolicitedServiceUUIDs"] isKindOfClass:NSArray.class]) {
    NSArray *solicitedServiceUUIDs = (NSArray *)input[@"iosSolicitedServiceUUIDs"];
    output[CBCentralManagerScanOptionSolicitedServiceUUIDsKey] = solicitedServiceUUIDs;
  }
  
  return output;
  
}

+ (nullable NSDictionary *)EXBluetoothDescriptorNativeToJSON:(EXBluetoothDescriptor *)input
{
  if (!input) return nil;
  
  NSString *descriptorUUIDString = input.UUID.UUIDString;
  NSString *characteristicUUIDString = input.characteristic.UUID.UUIDString;
  NSString *serviceUUIDString = input.characteristic.service.UUID.UUIDString;
  NSString *peripheralUUIDString = input.characteristic.service.peripheral.identifier.UUIDString;
  
  id outputData;
  NSString *parsedValue;
  if([descriptorUUIDString isEqualToString:CBUUIDCharacteristicExtendedPropertiesString]  ||
     [descriptorUUIDString isEqualToString:CBUUIDClientCharacteristicConfigurationString] ||
     [descriptorUUIDString isEqualToString:CBUUIDServerCharacteristicConfigurationString]) {
    outputData = EXNullIfNil(input.value);
    if (input.value != nil) {
      parsedValue = [outputData stringValue];
    }
  } else if ([descriptorUUIDString isEqualToString:CBUUIDCharacteristicUserDescriptionString]) {
    outputData = EXNullIfNil(input.value);
    parsedValue = input.value;
  } else if ([descriptorUUIDString isEqualToString:CBUUIDCharacteristicFormatString] ||
             [descriptorUUIDString isEqualToString:CBUUIDCharacteristicAggregateFormatString]) {
    outputData = EXNullIfEmpty([self.class NSData_NativeToJSON:input.value]);
    // Bacon: Because we know the format upfront, we should parse it here - the format could be different on Android.
    parsedValue = [[NSString alloc] initWithData:input.value encoding:NSUTF8StringEncoding];
  }
  
  return @{
           @"id": [NSString stringWithFormat:@"%@|%@|%@|%@", peripheralUUIDString, serviceUUIDString, characteristicUUIDString, descriptorUUIDString],
           @"uuid": descriptorUUIDString,
           @"characteristicUUID": characteristicUUIDString,
           @"value": outputData,
           @"parsedValue": EXNullIfEmpty(parsedValue),
           @"type": @"descriptor",
           @"_nativeClass": NSStringFromClass(input.class)
           };
}
// TODO: Bacon: Investigate CBCharacteristic for read/write, permissions
+ (nullable NSDictionary *)EXBluetoothCharacteristicNativeToJSON:(EXBluetoothCharacteristic *)input
{
  if (!input) return nil;
  
  NSString *characteristicUUIDString = input.UUID.UUIDString;
  NSString *serviceUUIDString = input.service.UUID.UUIDString;
  NSString *peripheralUUIDString = input.service.peripheral.identifier.UUIDString;
  
  return @{
           @"id": [NSString stringWithFormat:@"%@|%@|%@", peripheralUUIDString, serviceUUIDString, characteristicUUIDString],
           @"uuid": characteristicUUIDString,
           @"serviceUUID": serviceUUIDString,
           @"peripheralUUID": peripheralUUIDString,
           @"properties": [EXBluetooth.class CBCharacteristicPropertiesNativeToJSON:input.properties],
           @"value": EXNullIfEmpty([EXBluetooth.class NSData_NativeToJSON:input.value]), //TODO: Bacon: Find out what this is. (NSData)
           @"descriptors": [EXBluetooth.class EXBluetoothDescriptorList_NativeToJSON:input.descriptors],
           @"isNotifying": @(input.isNotifying),
           @"type": @"characteristic",
           @"_nativeClass": NSStringFromClass(input.class)
           };
}

+ (nullable NSDictionary *)EXBluetoothServiceNativeToJSON:(EXBluetoothService *)input
{
  if (!input) return nil;
  
  NSString *serviceUUIDString = input.UUID.UUIDString;
  NSString *peripheralUUIDString = input.peripheral.identifier.UUIDString;
  return @{
           @"id": [NSString stringWithFormat:@"%@|%@", peripheralUUIDString, serviceUUIDString],
           @"uuid": serviceUUIDString,
           @"peripheralUUID": peripheralUUIDString,
           @"isPrimary": @(input.isPrimary),
           @"includedServices": [self.class EXBluetoothServiceArray_NativeToJSON:input.includedServices],
           @"characteristics": [self.class EXBluetoothCharacteristicArray_NativeToJSON:input.characteristics],
           @"type": @"service",
           @"_nativeClass": NSStringFromClass(input.class)
           };
}

+ (nullable NSDictionary *)EXBluetoothPeripheralNativeToJSON:(EXBluetoothPeripheral *)input
{
  if (!input) return nil;
  
  return @{
           EXBluetoothRSSIKey: EXNullIfNil(input.RSSI),
           @"id": input.identifier.UUIDString,
           @"uuid": input.identifier.UUIDString,
           @"name": EXNullIfEmpty(input.name),
           @"state": [EXBluetooth.class CBPeripheralStateNativeToJSON:input.state],
           @"services": [EXBluetooth.class EXBluetoothServiceArray_NativeToJSON:input.services],
           @"canSendWriteWithoutResponse": @(input.canSendWriteWithoutResponse),
           @"advertisementData": EXNullIfNil([EXBluetooth.class advertisementDataNativeToJSON:input.advertisementData]),
           @"type": @"peripheral",
           @"_nativeClass": NSStringFromClass(input.class)
           };
}

+ (nullable NSDictionary *)EXBluetoothCentralManagerNativeToJSON:(EXBluetoothCentralManager *)input
{
  if (!input) return nil;
  
  return @{
           @"state": [self.class CBManagerStateNativeToJSON:input.state],
           @"isScanning": @(input.isScanning),
           @"type": @"central",
           @"_nativeClass": NSStringFromClass(input.class)
           };
}

+ (nullable NSString *)NSData_NativeToJSON:(NSData *)input
{
  if (!input) return nil;
  return [input base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength];
}

+ (nullable NSDictionary *)CBPeer_NativeToJSON:(CBPeer *)input
{
  if (!input) return nil;
  
  return @{
           @"uuid": input.identifier.UUIDString,
           @"type": @"peer",
           @"_nativeClass": NSStringFromClass(input.class)
           };
}

+ (nullable NSDictionary *)CBL2CAPChannelNativeToJSON:(CBL2CAPChannel *)input
API_AVAILABLE(ios(11.0)) {
  if (!input) return nil;
  
  // TODO: Bacon: Input/Output streams
  return @{
           @"peer": [self.class CBPeer_NativeToJSON:input.peer],
           @"PSM": [NSNumber numberWithUnsignedInteger:input.PSM],
           @"type": @"L2CAPChannel",
           @"_nativeClass": NSStringFromClass(input.class)
           };
}


@end
