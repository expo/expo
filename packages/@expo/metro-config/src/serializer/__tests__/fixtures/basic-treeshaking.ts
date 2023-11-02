import { fromFixture } from './fromFixture';

/**
 * index.js
import { add } from './math';

console.log('add', add(1, 2));
 * 
 * math.js
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}
 */
export const basic = fromFixture(
  require('./index-ios-494aba910c6cfebc6bfa7de3046bbca5c0441c52f793c212e28885ced22e1d09.json')
);
/**
 * index.js
import './unused';
import { add, subtract } from './math';

console.log('add', add(1, 2));
 * 
 * math.js
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}
 * 
 * unused.js
export function unused() {
  console.log('lonely function');
}
 */
export const unusedFile = fromFixture(
  require('./index-ios-72eca9dff484fb1a7194ae4fde7746e8f0b47a502fa8df9b1bcea3fe4832c781.json')
);
