import { Children } from 'expo-router/build/rsc/router/host';
import Footer from '../../components/layout/footer';
// import { Slot } from 'expo-router';

export default function Layout({ children }: { children: React.ReactNode }) {
  console.log('USED');
  return (
    <>
      <div className="w-full">
        <div className="mx-8 max-w-2xl py-20 sm:mx-auto">
          <Children />
          {/* <Slot /> */}
        </div>
      </div>
      <Footer />
    </>
  );
}
