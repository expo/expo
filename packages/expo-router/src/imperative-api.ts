import { store } from './global-state/router-store';
import { Router } from './types';

export const router: Router = {
  navigate: (href) => store.navigate(href),
  push: (href) => store.push(href),
  pop: (count) => store.pop(count),
  popToTop: () => store.popToTop(),
  canPop: () => store.canPop(),
  replace: (href) => store.replace(href),
  back: () => store.goBack(),
  canGoBack: () => store.canGoBack(),
  setParams: (params) => store.setParams(params),
};
