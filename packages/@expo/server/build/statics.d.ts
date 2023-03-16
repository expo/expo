import { URL } from 'url';
import { ExpoRequest, ExpoResponse } from './environment';
export declare function getStaticMiddleware(root: string): (url: URL, req: ExpoRequest) => Promise<ExpoResponse> | null;
