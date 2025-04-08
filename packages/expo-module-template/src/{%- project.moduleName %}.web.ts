import { registerWebModule, NativeModule } from 'expo';

import { <%- project.moduleName %>Events } from './<%- project.name %>.types';

class <%- project.moduleName %> extends NativeModule<<%- project.moduleName %>Events> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(<%- project.moduleName %>, '<%- project.moduleName %>');
