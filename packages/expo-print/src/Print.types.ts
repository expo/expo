export interface PrintOptions {
  uri?: string;
  html?: string;
  printerUrl?: string;
  markupFormatterIOS?: string;
  orientation?: string;
};

export interface Printer {
  name: string;
  url: string;
};

export interface OrientationType {
  portrait: string;
  landscape: string;
};

export interface FilePrintOptions {
  html?: string;
  width?: number;
  height?: number;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

export interface FilePrintResult {
  uri: string;
  numberOfPages: number;
};
