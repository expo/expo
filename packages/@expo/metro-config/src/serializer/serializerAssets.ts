export type SerialAsset = {
  // 'styles.css'
  originFilename: string;
  // '_expo/static/css/bc6aa0a69dcebf8e8cac1faa76705756.css'
  filename: string;
  // '\ndiv {\n    background: cyan;\n}\n\n'
  source: string;
  type: 'css' | 'js';

  metadata: Record<string, string>;
};
