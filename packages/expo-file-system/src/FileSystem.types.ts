export type DownloadOptions = {
  md5?: boolean;
  headers?: { [name: string]: string };
};

export type DownloadResult = {
  uri: string;
  status: number;
  headers: { [name: string]: string };
  md5?: string;
};

export type DownloadProgressCallback = (data: DownloadProgressData) => void;

export type DownloadProgressData = {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
};

export type DownloadPauseState = {
  url: string;
  fileUri: string;
  options: DownloadOptions;
  resumeData?: string;
};

export type FileInfo =
  | {
      exists: true;
      uri: string;
      size: number;
      modificationTime: number;
      md5?: string;
    }
  | {
      exists: false;
      isDirectory: false;
    };

export enum EncodingType {
  UTF8 = 'utf8',
  Base64 = 'base64',
}

export type ReadingOptions = {
  encoding?: EncodingType | 'utf8' | 'base64';
  position?: number;
  length?: number;
};

export type WritingOptions = {
  encoding?: EncodingType | 'utf8' | 'base64';
};

export type ProgressEvent = {
  uuid: string;
  data: {
    totalBytesWritten: number;
    totalBytesExpectedToWrite: number;
  };
};
