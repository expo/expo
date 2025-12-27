export type SerialAsset = {
  // 'styles.css'
  originFilename: string;
  // '_expo/static/css/bc6aa0a69dcebf8e8cac1faa76705756.css'
  filename: string;
  // '\ndiv {\n    background: cyan;\n}\n\n'
  source: string;
  type: 'css-external' | 'css' | 'js' | 'map' | 'json';

  metadata: {
    hmrId?: string;
    isAsync?: boolean;
    modulePaths?: string[];
    paths?: Record<string, Record<string, string>>;
    // React server action reference from the static babel pass of client modules.
    reactServerReferences?: string[];
    // React client reference from the static babel pass.
    reactClientReferences?: string[];
    // Maps output key to file path for SSR manifest chunk lookup.
    // Output keys are package specifiers (e.g., "pkg/client") or relative paths (e.g., "./src/Button.js").
    reactClientReferenceMap?: Record<string, string>;
    // Maps output key to numeric module ID for SSR manifest module resolution.
    // This enables the runtime to require() modules by their output key.
    outputKeyToModuleId?: Record<string, string | number>;
    // DOM Component references from the static babel pass.
    expoDomComponentReferences?: string[];
    requires?: string[];
  };
};
