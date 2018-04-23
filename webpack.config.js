const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: 'none',
  output: {
    library: 'dynamicMarquee',
    libraryTarget: 'umd',
    filename: 'dynamic-marquee.js'
  },
  target: 'web',
  optimization: {
    occurrenceOrder: true,
    usedExports: true,
    concatenateModules: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};