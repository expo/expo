export interface NavigationRouteLike {
  key: string;
  name: string;
  params?: object;
  state?: NavigationStateLike;
}

export interface NavigationStateLike {
  type?: string;
  index?: number;
  routes: NavigationRouteLike[];
}

export interface NavigationContainerRefLike {
  addListener(event: 'state', cb: () => void): () => void;
  addListener(
    event: '__unsafe_action__',
    cb: (e: { data: { action: { type: string; payload?: object }; noop: boolean } }) => void
  ): () => void;
  getRootState(): NavigationStateLike | undefined;
  isFocused(): boolean;
  isReady(): boolean;
}
