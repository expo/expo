import fetch from 'node-fetch';
export async function queryAllInspectorAppsAsync(metroServerOrigin) {
    const resp = await fetch(`${metroServerOrigin}/json/list`);
    // The newest runtime will be at the end of the list,
    // reversing the result would save time from try-error.
    return (await resp.json()).reverse().filter(pageIsSupported);
}
function pageIsSupported(app) {
    const capabilities = app.reactNative?.capabilities ?? {};
    return 'nativePageReloads' in capabilities && capabilities.nativePageReloads === true;
}
//# sourceMappingURL=CliJSInspector.js.map