/* eslint-disable unicorn/prefer-module */
/* eslint-disable node/prefer-global/process */
/* eslint-disable node/prefer-global/buffer */
const path = require('node:path');
const webpack = require('webpack');
const FilemanagerPlugin = require('filemanager-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// Const ExtensionReloader = require('webpack-extension-reloader');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const WebpackDevServer = require('webpack-dev-server');

const nodeEnv = process.env.NODE_ENV || 'development';
const targetBrowser = process.env.TARGET_BROWSER;

console.log('NODE_ENV:', nodeEnv);
console.log('TARGET_BROWSER:', targetBrowser);
console.log("PORT:", process.env.PORT); 

// Const extensionReloaderPlugin =
//   nodeEnv === 'development'
//     ? new ExtensionReloader({
//         port: 9090,
//         reloadPage: true,
//         entries: {
//           // TODO: reload manifest on update
//           contentScript: 'content',
//           background: 'background',
//           extensionPage: ['popup', 'options'],
//         },
//       })
//     : () => {
//         this.apply = () => {};
//       };

const getExtensionFileType = browser => {
	if (browser === 'opera') {
		return 'crx';
	}

	if (browser === 'firefox') {
		return 'xpi';
	}

	return 'zip';
};

module.exports = env => {
	const config = {
		devtool: false, // https://github.com/webpack/webpack/issues/1194#issuecomment-560382342

		mode: nodeEnv,

		stats: {
			all: false,
			builtAt: true,
			errors: true,
			hash: true,
		},

		entry: {
			background: './src/scripts/background.ts',
			inject: './src/scripts/inject.ts',

		},

		output: {
			path: path.resolve(__dirname, 'extension', targetBrowser),
			filename: 'js/[name].bundle.js',
		},

		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: 'ts-loader',
					exclude: /node_modules/,
				},
				{
					test: /.(js|jsx)$/,
					include: [path.resolve(__dirname, 'src/scripts')],
					loader: 'babel-loader',

					options: {
						plugins: ['syntax-dynamic-import'],

						presets: [
							[
								'@babel/preset-env',
								{
									modules: false,
								},
							],
						],
					},
				},
				{
					test: /\.scss$/,
					use: [
						{
							loader: MiniCssExtractPlugin.loader, // It creates a CSS file per JS file which contains CSS
						},
						{
							loader: 'css-loader',
							options: {
								sourceMap: nodeEnv === 'development',
							},
						},
						{
							loader: 'postcss-loader',
							options: {
								postcssOptions: {
									plugins: [
										[
											'autoprefixer',
											{
												// Options
											},
										],
									],
								},
							},
						},
						'resolve-url-loader',
						'sass-loader',
					],
				},
			],
		},
		resolve: {
			extensions: ['.tsx', '.ts', '.js'],
		},
		output: {
			filename: '[name].bundle.js',
			path: path.resolve(__dirname, 'extension', targetBrowser),
		},
		plugins: [
			new webpack.ProgressPlugin(),
			// Generate manifest.json
			// Generate sourcemaps
			new webpack.SourceMapDevToolPlugin({filename: false}),
			new webpack.EnvironmentPlugin(['NODE_ENV', 'TARGET_BROWSER']),
			new CleanWebpackPlugin({
				cleanOnceBeforeBuildPatterns: [
					path.join(process.cwd(), `extension/${targetBrowser}/`),
					path.join(
						process.cwd(),
						`extension/${targetBrowser}.${getExtensionFileType(targetBrowser)}`,
					),
				],
				cleanStaleWebpackAssets: true,
				verbose: true,
			}),
			// Write css file(s) to build folder
			new MiniCssExtractPlugin({filename: 'css/[name].css'}),
			// Copy static assets
			new CopyWebpackPlugin({
				patterns: [
					{from: 'static', to: 'assets'},
					{
						from: 'static/manifest.json',
						to: path.join(__dirname, 'extension', targetBrowser, 'manifest.json'),
						force: true,
						transform(content) {
							// Generates the manifest file using the package.json informations
                            const manifest = {
                                ...JSON.parse(content.toString()),
                                version: process.env.npm_package_version,
                            }
                            // Add content security policy in development mode to prevent HTTP CSP errors
                            if (nodeEnv === "development") {
                                console.log("dev2");
                                manifest["content_security_policy"] = 
                                {"extension_pages": "script-src 'self'; object-src 'self'"}
                            }
							return Buffer.from(
								JSON.stringify(
									manifest,
									null,
									'\t',
								),
							);
						},
					},
				],
			}),
			// Plugin to enable browser reloading in development mode
			// extensionReloaderPlugin,
		],

		optimization: {
			minimize: true,
			minimizer: [
				new TerserPlugin({
					parallel: true,
					terserOptions: {
						format: {
							comments: false,
						},
					},
					extractComments: false,
				}),
				new CssMinimizerPlugin(),
				new FilemanagerPlugin({
					events: {
						onEnd: {
							archive: [
								{
									format: 'zip',
									source: path.join(__dirname, 'extension', targetBrowser),
									destination: `${path.join(
										__dirname,
										'extension',
                                        nodeEnv == "development" ?  "dev"  : "prod",
										targetBrowser,
									)}.${getExtensionFileType(targetBrowser)}`,
									options: {zlib: {level: 6}},
								},
							],
						},
					},
				}),
			],
		},
	};
	if (env.WEBPACK_WATCH) {
		// config.plugins.push(new webpack.HotModuleReplacementPlugin());
		const compiler = webpack(config);

		const server = new WebpackDevServer(
			{
                
				hot: true,
				port: env.PORT,
                server: "http", 
                host: "127.0.0.1",
				static: {
					directory: path.join(__dirname, 'extension',targetBrowser),
					watch: false,
				},
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
				devMiddleware: {
					publicPath: `http://localhost:${env.PORT}`,
					writeToDisk: true,
				},
				allowedHosts: 'all',
			},
			compiler,
		);
 
		if (nodeEnv === 'development' && module.hot) {
			module.hot.accept();
		}

        server.start();
        
		return [];
    }
	return config;
};
