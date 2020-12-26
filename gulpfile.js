const {src, dest, watch, parallel, series} = require('gulp'); // здесь ключевые слова для плагинов gulp
const scss = require('gulp-sass');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const concat = require('gulp-concat');
const del = require('del');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create(); // только для browserSync
const svgSprite = require('gulp-svg-sprite');

function browsersync(){ // теперь без перезагрузок
    browserSync.init({
        server: {
            baseDir: 'app/' // сервер на котором будут обновляться все данные из папки app
        },
        notify: false
    })
}

function styles() { // функция по переводу scss в css. Все функции потом прописываются в командной строке пример для этой функции gulp styles
    return src('app/scss/style.scss')
    .pipe(scss({outputStyle: 'compressed'})) //конвертация файла scss в css
    .pipe(concat('style.min.css'))// переименование файла css в min.css. Вообще функция concat собирает все файлы воедино.
    .pipe(autoprefixer({
        overrideBrowserslist: ['last 10 versions'], // автопрефиксер выстовляет во всех браузерах нужные вендорные префиксы (для последних 10 браузеров)
        grid: true // для IE
    })) //порядок важен т.к. не могут добавиться префиксы после формирования файла)
    .pipe(dest('app/css')) //переносит файл в папку css 
    .pipe(browserSync.stream()) // добавляет стили без перезагрузки страницы
}

function scripts() { // перевод main.js в main.min.js 
    return src([
        'node_modules/jquery/dist/jquery.js',
        'node_modules/slick-carousel/slick/slick.js',
        'node_modules/mixitup/dist/mixitup.min.js',
        'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.js',
        'app/js/main.js'
    ])
    .pipe(concat('main.min.js')) //объединяет все файлы
    .pipe(uglify()) // сжимает файл
    .pipe(dest('app/js')) // кидает файл в ТУ ЖЕ ПАПКУ
    .pipe(browserSync.stream()) // перезагружает страницу для работы js
}

function images() { //сжимание картинок
    return src ('app/images/**/*.*') //любые картинки любового разрешения
    .pipe(imagemin([
        imagemin.gifsicle({interlaced: true}),
        imagemin.mozjpeg({quality: 75, progressive: true}),
        imagemin.optipng({optimizationLevel: 5}),
        imagemin.svgo({
            plugins: [
               {removeViewBox: true},
               {cleanupIDs: false}
            ]
        })
    ]))
    .pipe(dest('dist/images'))

}

function svgSprites() {
    return src ('app/images/icons/*.svg') // все svg из папки icons
    .pipe(svgSprite({
        mode: {
            stack:{
                sprite: "../sprite.svg"
        }
        }
    }))
    .pipe(dest('app/images'))
}

function build() { // перенос в папку dist
    return src ([
        'app/**/*.html',
        'app/css/style.min.css',
        'app/js/main.min.js'
    ], {base:'app'}) //перенос по папкам
    .pipe(dest('dist'))
}

function cleanDist() {
    return del('dist')
}

function watching() { // чтобы не писать gulp styles каждый раз. Следит за изменениями в файлах(в папке scss пока что и т.д.)
    watch(['app/scss/**/*.scss'], styles); // просматривает все файлы в папке scss и выполняет функцию styles
    watch(['app/js/**/*.js','!app/js/main.min.js'], scripts); //все файлы кроме main.min.js т.к. main.min.js не должен меняться
    watch(['app/**/*.html']).on('change', browserSync.reload);
    watch(['app/images/icons/*.svg'], svgSprite);
}

// функция watching работает только пока идет выполнение, если нажать Ctrl + C то работать уже не будет, поэтому нужно выполнять ее параллельно с функцией browsersync

exports.styles = styles; // возможность для работы функции
exports.scripts = scripts;
exports.browsersync = browsersync;
exports.watching = watching;
exports.cleanDist = cleanDist;
exports.images = images;
exports.build = series(cleanDist, images, build); // запуск по очереди
exports.default = parallel(styles, scripts, svgSprites, watching, browsersync); // по дефолту(то есть можно ввести только gulp) параллельно выполняет все команды