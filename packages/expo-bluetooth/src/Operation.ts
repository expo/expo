import { createOperationId } from './operations';
import { CharacteristicProperty, UUID, OperationType, OperationId } from './Bluetooth.types';
import { DELIMINATOR } from './ExpoBluetooth';
import { BluetoothError } from './errors';

type PossibleOperation = OperationType | CharacteristicProperty;

export type OperationUUIDs = {
  peripheralUUID?: UUID;
  serviceUUID?: UUID;
  characteristicUUID?: UUID;
  descriptorUUID?: UUID;
};

export default class Operation {
  // Return a Operation from a operationId ex: read|some_peripheral_id|some_service_id
  static fromOperationId(operationId: OperationId): Operation {
    let components = operationId.split(DELIMINATOR);
    let type: PossibleOperation | undefined;
    if (
      Object.values(CharacteristicProperty).includes(components[0]) ||
      Object.values(OperationType).includes(components[0])
    ) {
      type = components.shift() as PossibleOperation;
    }
    const [peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID] = components;

    return new Operation(
      { peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID },
      type
    );
  }

  static generateOperationId(
    operationUUIDs: OperationUUIDs,
    type: PossibleOperation
  ): OperationId {
    const operation = new Operation(operationUUIDs, type);

    return operation.generateId();
  }
  
  peripheralUUID?: string;

  serviceUUID?: string;

  characteristicUUID?: string;

  descriptorUUID?: string;

  _type?: PossibleOperation;

  get type(): PossibleOperation | undefined {
    return this._type;
  }

  constructor(
    { peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID }: OperationUUIDs,
    type?: PossibleOperation
  ) {
    this.peripheralUUID = peripheralUUID;
    this.serviceUUID = serviceUUID;
    this.characteristicUUID = characteristicUUID;
    this.descriptorUUID = descriptorUUID;
    this._type = type;
  }

  getUUIDs(): OperationUUIDs {
    const { peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID } = this;

    return {
      peripheralUUID,
      serviceUUID,
      characteristicUUID,
      descriptorUUID,
    };
  }

  setType(type?: PossibleOperation) {
    this._type = type;
  }

  generateId(): OperationId {
    const { peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID } = this;

    if (this.type === undefined) {
      throw new BluetoothError({ code: 'ERR_BLE_ID_GEN', message: 'Operation.generateId(): type cannot be undefined' });
    }
    return createOperationId(
      { peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID },
      this.type
    );
  }
}
