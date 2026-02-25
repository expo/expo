import '@expo/metro-runtime';
import { JSONValue } from './dom.types';
export interface MarshalledProps {
    names: string[];
    props: Record<string, JSONValue>;
    [key: string]: undefined | JSONValue;
}
export declare function registerDOMComponent(AppModule: any): void;
//# sourceMappingURL=dom-entry.d.ts.map