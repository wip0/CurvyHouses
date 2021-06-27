const path = require('path');

const commonConfig = {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  target: 'node'
};

const handlers = [
  {
    entry: path.resolve(__dirname, './src/line-web-hook/index.ts'),
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'terraform/functions/line-web-hook'),
      libraryTarget: 'commonjs'
    },
  },
  // {
  //   entry: path.resolve(__dirname, './src/snp500/index.ts'),
  //   output: {
  //     filename: 'index.js',
  //     path: path.resolve(__dirname, 'terraform/functions/'),
  //     libraryTarget: 'commonjs'
  //   },
  // }
];

module.exports = handlers.map((handler) => Object.assign({}, commonConfig, handler));