const gulp = require('gulp');
const del = require('del');
const plumber = require('gulp-plumber');
const replace = require('gulp-replace');
const browserSync = require('browser-sync').create();
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const rename = require('gulp-rename');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const imagemin = require('gulp-imagemin');

const clean = () => del(['./dist']);

const paths = {
    html: {
        src: './src/*.html',
        dest: './dist'
    },
    styles: {
        src: './src/styles/**/*.sass',
        dest: './dist/styles'
    },
    scripts: {
        src: './src/scripts/**/*.js',
        dest: './dist/scripts'
    },
    images: {
        src: './src/images/*',
        dest: './dist/images'
    }
}

// Cache busting to prevent browser caching issues
const curTime = new Date().getTime();
const cacheBust = () =>
    gulp.src(paths.html.src)
        .pipe(plumber())
        .pipe(replace(/cb=\d+/g, 'cb=' + curTime))
        .pipe(gulp.dest(paths.html.dest));


// Copies all html files
const html = () =>
    gulp.src(paths.html.src)
        .pipe(plumber())
        .pipe(gulp.dest(paths.html.dest));

// Convert sass to styles, auto-prefix
const styles = () =>
    gulp.src(paths.styles.src)
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([autoprefixer(), cssnano()]))
        .pipe(
            rename({
                suffix: '.min'
            })
        )
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(browserSync.stream());

// Minify all javascript files and concat them into single file
const scripts = () =>
    gulp.src(paths.scripts.src)
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(
            babel({
                presets: ['@babel/preset-env']
            })
        )
        .pipe(terser())
        .pipe(concat('app.min.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.scripts.dest));

// Copy and optimize images
const images = () =>
    gulp.src(paths.images.src)
        .pipe(plumber())
        .pipe(imagemin())
        .pipe(gulp.dest(paths.images.dest));

// Watches file changes and run necessary tasks
function watchFiles() {
    browserSync.init({
        server: {
            baseDir: './dist'
        },
        notify: false
    });
    gulp.watch(paths.styles.src, styles);
    gulp.watch(paths.scripts.src, scripts).on('change', browserSync.reload);
    gulp.watch(paths.images.src, images).on('change', browserSync.reload);
    gulp.watch('./src/*.html', html).on('change', browserSync.reload);
}

const build = gulp.series(
    clean,
    gulp.parallel(styles, scripts, images),
    cacheBust
);

const watch = gulp.series(build, watchFiles);

exports.watch = watch;
exports.build = build;
exports.default = build;