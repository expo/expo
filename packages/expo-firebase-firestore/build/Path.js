import invariant from 'invariant';
export default class Path {
    constructor(pathComponents) {
        this._parts = pathComponents;
    }
    get id() {
        return this._parts.length ? this._parts[this._parts.length - 1] : null;
    }
    get isDocument() {
        return this._parts.length % 2 === 0;
    }
    get isCollection() {
        return this._parts.length % 2 === 1;
    }
    get relativeName() {
        return this._parts.join('/');
    }
    child(relativePath) {
        invariant(relativePath, 'Firestore.Path.child: expected relativePath to be a valid string');
        return new Path(this._parts.concat(relativePath.split('/')));
    }
    parent() {
        return this._parts.length > 1 ? new Path(this._parts.slice(0, this._parts.length - 1)) : null;
    }
    /**
     *
     * @package
     */
    static fromName(name) {
        if (!name)
            return new Path([]);
        const parts = name.split('/');
        return new Path(parts);
    }
}
//# sourceMappingURL=Path.js.map