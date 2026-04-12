<% if (project.platforms.includes('web')) { -%>
import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './<%- project.name %>.types';

type <%- project.moduleName %>Events = {
  onChange: (params: ChangeEventPayload) => void;
}

class <%- project.moduleName %> extends NativeModule<<%- project.moduleName %>Events> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(<%- project.moduleName %>, '<%- project.moduleName %>');
<% } else { -%>
import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './<%- project.name %>.types';

type <%- project.moduleName %>Events = {
  onChange: (params: ChangeEventPayload) => void;
};

// <%- project.moduleName %> is not available on the web platform.
class <%- project.moduleName %> extends NativeModule<<%- project.moduleName %>Events> {}

export default registerWebModule(<%- project.moduleName %>, '<%- project.moduleName %>');
<% } -%>
