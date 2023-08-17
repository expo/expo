// no relative imports
import { ctx } from '../_ctx';
import { getServerManifest } from './getMatchableManifest';
import { getRoutes } from './getRoutes';
export async function createRoutesManifest() {
    const routeTree = getRoutes(ctx, {
        preserveApiRoutes: true,
        ignoreRequireErrors: true,
    });
    if (!routeTree) {
        return null;
    }
    return getServerManifest(routeTree);
}
//# sourceMappingURL=routes-manifest.js.map