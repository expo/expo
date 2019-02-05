import GoogleAuthData from './GoogleAuthData';
declare class GoogleIdentity extends GoogleAuthData {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    firstName?: string;
    lastName?: string;
    constructor(props: any);
    equals(other: any): boolean;
    toJSON(): {
        [key: string]: any;
    };
}
export default GoogleIdentity;
