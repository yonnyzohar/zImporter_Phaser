const path = require('path');

module.exports = {
  entry: './src/index.ts', // adjust to your main file
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'zimporter-pixi.min.js',
    library: 'zimporter',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.webpack.json',
        },
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    'pixi.js': 'PIXI',
    '@pixi-spine/all-4.0': 'PIXI.spine',
    'gsap': 'gsap',
    'reflect-metadata': 'Reflect',
    'class-transformer': 'classTransformer',
    'class-validator': 'classValidator'
  },
  mode: 'production',
};
