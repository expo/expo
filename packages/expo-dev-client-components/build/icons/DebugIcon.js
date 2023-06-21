import * as React from 'react';
import { Image } from '../Image';
const icon = require('../../assets/debug-icon.png');
export function DebugIcon(props) {
    return React.createElement(Image, { source: icon, ...props });
}
//# sourceMappingURL=DebugIcon.js.map