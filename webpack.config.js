//@ts-check

'use strict';

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
	target: 'node',
	mode: 'none',
	entry: './src/extension.ts',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'extension.js',
		libraryTarget: 'commonjs2'
	},
	externals: {
		vscode: 'commonjs vscode'
	},
	resolve: {
		extensions: ['.ts', '.js']
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader'
					}
				]
			}
		]
	},
	devtool: 'source-map',
	infrastructureLogging: {
		level: "log",
	},
};

/** @type WebpackConfig */
const webviewConfig = {
	target: 'web',
	mode: 'none',
	entry: './src/webview/index.tsx',
	output: {
		path: path.resolve(__dirname, 'dist', 'webview'),
		filename: 'webview.js',
		clean: true
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx']
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				use: {
					loader: 'ts-loader',
					options: {
						compilerOptions: {
							jsx: 'react'
						}
					}
				}
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			}
		]
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './src/webview/index.html',
			filename: 'index.html'
		})
	],
	devtool: 'source-map',
	infrastructureLogging: {
		level: "log",
	},
};

module.exports = [extensionConfig, webviewConfig];
