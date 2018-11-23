// @flow

/*
 * TODO: Bacon: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#Permissions
 * Add messages to manifest like we do with iOS info.plist
 */

// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#Using_the_new_API_in_older_browsers
// Older browsers might not implement mediaDevices at all, so we set an empty object first
if (navigator.mediaDevices === undefined) {
  navigator.mediaDevices = {};
}

// Some browsers partially implement mediaDevices. We can't just assign an object
// with getUserMedia as it would overwrite existing properties.
// Here, we will just add the getUserMedia property if it's missing.
if (navigator.mediaDevices.getUserMedia === undefined) {
  navigator.mediaDevices.getUserMedia = function(constraints) {
    // First get ahold of the legacy getUserMedia, if present
    var getUserMedia =
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      function() {
        const err = new Error('Permission unimplemented');
        err.code = 0;
        err.name = 'NotAllowedError';
        throw err;
      };

    return new Promise(function(resolve, reject) {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  };
}

const Status = {
  undetermined: 'undetermined',
  granted: 'granted',
  denied: 'denied',
};

async function askForMediaPermissionAsync(options) {
  try {
    await navigator.mediaDevices.getUserMedia(options);
    return { status: Status.granted };
  } catch ({ message }) {
    // name: NotAllowedError
    // code: 0
    if (message === 'Permission dismissed') {
      // message: Permission dismissed
      return { status: Status.undetermined };
    } else {
      // TODO: Bacon: The system could deny access to chrome.
      // TODO: Bacon: add: { status: 'unimplemented' }
      // message: Permission denied
      return { status: Status.denied };
    }
  }
}

async function askForMicrophonePermissionAsync() {
  return askForMediaPermissionAsync({ audio: true });
}

async function askForCameraPermissionAsync() {
  return askForMediaPermissionAsync({ video: true });
}

async function askForLocationPermissionAsync() {
  return new Promise((res, rej) => {
    navigator.geolocation.getCurrentPosition(
      function() {
        res({ status: Status.granted });
      },
      function({ code }) {
        if (code === 1) {
          res({ status: Status.denied });
        } else {
          res({ status: Status.undetermined });
        }
      }
    );
  });
}

async function getPermissionAsync(permission, shouldAsk) {
  switch (permission) {
    case 'userFacingNotifications':
    case 'notifications':
      {
        const { Notification = {} } = global;
        if (Notification.requestPermission) {
          let status = Notification.permission;
          if (shouldAsk) {
            status = await Notification.requestPermission();
          }
          if (!status || !status.length || status === 'default') {
            return { status: Status.undetermined };
          }
          return { status };
        }
      }
      break;
    case 'location':
      {
        const { navigator = {} } = global;
        if (navigator.permissions) {
          const { state } = await navigator.permissions.query({ name: 'geolocation' });
          if (state !== Status.granted && state !== Status.denied) {
            if (shouldAsk) {
              return askForLocationPermissionAsync();
            }
            return { status: Status.undetermined };
          }

          return { status: state };
        } else if (shouldAsk) {
          // TODO: Bacon: should this function as ask async when not in chrome?
          return askForLocationPermissionAsync();
        }
      }
      break;
    case 'audioRecording':
      if (shouldAsk) {
        return askForMicrophonePermissionAsync();
      } else {
        //TODO: Bacon: Is it possible to get this permission?
      }
      break;
    case 'camera':
      if (shouldAsk) {
        return askForCameraPermissionAsync();
      } else {
        //TODO: Bacon: Is it possible to get this permission?
      }
      break;
    default:
      break;
  }
  return { status: Status.undetermined };
}

export default {
  get name() {
    return 'ExpoPermissions';
  },
  async getAsync(permissionsTypes: Array<string>) {
    const permissions = [...new Set(permissionsTypes)];
    let permissionResults = [];
    for (let permission of permissions) {
      const result = await getPermissionAsync(permission, false);
      permissionResults.push(result);
    }
    return permissionResults;
  },
  async askAsync(permissionsTypes: Array<string>) {
    const permissions = [...new Set(permissionsTypes)];
    let permissionResults = [];
    for (let permission of permissions) {
      const result = await getPermissionAsync(permission, true);
      permissionResults.push(result);
    }
    return permissionResults;
  },
};
