// no relative imports
import { ctx } from '../_ctx';
// import { ctx } from "expo-router/_entry-ctx-lazy";
import { getMatchableRouteConfigs } from './fork/getStateFromPath';
import { getReactNavigationConfig } from './getReactNavigationConfig';
import { getRoutes } from './getRoutes';
import { loadStaticParamsAsync } from './loadStaticParamsAsync';
import { matchGroupName } from './matchers';
export async function createRoutesManifest() {
    let routeTree = getRoutes(ctx, {
        preserveApiRoutes: true,
        ignoreRequireErrors: true,
    });
    if (!routeTree) {
        return null;
    }
    routeTree = await loadStaticParamsAsync(routeTree);
    const config = getReactNavigationConfig(routeTree, false);
    const { configs } = getMatchableRouteConfigs(config);
    const manifest = configs.map((config) => {
        const isApi = config._route.contextKey?.match(/\+api\.[tj]sx?/);
        const src = config._route.contextKey.replace(/\.[tj]sx?$/, '.js').replace(/^\.\//, '');
        return {
            dynamic: config._route.dynamic,
            generated: config._route.generated,
            type: isApi ? 'dynamic' : 'static',
            file: config._route.contextKey,
            regex: config.regex?.source ?? /^\/$/.source,
            src: isApi ? './_expo/functions/' + src : './' + src,
        };
    });
    return {
        functions: manifest.filter((v) => v.type === 'dynamic'),
        staticHtml: manifest.filter((v) => v.type === 'static'),
        staticHtmlPaths: [...getStaticFiles(config)],
    };
}
function getStaticFiles(manifest) {
    const files = new Set();
    const sanitizeName = (segment) => {
        // Strip group names from the segment
        return segment
            .split('/')
            .map((s) => {
            const d = s.match(/^:(.*)/);
            // if (d) s = ''
            if (d)
                s = `[${d[1]}]`;
            s = matchGroupName(s) ? '' : s;
            return s;
        })
            .filter(Boolean)
            .join('/');
    };
    const nameWithoutGroups = (segment) => {
        // Strip group names from the segment
        return segment
            .split('/')
            .map((s) => (matchGroupName(s) ? '' : s))
            .filter(Boolean)
            .join('/');
    };
    const fetchScreens = (screens, additionPath = '') => {
        function fetchScreenExact(pathname, filename) {
            const outputPath = [additionPath, filename].filter(Boolean).join('/').replace(/^\//, '');
            // TODO: Ensure no duplicates in the manifest.
            if (!files.has(outputPath)) {
                files.add(outputPath);
            }
        }
        function fetchScreen({ segment, filename }) {
            // Strip group names from the segment
            const cleanSegment = sanitizeName(segment);
            if (nameWithoutGroups(segment) !== segment) {
                // has groups, should request multiple screens.
                fetchScreenExact([additionPath, segment].filter(Boolean).join('/'), filename);
            }
            fetchScreenExact([additionPath, cleanSegment].filter(Boolean).join('/'), sanitizeName(filename));
        }
        return Object.entries(screens)
            .map(([name, segment]) => {
            const filename = name;
            // Segment is a directory.
            if (typeof segment !== 'string') {
                if (Object.keys(segment.screens).length) {
                    const cleanSegment = sanitizeName(segment.path);
                    return fetchScreens(segment.screens, [additionPath, cleanSegment].filter(Boolean).join('/'));
                }
                else {
                    // skip when extranrous `screens` object exists
                    segment = segment.path;
                }
            }
            // TODO: handle dynamic routes
            // if (!segment.startsWith('*')) {
            fetchScreen({ segment, filename });
            // }
            return null;
        })
            .filter(Boolean);
    };
    fetchScreens(manifest.screens);
    return files;
}
//# sourceMappingURL=routes-manifest.js.map