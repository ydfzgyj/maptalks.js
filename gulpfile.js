'use strict';

var minimist = require('minimist'),
    path = require('path'),
    gulp = require('gulp'),
    babelrc = require('babelrc-rollup').default,
    rollup = require('rollup').rollup,
    commonjs = require('rollup-plugin-commonjs'),
    nodeResolve = require('rollup-plugin-node-resolve'),
    babel = require('rollup-plugin-babel'),
    alias = require('rollup-plugin-alias'),
    concat = require('gulp-concat'),
    cssnano = require('gulp-cssnano'),
    connect = require('gulp-connect'),
    version = require('./package.json').version;
var Server = require('karma').Server;

const banner =
  '/*!\n' +
  ' * maptalks.js v' + version + '\n' +
  ' * (c) 2016 MapTalks\n' +
  ' */';

var knownOptions = {
    string: ['browsers', 'pattern'],
    boolean: 'coverage',
    alias: {
        'coverage': 'cov'
    },
    default: {
        browsers: 'PhantomJS',
        coverage: false
    }
};

var options = minimist(process.argv.slice(2), knownOptions);

var browsers = options.browsers.split(',');
browsers = browsers.map(function (name) {
    var lname = name.toLowerCase();
    if (lname.indexOf('phantom') === 0) {
        return 'PhantomJS';
    }
    if (lname[0] === 'i') {
        return 'IE' + lname.substr(2);
    } else {
        return lname[0].toUpperCase() + lname.substr(1);
    }
});

var stylesPattern = './assets/css/**/*.css';

// TODO: minify
gulp.task('scripts', function () {
    return rollup({
        entry: 'src/maptalks.js',
        plugins: [
            nodeResolve({
                jsnext: true,
                main: true,
                browser: true
            }),
            commonjs(),
            babel(babelrc()),
            alias(require('./build/alias'))
        ]
    }).then(function (bundle) {
        return bundle.write({
            format: 'iife',
            moduleName: 'maptalks',
            banner: banner,
            dest: 'dist/maptalks.js'
        });
    });
});

gulp.task('styles', function () {
    return gulp.src(stylesPattern)
        .pipe(concat('maptalks.css'))
        .pipe(cssnano())
        .pipe(gulp.dest('./dist/'));
});

gulp.task('images', function () {
    return gulp.src('./assets/images/**/*')
        .pipe(gulp.dest('./dist/images'));
});

gulp.task('build', ['scripts', 'styles', 'images'], function () {});

gulp.task('watch', ['build'], function () {
    gulp.watch(['src/**/*.js', './gulpfile.js'], ['reload']); // watch the same files in our scripts task
    gulp.watch(stylesPattern, ['styles']);
});

/**
 * Run test once and exit
 */
gulp.task('test', ['build'], function (done) {
    var karmaConfig = {
        configFile: path.join(__dirname, 'build/karma.unit.config.js'),
        browsers: browsers
    };
    if (options.coverage) {
        karmaConfig.configFile = path.join(__dirname, 'build/karma.cover.config.js');
    }
    if (options.pattern) {
        karmaConfig.client = {
            mocha: {
                grep: options.pattern
            }
        };
    }
    new Server(karmaConfig, done).start();
});

/**
 * Watch for file changes and re-run tests on each change
 */
gulp.task('tdd', function (done) {
    var karmaConfig = {
        configFile: path.join(__dirname, 'build/karma.dev.config.js')
    };
    if (options.pattern) {
        karmaConfig.client = {
            mocha: {
                grep: options.pattern
            }
        };
    }
    new Server(karmaConfig, done).start();
});

gulp.task('connect', ['watch'], function () {
    connect.server({
        root: 'dist',
        livereload: true,
        port: 20000
    });
});

gulp.task('reload', ['scripts'], function () {
    gulp.src('./dist/*.js')
        .pipe(connect.reload());
});

gulp.task('doc', function () {
});

gulp.task('default', ['connect']);
