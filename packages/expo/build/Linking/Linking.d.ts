import { LinkingStatic } from 'react-native';
import { ParsedURL, QueryParams } from './Linking.types';
declare function makeUrl(path?: string, queryParams?: QueryParams): string;
declare function parse(url: string): ParsedURL;
declare function parseInitialURLAsync(): Promise<ParsedURL>;
interface ExpoLinking extends LinkingStatic {
    makeUrl: typeof makeUrl;
    parse: typeof parse;
    parseInitialURLAsync: typeof parseInitialURLAsync;
}
declare const _default: ExpoLinking;
export default _default;
