import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

export default [
  {
    input: 'src/html-template-card.ts',
    output: {
      file: 'dist/html-template-card.js',
      format: 'es',
      sourcemap: false,
    },
    plugins: [
      nodeResolve({}),
      commonjs(),
      typescript({ noEmit: false, declaration: false, include: ['src/**/*'] }),
      json(),
      terser({ mangle: { safari10: true } }),
    ],
    watch: { exclude: 'node_modules/**' },
  },
];
