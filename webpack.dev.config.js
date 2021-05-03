const path = require('path');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, './src/local-index.ts'),
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
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'terraform/functions'),
    libraryTarget: 'commonjs'
  },
  target: 'node'
};
