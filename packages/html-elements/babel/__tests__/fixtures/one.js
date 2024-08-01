import { Image } from 'react-native';

export default function App() {
  return (
    <main className="flex-1 items-center justify-center">
      <article className="md:flex bg-slate-100 rounded-xl p-8 md:p-0 dark:bg-slate-800">
        <Image
          className="w-24 h-24 md:w-48 md:h-auto md:rounded-none rounded-full mx-auto"
          source={{
            uri: 'https://en.gravatar.com/userimage/120276729/078ee8361156d0e1c37b90e7851fed4b.png',
          }}
          width="384"
          height="512"
        />
        <main className="pt-6 md:p-8 text-center md:text-left space-y-4">
          <p className="text-lg font-medium">
            With <code>@expo/html-elements</code>, you can write HTML syntax that renders to real
            native components. Combined with Tailwind CSS, you have an experience that makes web
            developers feel at home.”
          </p>
          <div className="font-medium">
            <p className="text-sky-500 dark:text-sky-400 my-0">Evan Bacon</p>
            <p className="text-slate-700 dark:text-slate-500 my-2">Engineer, Expo</p>
          </div>
        </main>
      </article>
    </main>
  );
}
