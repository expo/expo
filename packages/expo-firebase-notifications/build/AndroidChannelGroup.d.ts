import { NativeAndroidChannelGroup } from './types';
export default class AndroidChannelGroup {
    _groupId: string;
    _name: string;
    constructor(groupId: string, name: string);
    readonly groupId: string;
    readonly name: string;
    build(): NativeAndroidChannelGroup;
}
