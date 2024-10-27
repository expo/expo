export default {
  async reload(): Promise<void> {
    if (typeof window !== 'undefined') window.location.reload(true);
  },
};
