const path = require('path');

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, 'src', 'index.ts'),
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'kuick', 'static', 'js'),
  },
  resolve: { 
    alias: { 
      "react": "preact/compat",
      "react-dom/test-utils": "preact/test-utils",
      "react-dom": "preact/compat",
    },
  },
  module: {
    rules: [
      {
        test: /\.js$|\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: "defaults" }],
            ],
            plugins: ['@babel/plugin-transform-typescript', 'babel-plugin-htm'],
          },
        },
      },
    ],
  },
};
