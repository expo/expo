export default class ReferenceBase {
    path: string;
    constructor(path: string);
    /**
     * The last part of a Reference's path (after the last '/')
     * The key of a root Reference is null.
     * @type {String}
     * {@link https://firebase.google.com/docs/reference/js/firebase.database.Reference#key}
     */
    readonly key: string | null;
}
