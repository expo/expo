import BluetoothError from './BluetoothError';

export default class BluetoothPlatformError extends BluetoothError {
  invokedMethod: string;

  constructor({ name, message, stack, code, invokedMethod }: { [key: string]: any }) {
    super({ name, code, message, stack });
    this.invokedMethod = invokedMethod;
  }

  toJSON(): { [key: string]: any } {
    const json = super.toJSON();

    return {
      ...json,
      invokedMethod: this.invokedMethod,
    };
  }
}
