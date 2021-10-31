const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    webpack: {
        configure: (webpackConfig, {env, paths}) => {
            return {
                ...webpackConfig,
                entry: {
                    main: [env === 'development' && require.resolve('react-dev-utils/webpackHotDevClient'),paths.appIndexJs].filter(Boolean),
                    content: './src/chromeServices/DOMEvaluator.ts',
                    modal: './src/chromeServices/DOMEvaluator.css',
                    videojs: './src/chromeServices/video.min.css',
                },
                output: {
                    ...webpackConfig.output,
                    filename:  (/*{ chunk: { name } } */) => {
                        return 'static/js/[name].js';
                    }
                },
                optimization: {
                    ...webpackConfig.optimization,
                    runtimeChunk: false,
                },
                plugins: webpackConfig.plugins.filter((plugin) => !(plugin instanceof MiniCssExtractPlugin))
                    .concat(
                    // `MiniCssExtractPlugin` is used with its default config instead,
                    // which doesn't contain `[contenthash]`.
                    new MiniCssExtractPlugin({
                        filename: 'static/css/[name].css',
                    }),
                ),
            }
        },
    }
 }