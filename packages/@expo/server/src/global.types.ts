declare global {
  interface RequestInit {
    duplex?: 'half';
  }

  interface Request {
    duplex?: 'half';
  }
}

// To augment the global types, this file has to be a module.
export {};
