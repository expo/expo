import { TestServer } from '../expotools';

async function action() {
  await TestServer.startLocalServerAsync();
}

export default program => {
  program
    .command('test-server')
    .description('Starts a server used for Expo client tests')
    .asyncAction(action);
};
