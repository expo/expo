import { Asset } from './Asset';
export declare class Album {
    constructor(id: string);
    id: string;
    getAssets(): Promise<Array<Asset>>;
    getName(): Promise<string>;
    delete(): Promise<void>;
    add(asset: Asset): Promise<void>;
}
//# sourceMappingURL=Album.d.ts.map