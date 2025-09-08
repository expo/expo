import { isValidElement } from 'react';
import { Group } from '../primitives';
export const Protected = Group;
export function isProtectedReactElement(child) {
    return Boolean(isValidElement(child) && child.type === Group && child.props && 'guard' in child.props);
}
//# sourceMappingURL=Protected.js.map