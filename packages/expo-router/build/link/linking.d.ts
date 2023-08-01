import getPathFromState from '../fork/getPathFromState';
import getStateFromPath from '../fork/getStateFromPath';
export declare function getInitialURL(): Promise<string | null> | string;
export declare function getRootURL(): string;
export declare function addEventListener(listener: (url: string) => void): () => void;
export { getStateFromPath, getPathFromState };
//# sourceMappingURL=linking.d.ts.map