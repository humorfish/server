const Gulp = require('gulp');
const Project = require('gulp-typescript').createProject('tsconfig.json');
const Clean = require('gulp-clean');
const Minify = require('gulp-minify');
const NodeMonitor = require('gulp-nodemon');

const RunSequence = require('run-sequence').use(Gulp);
const WebpackStream = require('webpack-stream');
const Webpack = require('webpack');
const shebangLoader = require("shebang-loader")
const path = require('path');

const CopyFiles = [
    'src/assets/**/*'
];

const WatchFiles = [
    'src/**/*.ts',
];

const OutDir = './build'

Gulp.task('compile', () =>
{
    return Project.src()
        .pipe(Project()).js
        .pipe(Gulp.dest(OutDir));
});

Gulp.task('copy', () =>
{
    return Gulp.src(CopyFiles, {base: 'src'})
        .pipe(Gulp.dest(OutDir));
});

Gulp.task('clean', () =>
{
    return Gulp.src(OutDir, {read: false})
        .pipe(Clean());
});

Gulp.task('webpack', () =>
{
    return Gulp.src(OutDir + '/index.js')
        .pipe(WebpackStream(
        {
            target: 'node',
            output:
            {
                filename: 'server.js',
                libraryTarget: 'commonjs2'
            },
            plugins:
            [
                new Webpack.DefinePlugin({"process.env": {"NODE_ENV": JSON.stringify("production")}}),
                new Webpack.DefinePlugin({'global.GENTLY': false}),
            ],
            module: {
                rules:
                [
                    // in every mqtt.js file contains '#!'
                    {
                        test: /\.js$/,
                        include: [path.resolve(__dirname, 'node_modules/mqtt/')],
                        use: 'shebang-loader',
                    }
                ]
            }
        }, Webpack))
        .pipe(Gulp.dest(OutDir));
});

Gulp.task('minify', (cb) =>
{
    return Gulp.src(OutDir + '/server.js')
        .pipe(Minify({mangle: false}))
        .pipe(Gulp.dest(OutDir));
});

Gulp.task('build', (cb) =>
{
    return RunSequence('clean', 'compile', 'copy', 'webpack', 'minify');
    cb();
});

Gulp.task('serve', ['compile'], () =>
{
    return NodeMonitor({
        script: OutDir + '/index.js',
        ext: 'ts',
        env: {'NODE_ENV': 'development'},
        delay: '1000',
        ignore: [OutDir + '/assets/*']
    });
});

Gulp.task('default', ['compile', 'copy', 'serve'], () =>
{
    var DelayTimerId = undefined;
    Gulp.watch(WatchFiles, () =>
    {
        if (! DelayTimerId)
        {
            DelayTimerId = setTimeout(() =>
            {
                Gulp.start('compile');
                DelayTimerId = undefined;
            }, 500)
        }
    });

    Gulp.watch(CopyFiles, () =>
    {
        Gulp.start('copy');
        DelayTimerId = undefined;
    });
});
