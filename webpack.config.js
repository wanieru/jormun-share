const path = require('path');

module.exports = {
    entry: './src/www/index.tsx',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    output: {
        filename: 'main.js',
        path: __dirname + "/www/js",
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
            "react": "preact/compat",
            "react-dom/test-utils": "preact/test-utils",
            "react-dom": "preact/compat",     // Must be below test-utils
            "react/jsx-runtime": "preact/jsx-runtime"
        }
    },
    devtool: "inline-source-map"
};