import path from 'node:path';

export default {
  plugins: {
    '@tailwindcss/postcss': {
      // Tailwind CSS finds class names in the files of its base directory. The default is
      // the current directory. The Next.js build runs in `../docs`, so its CSS has the
      // classes of all files there, not only of the files in `tailwind.config.cjs`.
      base: path.resolve(import.meta.dirname, '../docs'),
    },
  },
};
