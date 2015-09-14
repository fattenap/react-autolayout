var webpack = require('webpack');
var path = require('path');

var config = {
  devtool: 'sourcemap',
  entry: [
    'webpack-dev-server/client?http://localhost:8080',
    'webpack/hot/only-dev-server',
    './js/app.js'
  ],
  output: {
    path: path.join(__dirname, 'build'),
    publicPath: 'build/',
    filename: 'layout.js'
  },
  module: {
    loaders: [{
      test: /\.js?$/, loaders: ['react-hot', 'babel-loader?optional[]=es7.classProperties'], exclude: /node_modules/
    }, {
      test: /\.css$/, loader: "style-loader!css-loader"
    }],
  },
  plugins: [
    new webpack.NoErrorsPlugin()
  ],
  resolve: {
    extensions: ['', '.js']
  },
};

module.exports = config;