const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

const SRC_DIR = path.join(__dirname, "/src");
const DIST_DIR = path.join(__dirname, "/dist");
const EXAMPLE_DIR = path.join(__dirname, "/example");

module.exports = (env, argv) => ({
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                cache: true,
                include: /\.min\.js$/,
                parallel: true,
                sourceMap: true
            }),
            new OptimizeCSSAssetsPlugin({})
        ]
    },
    entry: {
        "te-graphics.bundle.min": path.join(SRC_DIR, "app.js")
    },
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: [
                    "babel-loader",
                    "eslint-loader",
                ],
            },
            {
                test: /\.(scss|sass|css)$/,
                exclude: /node_modules/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "postcss-loader",
                    "sass-loader",
                ],
            },
            {
                test: /\.(html)$/,
                exclude: /node_modules/,
                use: {
                    loader: "html-loader",
                    options: {minimize: false}
                }
            },
            {
                test: /\.(svg)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "svg-url-loader",
                    },
                ],
            }
        ]
    },
    output: {
        filename: "[name].js",
        libraryTarget: "umd",
        path: DIST_DIR,
        publicPath: argv.mode !== "production" ? "/" : "../dist/",
        umdNamedDefine: true
    },
    devtool: argv.mode !== "production" ? "eval-cheap-module-source-map" : "source-map",
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css'
        }),
        new HtmlWebpackPlugin({
            //chunks: [ "te-graphics.bundle" ],
            template: path.join(__dirname, "index.html"),
            filename: path.join((argv.mode !== "production" ? DIST_DIR : EXAMPLE_DIR), "index.html"),
            inject: "head",
        }),
        new CopyPlugin([
            path.join(__dirname, "chart_data.json"),
            path.join(EXAMPLE_DIR, "chart_data.json"),
        ]),
    ],
    devServer: {
        contentBase: SRC_DIR,
        watchContentBase: true,
        port: 9000,
        open: true
    }
});

