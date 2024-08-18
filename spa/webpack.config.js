const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: process.env.stage !== 'prod' ? 'development' : 'production',
  devtool: process.env.stage !== 'prod' ? 'source-map' : 'inline-source-map',
  entry: {
    main: './src/index.tsx',
  },
  resolve: {
    extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx'],
    alias: {
      'spa.json': path.resolve(__dirname, './config/spa.json'),
    },
  },
  output: {
    path: path.join(__dirname, 'public'),
    filename: '[name].js',
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{ loader: 'babel-loader' }, { loader: 'ts-loader' }],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.scss$/, // styles files
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
            },
          },
        ],
      },
      {
        test: /\.(png|woff|gif|woff2|eot|ttf|svg|ico)$/,
        loader: 'url-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      hash: true,
      chunks: ['main'],
      template: 'resources/index.html',
      favicon: 'public/favicon.ico',
      filename: 'index.html',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
  ],
  devServer: {
    static: path.join(__dirname, 'public'),
    historyApiFallback: {
      index: '/',
    },
    compress: true, // Enable gzip compression for everything served
    hot: true, // Enable webpack Hot Module Replacement feature
    port: 3000,
    server: 'http',
    allowedHosts: 'all',
  },
};
