import Statuses from './Statuses';

export default {
  [Statuses.Running]: '#ff0',
  [Statuses.Passed]: '#59bb09',
  [Statuses.Failed]: '#f00',
  [Statuses.Disabled]: '#888',
  tintColor: '#4630EB', // Expo Blue
  activeTintColor: '#4630ec',
  inactiveTintColor: '#595959',
};
