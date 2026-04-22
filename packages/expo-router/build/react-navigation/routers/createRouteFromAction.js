import { nanoid } from 'nanoid/non-secure';
import { createParamsFromAction } from './createParamsFromAction';
export function createRouteFromAction({ action, routeParamList }) {
    const { name } = action.payload;
    return {
        key: `${name}-${nanoid()}`,
        name,
        params: createParamsFromAction({ action, routeParamList }),
    };
}
//# sourceMappingURL=createRouteFromAction.js.map