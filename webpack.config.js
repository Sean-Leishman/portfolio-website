const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssWebpackPlugin = require('mini-css-extract-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: './src/client/index.js',
    devServer: {
        static: './dist',
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/client/main.html',
            filename: '[name].[ext]'
        }),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery"
        }),
        new MiniCssWebpackPlugin({
            filename: "[name]/../index.css"
        })
    ],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "style-loader"],
            },
            {
                test: /\.hdr$/i,
                use: [
                    {
                        loader: 'url-loader',
                        options:
                        {
                            outputPath: 'assets/static/'
                        }
                    }
                ],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                //type: 'asset/resource',
                use: 
                [   
                    {
                        loader: 'url-loader',
                        options:
                        {
                            name: '[path][name].[ext]',
                            outputPath: 'assets/images/'
                        }
                    }
                ]
            },
            {
                test: /\.(glb|gltf)$/,
                use:
                [
                    {
                        loader: 'file-loader',
                        options:
                        {
                            name: '[path][name].[ext]',
                            outputPath: 'assets/models/'
                        }
                    }
                ]
            },
            {
                test: /\.html$/,
                use: [
                  {
                    loader: 'html-loader',
                    options:{
                        name:'[name].[ext]'
                    }
                  }
                ]
              }
        ]
    }
}