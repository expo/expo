import { store } from './global-state/router-store';

export const router: ExpoRouter.Router = {
  navigate: (href) => store.navigate(href),
  push: (href) => store.push(href),
  replace: (href) => store.replace(href),
  back: () => store.goBack(),
  canGoBack: () => store.canGoBack(),
  setParams: (params) => store.setParams(params),
};
