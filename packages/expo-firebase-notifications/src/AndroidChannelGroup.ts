// @flow
import invariant from 'invariant';

type NativeAndroidChannelGroup = {|
  groupId: string,
  name: string,
|};

export default class AndroidChannelGroup {
  _groupId: string;

  _name: string;

  constructor(groupId: string, name: string) {
    this._groupId = groupId;
    this._name = name;
  }

  get groupId(): string {
    return this._groupId;
  }

  get name(): string {
    return this._name;
  }

  build(): NativeAndroidChannelGroup {
    invariant(this._groupId, 'AndroidChannelGroup: Missing required `groupId` property');
    invariant(this._name, 'AndroidChannelGroup: Missing required `name` property');

    return {
      groupId: this._groupId,
      name: this._name,
    };
  }
}
