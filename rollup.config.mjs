import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import { copyFileSync } from 'fs';

export default {
  input: 'src/index.js',
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    babel({ exclude: 'node_modules/**', babelHelpers: 'bundled' }),
    {
      writeBundle() {
        copyFileSync('src/dynamic-marquee.d.ts', 'dist/dynamic-marquee.d.ts');
      },
    },
  ],
  onwarn: (e) => {
    throw new Error(e);
  },
  output: [
    {
      name: 'dynamicMarquee',
      file: 'dist/dynamic-marquee.js',
      format: 'umd',
    },
    {
      file: 'dist/dynamic-marquee.mjs',
      format: 'es',
    },
  ],
};
