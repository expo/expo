/* @flow */

import { NavigationContext } from '@expo/ex-navigation';

import Router from './Router';

class CustomNavigationContext extends NavigationContext {
  showModal(initialRouteName, initialRouteParams = {}) {
    const initialRoute = Router.getRoute(initialRouteName, initialRouteParams);
    const rootNavigator: any = this.getNavigator('root');
    const route = Router.getRoute('modal', { initialRoute });

    rootNavigator.push(route);
  }

  dismissModal() {
    const rootNavigator: any = this.getNavigator('root');
    rootNavigator.pop();
  }
}

export default new CustomNavigationContext({
  router: Router,
});
