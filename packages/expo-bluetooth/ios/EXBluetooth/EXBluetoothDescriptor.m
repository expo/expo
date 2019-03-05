// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXBluetooth/EXBluetoothDescriptor.h>
#import <EXBluetooth/EXBluetoothPeripheral.h>
#import <EXBluetooth/EXBluetoothCharacteristic.h>

@interface EXBluetoothDescriptor()
{
  EXBluetoothCharacteristic *_charactreistic;
}

@property (nonatomic, strong) CBDescriptor *descriptor;
@property (nonatomic, weak) EXBluetoothPeripheral *peripheral;

@end

@implementation EXBluetoothDescriptor

- (instancetype)initWithDescriptor:(CBDescriptor *)descriptor peripheral:(EXBluetoothPeripheral *)peripheral
{
  self = [super init];
  if (self) {
    _descriptor = descriptor;
    _peripheral = peripheral;
  }
  return self;
}

- (CBUUID *)UUID
{
  return _descriptor.UUID;
}

- (EXBluetoothCharacteristic *)characteristic
{
  if (!_charactreistic) {
    _charactreistic = [[EXBluetoothCharacteristic alloc] initWithCharacteristic:_descriptor.characteristic peripheral:_peripheral];
  }
  return _charactreistic;
}

- (id)value
{
  return _descriptor.value;
}

- (void)readValueForWithReadValueForDescriptorsCallback:(EXBluetoothPeripheralReadValueForDescriptors)onReadValueForDescriptors
{
  if (_peripheral) {
    [_peripheral readValueForDescriptor:self withReadValueForDescriptors:[onReadValueForDescriptors copy]];
  }
}

- (void)writeValue:(NSData *)data withWriteValueForDescriptorsCallback:(EXBluetoothPeripheralWriteValueForDescriptors)onWriteValueForDescriptors
{
  if (_peripheral) {
    [_peripheral writeValue:data forDescriptor:self withWriteValueForDescriptorsCallback:[onWriteValueForDescriptors copy]];
  }
}

- (NSDictionary *)getJSON
{
  return [EXBluetooth.class EXBluetoothDescriptorNativeToJSON:self];
}

@end
