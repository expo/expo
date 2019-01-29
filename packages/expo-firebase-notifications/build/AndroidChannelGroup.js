import invariant from 'invariant';
export default class AndroidChannelGroup {
    constructor(groupId, name) {
        this._groupId = groupId;
        this._name = name;
    }
    get groupId() {
        return this._groupId;
    }
    get name() {
        return this._name;
    }
    build() {
        invariant(this._groupId, 'AndroidChannelGroup: Missing required `groupId` property');
        invariant(this._name, 'AndroidChannelGroup: Missing required `name` property');
        return {
            groupId: this._groupId,
            name: this._name,
        };
    }
}
//# sourceMappingURL=AndroidChannelGroup.js.map