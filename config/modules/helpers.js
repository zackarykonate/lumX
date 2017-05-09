const autoprefixer = require('autoprefixer');
const merge = require('merge');
const path = require('path');

/////////////////////////////

/*
 * Webpack Plugins.
 */
const HtmlWebpackPlugin = require('html-webpack-plugin');

/////////////////////////////

/*
 * Useful constants.
 */
const APPENGINE_DEV_SERVER = {
    host: 'localhost',
    port: 8888,
};

const ENABLE_DASHBOARD = false;
const ENABLE_AOT = process.env.AOT;
const ENABLE_DEBUG = process.env.DEBUG;
const IS_LIVE = process.env.LIVE;
const SILENT = process.env.SILENT;
const TESTS_TYPE = process.env.TESTS;

const ENVS = {
    dev: 'development',
    development: 'development',
    prod: 'production',
    production: 'production',
    test: 'test',
    tests: 'test',
};

const TESTS_TYPES = {
    e2e: 'e2e',
    unit: 'unit',
};

/////////////////////////////

function hasProcessFlag(flag) {
    return process.argv.join('').indexOf(flag) > -1;
}

function isWebpackDevServer() {
    return process.argv[1] && !!(/webpack-dev-server/.exec(process.argv[1])); // eslint-disable-line
}

/////////////////////////////

const ROOT = path.resolve(__dirname, '../..');
const rootFunction = path.join.bind(path, ROOT);

/////////////////////////////

/**
 * Get the default metadata.
 *
 * @param  {string} env The runtime environment.
 *                      Possible values are 'development', 'production' or 'test'.
 * @return {Object} The default metadata.
 */
function getMetadata(env) {
    env = (env === undefined || typeof env !== 'string' || env.length === 0) ? ENVS.dev : env;

    const HMR = (env === ENVS.dev) ? hasProcessFlag('hot') : false;

    return {
        HMR: HMR,
        env: env,
        host: process.env.HOST || 'localhost',
        isDevServer: isWebpackDevServer(),
        port: process.env.PORT || 8880,
    };
}

/////////////////////////////

const COMMON_DEBUG_INFO = {
    assets: false,
    cached: false,
    children: false,
    chunkModules: false,
    chunkOrigins: false,
    chunks: false,
    context: '/src/client/',
    errorDetails: true,
    hash: false,
    modules: false,
    reasons: false,
    source: false,
    timings: true,
    version: true,
    /*
     * Filter warnings to be shown (since webpack 2.4.0).
     * Can be a String, Regexp, a function getting the warning and returning a boolean  or an Array of a
     * combination of the above. First match wins.
     *
     * "filter" | /filter/ | ["filter", /filter/] | (warning) => ... return true|false;
     */
    warningsFilter: (message) => message.indexOf('DeprecationWarning:') === -1,
};

const DEV_SERVER_CONFIG = {
    historyApiFallback: true,
    host: 'localhost',
    noInfo: true,
    port: 8880,

    proxy: {
        '/_ah/*': {
            changeOrigin: true,
            target: `http://${APPENGINE_DEV_SERVER.host}:${APPENGINE_DEV_SERVER.port}`,
        },
        '/services/*': {
            changeOrigin: true,
            target: `http://${APPENGINE_DEV_SERVER.host}:${APPENGINE_DEV_SERVER.port}`,
        },
    },

    quiet: true,
    stats: Object.assign({}, COMMON_DEBUG_INFO, {
        cachedAssets: false,
        colors: true,
        depth: false,
        entrypoints: false,
        errors: true,
        exclude: [],
        performance: true,
        providedExports: false,
        publicPath: false,
        usedExports: false,
        warnings: true,
    }),
};

/**
 * Get the development server configuration.
 *
 * @param  {Object} metadata The metadata.
 * @return {Object} The development server configuration.
 */
function getDevServerConfig(metadata) {
    metadata = (metadata === undefined || typeof metadata !== 'object') ? getMetadata() : metadata;

    const devServerConfig = Object.assign({}, DEV_SERVER_CONFIG);
    devServerConfig.host = metadata.host || devServerConfig.host;
    devServerConfig.port = metadata.port || devServerConfig.port;

    return devServerConfig;
}

/////////////////////////////

/**
 * Generate an HTML Webpack Plugin with correct metadata.
 *
 * @param  {Object}            metadata The metadata.
 * @param  {string}            title    The title.
 * @return {HtmlWebpackPlugin} The html webpack plugin.
 */
function getHtmlWebpackPlugin(metadata, title) {
    metadata = (metadata === undefined || typeof metadata !== 'object') ? getMetadata() : metadata;
    title = (title === undefined || typeof title !== 'string' || title.length === 0) ? 'LumX²' : title;

    /*
     * HtmlWebpackPlugin.
     * Simplifies creation of HTML files to serve your webpack bundles.
     * This is especially useful for webpack bundles that include a hash in the filename which changes every
     * compilation.
     *
     * @see {@link https://github.com/ampedandwired/html-webpack-plugin|HTML Webpack Plugin}
     */
    return new HtmlWebpackPlugin({
        chunksSortMode: 'dependency',
        inject: 'head',
        metadata: metadata,
        template: 'src/client/index.html',
        title: title,
    });
}

/////////////////////////////

const DEFAULT_OPTIONS = {
    debug: false,
    options: {
        context: rootFunction(''),

        /*
         * Configure the HTML Loader.
         *
         * @see {@link https://github.com/webpack/html-loader|HTML Loader}
         */
        htmlLoader: {
            caseSensitive: true,
            customAttrAssign: [
                /\)?]?=/,
            ],
            customAttrSurround: [
                [
                    /#/,
                    /(?:)/,
                ],
                [
                    /\*/,
                    /(?:)/,
                ],
                [
                    /\[?\(?/,
                    /(?:)/,
                ],
            ],
            minimize: false,
            removeAttributeQuotes: false,
        },

        output: {
            path: rootFunction('dist', 'client'),
        },

        /*
         * Configure The Post-CSS Loader.
         *
         * @see {@link https://github.com/postcss/postcss-loader|Post-CSS Loader}
         * @see {@link https://github.com/postcss/autoprefixer#webpack|AutoPrefixer for Webpack}
         */
        postcss: [
            autoprefixer({
                browsers: [
                    'last 2 versions',
                ],
            }),
        ],

        /*
         * Configure Sass.
         *
         * @see {@link https://github.com/jtangelder/sass-loader|SASS Loader}
         */
        sassLoader: {
            includePaths: [
                rootFunction('src', 'client', 'app'),
                rootFunction('src', 'client', 'app', 'core', 'styles'),
                rootFunction('node_modules'),
            ],
            indentType: 'space',
            indentWidth: 4,
            outputStyle: 'expanded',
        },

        /**
         * Static analysis linter for TypeScript advanced options configuration.
         * An extensible linter for the TypeScript language.
         *
         * @see {@link https://github.com/wbuchwalter/tslint-loader|TSLint Loader}
         */
        tslint: {
            /*
             * TSLint errors are displayed by default as warnings.
             * Set emitErrors to true to display them as errors.
             */
            emitErrors: false,

            /*
             * TSLint does not interrupt the compilation by default.
             * If you want any file with tslint errors to fail set failOnHint to true.
             */
            failOnHint: false,
        },
    },
};

/**
 * Get the webpack loaders options.
 *
 * @param  {Object} options  Options to add to the default options
 * @return {Object} The development server configuration.
 */
function getOptions(options) {
    return merge.recursive(true, DEFAULT_OPTIONS, options);
}

/////////////////////////////

exports.ENABLE_AOT = ENABLE_AOT;
exports.ENABLE_DASHBOARD = ENABLE_DASHBOARD;
exports.ENABLE_DEBUG = ENABLE_DEBUG;
exports.ENVS = ENVS;
exports.IS_LIVE = IS_LIVE;
exports.SILENT = SILENT;

exports.COMMON_DEBUG_INFO = COMMON_DEBUG_INFO;
exports.TESTS_TYPE = TESTS_TYPE;
exports.TESTS_TYPES = TESTS_TYPES;

exports.getDevServerConfig = getDevServerConfig;
exports.getHtmlWebpackPlugin = getHtmlWebpackPlugin;
exports.getMetadata = getMetadata;
exports.getOptions = getOptions;
exports.hasProcessFlag = hasProcessFlag;
exports.isWebpackDevServer = isWebpackDevServer;
exports.root = rootFunction;