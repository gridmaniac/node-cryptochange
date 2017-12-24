const gulp = require('gulp'),
      clean = require('gulp-clean')

const browserify = require('browserify'),
      babelify = require('babelify')

const source = require('vinyl-source-stream'),
      buffer = require('vinyl-buffer'),
      merge = require('gulp-merge')

const uglify = require('gulp-uglify'),
      concat = require('gulp-concat'),
      sourcemaps = require('gulp-sourcemaps')

const sass = require('gulp-sass'),
      csso = require('gulp-csso'),
      gcmq = require('gulp-group-css-media-queries')
      prefix = require('gulp-autoprefixer')

const imagemin = require('gulp-imagemin'),
      spritesmith = require('gulp.spritesmith')

const mainBowerFiles = require('main-bower-files'),
      browserSync = require('browser-sync'),
      gulpSequence = require('gulp-sequence')

const SRC = './app/src',
      VIEWS = './app/views'
      PRODUCTION = './app/public'
const BROWSERS = [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
]

gulp.task('bower-css', () => {
    return gulp.src(mainBowerFiles('**/*.css'))
        .pipe(concat('bundle.css'))
        .pipe(gulp.dest(`${PRODUCTION}/css`))
})

gulp.task('bower-js', () => {
    return gulp.src(mainBowerFiles('**/*.js'))
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(gulp.dest(`${PRODUCTION}/js`))
})

gulp.task('sass', () => {
    return gulp.src(`${SRC}/scss/app.scss`)
        .pipe(sass())
        .pipe(prefix(BROWSERS))
        .pipe(gcmq())
        .pipe(csso())
        .pipe(gulp.dest(`${PRODUCTION}/css`))
})

gulp.task('js', () => {
    var bundler = browserify({
        entries: [`${SRC}/js/app.js`],
        debug: true
    })

    var bundle = () => {
        return bundler
            .transform('babelify', {presets: ['es2015']})
            .bundle()
            .pipe(source('app.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(`${PRODUCTION}/js`))
    }
    return bundle()
})

gulp.task('sprites', (cb) => {
    const spriteData = gulp.src(`${SRC}/sprites/*.*`)
        .pipe(spritesmith({
            imgName: 'sprites.png',
            cssName: 'sprites.css',
            imgPath: '../assets/sprites.png'
        }))

    const imgStream = spriteData.img
        .pipe(buffer())
        .pipe(imagemin({
            optimizationLevel: 3, 
            progressive: true, 
            interlaced: true
        }))
        .pipe(gulp.dest(PRODUCTION + '/assets'))

    const cssStream = spriteData.css
        .pipe(gulp.dest(`${SRC}/scss/run-up`))

    cssStream.on('end', () => {
        cb()
    })
    
    return merge(imgStream, cssStream)
})

gulp.task('sync', () => {
    browserSync.init(null, {
        proxy: "http://localhost:3000",
        port: 7000,
        open: false,
        browser: "chrome",
        files: [`${PRODUCTION}/**/*.*`, `${VIEWS}/**/*.pug`],
        reloadDelay: 2000,
    })
})

gulp.task('sprites-sass', gulpSequence('sprites', 'sass'))

gulp.task('watch', () => {
    gulp.watch(`${SRC}/scss/**/*.scss`, {cwd:'./'}, ['sass'])
    gulp.watch(`${SRC}/js/**/*.js`, {cwd:'./'}, ['js'])
    gulp.watch(`${SRC}/assets/**/*.*`, {cwd:'./'}, ['copy-assets'])
    gulp.watch(`${SRC}/sprites/*.*`, {cwd:'./'}, ['sprites-sass'])
})

gulp.task('copy-assets', () => {
    return gulp.src(`${SRC}/assets/**/*.*`)
        .pipe(gulp.dest(`${PRODUCTION}/assets`))
})

gulp.task('clean', () => {
    return gulp.src(PRODUCTION, { read: false })
        .pipe(clean())
})

gulp.task('bower', ['bower-css', 'bower-js'])
gulp.task('build', gulpSequence('clean', 'sprites', 'sass', 'js', 'copy-assets', 'bower'))

gulp.task('default', gulpSequence('build', 'watch', 'sync'))
