const execSync = require('child_process').execSync;

let result = execSync('kubectl --namespace production get po');
let lines = result.toString().split('\n');
lines.shift();

let docsPod;
let pods = lines.map(line => {
  [pod, ...rest] = line.split(' ');
  return pod;
});

pods.forEach(pod => {
  if (pod.match(/^docs-/)) {
    docsPod = pod;
  }
});

if (docsPod) {
  execSync(`kubectl --namespace production delete po ${docsPod}`);
  console.log('Success');
} else {
  console.error(`Docs pod not found in ${pods.join(',')}`);
}
