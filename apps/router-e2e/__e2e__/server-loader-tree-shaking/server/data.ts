if (typeof window !== 'undefined') {
  throw new Error('SERVER_LOADER_TREE_SHAKING_SECRET');
}

export async function readServerData() {
  // A dynamic import pulls the async runtime into the dependency graph unless this module is removed.
  const { message } = await import('./message');
  return { message };
}
