export type DocumentPickerOptions = {
  type?: string;
  copyToCacheDirectory?: boolean;
  multiple?: boolean;
};

export type DocumentResult =
  | { type: 'cancel' }
  | {
      type: 'success';
      name: string;
      size: number;
      uri: string;
      mimeType: string;
      lastModified?: number;
      file?: File;
      output?: FileList | null;
    };
