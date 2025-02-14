// import '@expo/metro-runtime';

self.onmessage = (event) => {
  const { data } = event;
  const result = data * 4; // Example: double the number
  postMessage(result);
};

//

// /packages/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2Fworker%2Fapp&unstable_transformProfile=hermes-stable
// /apps/router-e2e/__e2e__/worker/worker-one.map?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=__e2e__%2Fworker%2Fapp&unstable_transformProfile=hermes-stable&modulesOnly=false&runModule=true
