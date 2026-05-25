"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWidgetDescriptionResourceName = exports.getWidgetDisplayNameResourceName = exports.getWidgetInfoResourceName = exports.getProviderClassName = void 0;
const toAndroidResourceName = (name) => {
    const resourceName = name
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[^A-Za-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase();
    return /^[a-z]/.test(resourceName) ? resourceName : `widget_${resourceName}`;
};
const getProviderClassName = (widget) => {
    return `${widget.name}Provider`;
};
exports.getProviderClassName = getProviderClassName;
const getWidgetInfoResourceName = (widget) => {
    return `${toAndroidResourceName(widget.name)}_info`;
};
exports.getWidgetInfoResourceName = getWidgetInfoResourceName;
const getWidgetDisplayNameResourceName = (widget) => {
    return `${toAndroidResourceName(widget.name)}_display_name`;
};
exports.getWidgetDisplayNameResourceName = getWidgetDisplayNameResourceName;
const getWidgetDescriptionResourceName = (widget) => {
    return `${toAndroidResourceName(widget.name)}_description`;
};
exports.getWidgetDescriptionResourceName = getWidgetDescriptionResourceName;
