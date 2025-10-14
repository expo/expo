import { Redirect } from 'expo-router';

export default function Index() {
  console.log('Redirecting to /all/');
  return <Redirect href="/all/" />;
}
