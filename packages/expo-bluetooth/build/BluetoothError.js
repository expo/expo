import { CodedError } from 'expo-errors';
const service = 'expo-bluetooth';
export default class BluetoothError extends CodedError {
    log() {
        console.log(JSON.stringify(this.toJSON(), null, 2));
    }
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            stack: this.stack,
        };
    }
    constructor({ name, message, stack, code }) {
        super(code || 'ERR_BLE_UNKNOWN', `${service} : ${message}`);
        this.name = name;
        if (stack) {
            // Just use the first few lines
            this.stack = stack
                .split('\n')
                .slice(0, 8)
                .join('\n');
        }
    }
}
export class BluetoothPlatformError extends BluetoothError {
    constructor({ name, message, stack, code, invokedMethod }) {
        super({ name, code, message, stack });
        this.invokedMethod = invokedMethod;
    }
    toJSON() {
        const json = super.toJSON();
        return {
            ...json,
            invokedMethod: this.invokedMethod,
        };
    }
}
export class AndroidGATTError extends BluetoothError {
    constructor({ statusCode, name, message, stack, code }) {
        super({ name, message, stack, code });
        this.statusCode = statusCode;
    }
}
//# sourceMappingURL=BluetoothError.js.map