import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    babel({ exclude: 'node_modules/**' })
  ],
  onwarn: e => {
    throw new Error(e);
  },
  output: {
    name: 'dynamicMarquee',
    file: 'dist/dynamic-marquee.js',
    format: 'umd'
  }
};
