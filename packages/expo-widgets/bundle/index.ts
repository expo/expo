import * as swiftUI from '@expo/ui/swift-ui';
import * as modifiers from '@expo/ui/swift-ui/modifiers';

import { installWidgetRuntime } from './runtime';

installWidgetRuntime(swiftUI, modifiers);
