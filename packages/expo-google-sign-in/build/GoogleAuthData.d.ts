declare class GoogleAuthData {
    constructor(options: any);
    equals(other: any): boolean;
    toJSON(): {
        [key: string]: any;
    };
}
export default GoogleAuthData;
