import * as React from 'react';
import { Image } from '../Image';
const icon = require('../../assets/user-icon.png');
export function UserIcon(props) {
    return React.createElement(Image, { source: icon, ...props });
}
//# sourceMappingURL=UserIcon.js.map