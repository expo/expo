"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateValueStore = void 0;
class PrivateValueStore {
    /**
     * UGLY HACK! DO NOT USE THE TYPE!!!
     *
     * TypeScript requires a type to be used to be able to infer it.
     * The type should exist as its own without any operations such as union.
     * So we need to figure out a way to store this type in a property.
     * The problem with a normal property is that it shows up in intelliSense.
     * Adding private keyword works, but the annotation is stripped away in declaration.
     * Turns out if we use an empty string, it doesn't show up in intelliSense.
     */
    '';
}
exports.PrivateValueStore = PrivateValueStore;
//# sourceMappingURL=types.js.map