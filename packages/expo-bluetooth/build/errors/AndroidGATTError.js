import BluetoothPlatformError from './BluetoothPlatformError';
import GATTStatusMessages from './GATTStatusMessages';
/**
 * An error that is thrown for GATT problems on Android.
 */
export default class AndroidGATTError extends BluetoothPlatformError {
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