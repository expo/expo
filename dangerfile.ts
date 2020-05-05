import { checkChangelog } from '@expo/danger';

const allowedUsers = ['lukmccall', 'sjchmiela', 'tsapeta', 'bbarthec', 'mczernek'];
// eslint-disable-next-line no-undef
const prAuthor = danger.github.pr.base.user.login;
if (allowedUsers.includes(prAuthor)) {
  checkChangelog();
}
