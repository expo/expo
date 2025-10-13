declare global {
  interface RequestInit {
    duplex?: 'half';
  }

  interface Request {
    duplex?: 'half';
  }

  interface Response {
    // Used in EAS workerd
    cf?: unknown;
    webSocket?: unknown;
  }
}

// To augment the global types, this file has to be a module.
export {};
