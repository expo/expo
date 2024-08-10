// Entry file for a DOM Component.
import '@expo/metro-runtime';

import { registerDOMComponent } from 'expo/dom/internal';

registerDOMComponent(() => import('[$$GENERATED_ENTRY]'), '[$$GENERATED_ENTRY]');
