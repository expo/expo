import BluetoothPlatformError from './BluetoothPlatformError';
import GATTStatusCode from '../GATTStatusCode';
import GATTStatusMessages from '../GATTStatusMessages';

export default class AndroidGATTError extends BluetoothPlatformError {
  gattStatusCode: GATTStatusCode;

  constructor({
    gattStatusCode,
    ...props
  }: {
    invokedMethod?: string;
    gattStatusCode: any;
    stack?: string;
  }) {
    super({ ...props, code: 'ERR_BLE_GATT_ERROR' });
    this.gattStatusCode = gattStatusCode;
    this.message = GATTStatusMessages[gattStatusCode];
  }

  toJSON(): { [key: string]: any } {
    const json = super.toJSON();
    return {
      ...json,
      gattStatusCode: this.gattStatusCode,
    };
  }
}
