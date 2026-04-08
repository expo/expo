// Side effect file to load shared object support in worklets

import { installOnUIRuntime } from 'expo';

import { registerSharedObjectSerializer } from './index';

installOnUIRuntime();
registerSharedObjectSerializer();
