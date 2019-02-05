declare class GoogleAuthData {
    constructor(props: any);
    equals(other: any): boolean;
    toJSON(): {
        [key: string]: any;
    };
}
export default GoogleAuthData;
