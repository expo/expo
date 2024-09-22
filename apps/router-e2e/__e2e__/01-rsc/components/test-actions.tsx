'use server';
import 'server-only';

export async function greet() {
  console.log('hello');
  return ['hello'];
}
