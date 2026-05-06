export interface BasePageEvent {
  pathname: string;
  params: Record<string, string>;
  screenId: string;
}

/**
 * The page is about to appear (start of a navigation transition into it).
 */
export interface PageWillAppear extends BasePageEvent {
  type: 'pageWillAppear';
}

/**
 * The page has appeared (end of a navigation transition into it, or focus on a tab navigator).
 */
export interface PageAppeared extends BasePageEvent {
  type: 'pageAppeared';
}

/**
 * The page is about to disappear (start of a navigation transition away from it).
 */
export interface PageWillDisappear extends BasePageEvent {
  type: 'pageWillDisappear';
}

/**
 * The page has disappeared (end of a navigation transition away from it, or blur on a tab navigator).
 */
export interface PageDisappeared extends BasePageEvent {
  type: 'pageDisappeared';
}
