"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classNames = classNames;
function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}
