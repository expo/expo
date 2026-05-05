"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushName = pushName;
exports.pushProperty = pushProperty;
exports.pushLink = pushLink;
function pushName(tags, key, value) {
    pushMetaContent(tags, 'name', key, value);
}
function pushProperty(tags, key, value) {
    pushMetaContent(tags, 'property', key, value);
}
function pushLink(tags, attributes) {
    const normalizedAttributes = Object.fromEntries(Object.entries(attributes).filter(([, value]) => value != null && value !== ''));
    if (Object.keys(normalizedAttributes).length === 0) {
        return;
    }
    tags.push({
        tagName: 'link',
        attributes: normalizedAttributes,
    });
}
function pushMetaContent(tags, name, key, value) {
    if (!value)
        return;
    tags.push({
        tagName: 'meta',
        attributes: {
            [name]: key,
            content: value,
        },
    });
}
//# sourceMappingURL=tag.js.map