var webpack = require('webpack');
var path = require('path');

var config = {
  devtool: 'sourcemap',
  entry: {
    index: './index.js'
  },
  output: {
    path: path.join(__dirname, 'build'),
    publicPath: 'build/',
    filename: 'react-autolayout.js',
    sourceMapFilename: 'react-autolayout.map',
    library: 'ReactAutoLayout',
    libraryTarget: 'umd',
  },
  module: {
    loaders: [{
      test: /\.(js|jsx)/,
      loader: 'babel',
      exclude: /node_modules/
    }, {
      test: /\.css$/, loader: "style-loader!css-loader"
    }],
  },
  plugins: [],
  resolve: {
    extensions: ['', '.js']
  },
  externals: {
    'react': {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react'
    }
  },
};

module.exports = config;