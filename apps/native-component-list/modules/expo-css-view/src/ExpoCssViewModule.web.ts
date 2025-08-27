import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ExpoCssView.types';

type ExpoCssViewModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ExpoCssViewModule extends NativeModule<ExpoCssViewModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ExpoCssViewModule, 'ExpoCssViewModule');
