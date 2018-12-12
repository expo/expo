export type PrintOptions = {
  uri: string;
  html?: string;
  printerUrl?: string;
  markupFormatterIOS?: string;
};

export type SelectResult = {
  name: string;
  url: string;
};

export type OrientationConstant = {
  portrait: string;
  landscape: string;
};

export type FilePrintOptions = {
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

export type FilePrintResult = {
  uri: string;
  numberOfPages: number;
};
