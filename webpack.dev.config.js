const path = require('path');

const commonConfig = {
  mode: 'development',
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
    entry: path.resolve(__dirname, './src/functions/line-webhook-local.ts'),
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'terraform/functions/line-web-hook'),
      libraryTarget: 'commonjs'
    },
  },
  {
    entry: path.resolve(__dirname, './src/functions/snp500.ts'),
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'terraform/functions/snp500'),
      libraryTarget: 'commonjs'
    },
  },
  {
    entry: path.resolve(__dirname, './src/functions/sqs-handler.ts'),
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'terraform/functions/sqs-handler'),
      libraryTarget: 'commonjs'
    },
  },
]

module.exports = handlers.map((handler) => Object.assign({}, commonConfig, handler));