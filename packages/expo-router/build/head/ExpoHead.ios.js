"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Head = void 0;
const core_1 = require("@react-navigation/core");
const react_1 = __importDefault(require("react"));
const ExpoHeadModule_1 = require("./ExpoHeadModule");
const url_1 = require("./url");
const hooks_1 = require("../hooks");
function urlToId(url) {
    return url.replace(/[^a-zA-Z0-9]/g, '-');
}
function getLastSegment(path) {
    // Remove the extension
    const lastSegment = path.split('/').pop() ?? '';
    return lastSegment.replace(/\.[^/.]+$/, '').split('?')[0];
}
// TODO: Use Head Provider to collect all props so only one Head is rendered for a given route.
function useAddressableLink() {
    const pathname = (0, hooks_1.useUnstableGlobalHref)();
    const params = (0, hooks_1.useLocalSearchParams)();
    const url = (0, url_1.getStaticUrlFromExpoRouter)(pathname);
    return { url, pathname, params };
}
function useMetaChildren(children) {
    return react_1.default.useMemo(() => {
        const renderableChildren = [];
        const metaChildren = [];
        react_1.default.Children.forEach(children, (child) => {
            if (!react_1.default.isValidElement(child)) {
                return;
            }
            if (typeof child.type === 'string') {
                metaChildren.push(child);
            }
            else {
                renderableChildren.push(child);
            }
        });
        return { children: renderableChildren, metaChildren };
    }, [children]);
}
function serializedMetaChildren(meta) {
    const validMeta = meta.filter((child) => child.type === 'meta' || child.type === 'title');
    return validMeta.map((child) => {
        if (child.type === 'title') {
            return {
                type: 'title',
                props: {
                    children: typeof child.props.children === 'string' ? child.props.children : undefined,
                },
            };
        }
        return {
            type: 'meta',
            props: {
                property: typeof child.props.property === 'string' ? child.props.property : undefined,
                content: typeof child.props.content === 'string' ? child.props.content : undefined,
            },
        };
    });
}
function useActivityFromMetaChildren(meta) {
    const { url: href, pathname } = useAddressableLink();
    const previousMeta = react_1.default.useRef([]);
    const cachedActivity = react_1.default.useRef({});
    const sortedMeta = react_1.default.useMemo(() => serializedMetaChildren(meta), [meta]);
    const url = react_1.default.useMemo(() => {
        const urlMeta = sortedMeta.find((child) => child.type === 'meta' && child.props.property === 'og:url');
        if (urlMeta) {
            // Support =`/foo/bar` -> `https://example.com/foo/bar`
            if (urlMeta.props.content?.startsWith('/')) {
                return (0, url_1.getStaticUrlFromExpoRouter)(urlMeta.props.content);
            }
            return urlMeta.props.content;
        }
        return href;
    }, [sortedMeta, href]);
    const title = react_1.default.useMemo(() => {
        const titleTag = sortedMeta.find((child) => child.type === 'title');
        if (titleTag) {
            return titleTag.props.children ?? '';
        }
        const titleMeta = sortedMeta.find((child) => child.type === 'meta' && child.props.property === 'og:title');
        if (titleMeta) {
            return titleMeta.props.content ?? '';
        }
        return getLastSegment(pathname);
    }, [sortedMeta, pathname]);
    const activity = react_1.default.useMemo(() => {
        if (!!previousMeta.current &&
            !!cachedActivity.current &&
            deepObjectCompare(previousMeta.current, sortedMeta)) {
            return cachedActivity.current;
        }
        previousMeta.current = sortedMeta;
        const userActivity = {};
        sortedMeta.forEach((child) => {
            if (
            // <meta />
            child.type === 'meta') {
                const { property, content } = child.props;
                switch (property) {
                    case 'og:description':
                        userActivity.description = content;
                        break;
                    // Custom properties
                    case 'expo:handoff':
                        userActivity.isEligibleForHandoff = isTruthy(content);
                        break;
                    case 'expo:spotlight':
                        userActivity.isEligibleForSearch = isTruthy(content);
                        break;
                }
                // // <meta name="keywords" content="foo,bar,baz" />
                // if (["keywords"].includes(name)) {
                //   userActivity.keywords = Array.isArray(content)
                //     ? content
                //     : content.split(",");
                // }
            }
        });
        cachedActivity.current = userActivity;
        return userActivity;
    }, [meta, pathname, href]);
    const parsedActivity = {
        keywords: [title],
        ...activity,
        title,
        webpageURL: url,
        activityType: ExpoHeadModule_1.ExpoHead.activities.INDEXED_ROUTE,
        userInfo: {
            // TODO: This may need to be  versioned in the future, e.g. `_v1` if we change the format.
            href,
        },
    };
    return parsedActivity;
}
function isTruthy(value) {
    return [true, 'true'].includes(value);
}
function HeadNative(props) {
    const isFocused = (0, core_1.useIsFocused)();
    if (!isFocused) {
        return react_1.default.createElement(UnfocusedHead, null);
    }
    return react_1.default.createElement(FocusedHead, { ...props });
}
function UnfocusedHead(props) {
    const { children } = useMetaChildren(props.children);
    return react_1.default.createElement(react_1.default.Fragment, null, children);
}
function FocusedHead(props) {
    const { metaChildren, children } = useMetaChildren(props.children);
    const activity = useActivityFromMetaChildren(metaChildren);
    useRegisterCurrentActivity(activity);
    return react_1.default.createElement(react_1.default.Fragment, null, children);
}
// segments => activity
const activities = new Map();
function useRegisterCurrentActivity(activity) {
    // ID is tied to Expo Router and agnostic of URLs to ensure dynamic parameters are not considered.
    // Using all segments ensures that cascading routes are considered.
    const activityId = urlToId((0, hooks_1.usePathname)() || '/');
    const cascadingId = urlToId((0, hooks_1.useSegments)().join('-') || '-');
    const activityIds = Array.from(activities.keys());
    const cascadingActivity = react_1.default.useMemo(() => {
        // Get all nested activities together, then update the id to match the current pathname.
        // This enables cases like `/user/[name]/post/[id]` to match all nesting, while still having a URL-specific ID, i.e. `/user/evanbacon/post/123`
        const cascadingActivity = activities.has(cascadingId)
            ? {
                ...activities.get(cascadingId),
                ...activity,
                id: activityId,
            }
            : {
                ...activity,
                id: activityId,
            };
        activities.set(cascadingId, cascadingActivity);
        return cascadingActivity;
    }, [cascadingId, activityId, activity, activityIds]);
    const previousActivity = react_1.default.useRef(null);
    react_1.default.useEffect(() => {
        if (!cascadingActivity) {
            return () => { };
        }
        if (!!previousActivity.current &&
            deepObjectCompare(previousActivity.current, cascadingActivity)) {
            return () => { };
        }
        previousActivity.current = cascadingActivity;
        if (!cascadingActivity.id) {
            throw new Error('Activity must have an ID');
        }
        // If no features are enabled, then skip registering the activity
        if (cascadingActivity.isEligibleForHandoff || cascadingActivity.isEligibleForSearch) {
            ExpoHeadModule_1.ExpoHead?.createActivity(cascadingActivity);
        }
        return () => { };
    }, [cascadingActivity]);
    react_1.default.useEffect(() => {
        return () => {
            if (activityId) {
                ExpoHeadModule_1.ExpoHead?.suspendActivity(activityId);
            }
        };
    }, [activityId]);
}
function deepObjectCompare(a, b) {
    if (typeof a !== typeof b) {
        return false;
    }
    if (typeof a === 'object') {
        if (Array.isArray(a) !== Array.isArray(b)) {
            return false;
        }
        if (Array.isArray(a)) {
            if (a.length !== b.length) {
                return false;
            }
            return a.every((item, index) => deepObjectCompare(item, b[index]));
        }
        // handle null
        if (a === null || b === null) {
            return a === b;
        }
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) {
            return false;
        }
        return aKeys.every((key) => deepObjectCompare(a[key], b[key]));
    }
    return a === b;
}
HeadNative.Provider = react_1.default.Fragment;
function HeadShim(props) {
    return null;
}
HeadShim.Provider = react_1.default.Fragment;
// Native Head is only enabled in bare iOS apps.
exports.Head = ExpoHeadModule_1.ExpoHead ? HeadNative : HeadShim;
//# sourceMappingURL=ExpoHead.ios.js.map