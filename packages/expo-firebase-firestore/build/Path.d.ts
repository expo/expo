export default class Path {
    _parts: string[];
    constructor(pathComponents: string[]);
    readonly id: string | null;
    readonly isDocument: boolean;
    readonly isCollection: boolean;
    readonly relativeName: string;
    child(relativePath: string): Path;
    parent(): Path | null;
    /**
     *
     * @package
     */
    static fromName(name?: string): Path;
}
