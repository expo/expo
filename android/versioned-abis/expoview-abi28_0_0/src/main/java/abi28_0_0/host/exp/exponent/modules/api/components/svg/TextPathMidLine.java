package abi28_0_0.host.exp.exponent.modules.api.components.svg;

/*
    TODO suggest adding a compatibility mid-line rendering attribute to textPath,
    for a chrome/firefox/opera/safari compatible sharp text path rendering,
    which doesn't bend text smoothly along a right angle curve, (like Edge does)
    but keeps the mid-line orthogonal to the mid-point tangent at all times instead.
*/
enum TextPathMidLine {
    sharp,
    @SuppressWarnings("unused")smooth
}
