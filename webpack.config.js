const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');

module.exports = {
  entry: './js/src/main.js',
  output: {
    filename: 'app.min.js',
    path: path.resolve(__dirname, 'js'),
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false, // 保留 console 以便除錯，生產環境可設為 true
            drop_debugger: true,
            pure_funcs: []
          },
          mangle: {
            toplevel: true,
          },
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
  mode: 'production',
  devtool: false, // 生產環境不生成 source map
};
