import { createTransactionId } from './transactions';
import { CharacteristicProperty, UUID, TransactionType, TransactionId } from './Bluetooth.types';
import { DELIMINATOR } from './ExpoBluetooth';

type PossibleTransaction = TransactionType | CharacteristicProperty;

export type TransactionUUIDs = {
  peripheralUUID?: UUID;
  serviceUUID?: UUID;
  characteristicUUID?: UUID;
  descriptorUUID?: UUID;
};

export default class Transaction {
  // Return a Transaction from a transactionId ex: read|some_peripheral_id|some_service_id
  static fromTransactionId(transactionId: TransactionId): Transaction {
    let components = transactionId.split(DELIMINATOR);
    let type: PossibleTransaction | undefined;
    if (
      Object.values(CharacteristicProperty).includes(components[0]) ||
      Object.values(TransactionType).includes(components[0])
    ) {
      type = components.shift() as PossibleTransaction;
    }
    const [peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID] = components;

    return new Transaction(
      { peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID },
      type
    );
  }

  static generateTransactionId(
    transactionUUIDs: TransactionUUIDs,
    type: PossibleTransaction
  ): TransactionId {
    const transaction = new Transaction(transactionUUIDs, type);

    return transaction.generateId();
  }
  peripheralUUID?: string;

  serviceUUID?: string;

  characteristicUUID?: string;

  descriptorUUID?: string;

  _type?: PossibleTransaction;

  get type(): PossibleTransaction | undefined {
    return this._type;
  }
  constructor(
    { peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID }: TransactionUUIDs,
    type?: PossibleTransaction
  ) {
    this.peripheralUUID = peripheralUUID;
    this.serviceUUID = serviceUUID;
    this.characteristicUUID = characteristicUUID;
    this.descriptorUUID = descriptorUUID;
    this._type = type;
  }

  getUUIDs(): TransactionUUIDs {
    const { peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID } = this;

    return {
      peripheralUUID,
      serviceUUID,
      characteristicUUID,
      descriptorUUID,
    };
  }

  setType(type?: PossibleTransaction) {
    this._type = type;
  }

  generateId(): TransactionId {
    const { peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID } = this;

    if (this.type === undefined) {
      throw new Error('expo-bluetooth: Transaction.generateId(): type cannot be undefined');
    }
    return createTransactionId(
      { peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID },
      this.type
    );
  }
}
