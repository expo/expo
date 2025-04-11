import { registerWebModule, NativeModule } from 'expo';

import { <%- project.moduleName %>Events } from './<%- project.name %>.types';

class <%- project.moduleName %> extends NativeModule<<%- project.moduleName %>Events> {
  // @ts-ignore: Overrides the built-in `Function.name` property
  static name = '<%- project.moduleName %>';
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(<%- project.moduleName %>, '<%- project.moduleName %>');
