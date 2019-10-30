import ExponentFacebook from '../ExponentFacebook';
import * as Facebook from '../Facebook';

it(`calls with correct parameters`, () => {
  Facebook.logInWithReadPermissionsAsync({
    permissions: ['email'],
  });
  expect(ExponentFacebook.logInWithReadPermissionsAsync).toHaveBeenCalledWith({
    permissions: ['email'],
  });
});
