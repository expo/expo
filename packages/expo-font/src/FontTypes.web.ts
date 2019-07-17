

export type FontSource = { [key: string]: any } | string | FontResource;

export enum FontDisplay {
    Auto = 'auto',
    Block = 'block',
    Swap = 'swap',
    Fallback = 'fallback',
    Optional = 'optional',
}
  
export interface FontResource {
    uri: string;
    display?: FontDisplay;
}