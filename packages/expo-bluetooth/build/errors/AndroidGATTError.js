import BluetoothPlatformError from './BluetoothError';
import GATTStatusMessages from '../GATTStatusMessages';
export class AndroidGATTError extends BluetoothPlatformError {
    constructor({ gattStatusCode, ...props }) {
        super({ ...props, code: 'ERR_BLE_GATT_ERROR' });
        this.gattStatusCode = gattStatusCode;
        this.message = GATTStatusMessages[gattStatusCode];
    }
    toJSON() {
        const json = super.toJSON();
        return {
            ...json,
            gattStatusCode: this.gattStatusCode,
        };
    }
}
//# sourceMappingURL=AndroidGATTError.js.map