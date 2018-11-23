import * as THREE from 'three';
declare module 'THREE' {
    class BinaryLoader extends THREE.Loader {
    }
}
declare const parseAsync: ({ json, format, assetProvider }: {
    json: any;
    format: any;
    assetProvider: any;
}) => Promise<any>;
export default parseAsync;
