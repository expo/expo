import { NativeModule, requireNativeModule } from 'expo';

import { <%- project.moduleName %>Events } from './<%- project.name %>.types';

declare class <%- project.moduleName %> extends NativeModule<<%- project.moduleName %>Events> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<<%- project.moduleName %>>('<%- project.name %>');
