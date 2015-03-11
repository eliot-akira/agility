
// ----- Define assets -----

var config = {},
    assets = [];

config.ignoreFiles = '!{**/_*,**/_*/**}'; // Exclude everything starting with _


assets = [
  {
    slug : 'wp-agility',
    folder : './',
    css : false,
    js : true,
    image : false
  }
];

config.assets = [];

assets.forEach(function( asset ){

  if ( asset.css ) {
    asset.cssSlug = asset.cssSlug || asset.slug;
    asset.cssSource = asset.folder+'css/src/'; // style.css
    asset.cssDest = asset.folder+'css/';
    asset.cssFiles = [
        asset.cssDest+'lib/**/*.css',
        asset.cssDest+'common/**/*.css',
        asset.cssSource+'style.css', // Compiled Sass
        // asset.cssDest+asset.slug+'.css', // ??
        config.ignoreFiles
    ];
    asset.cssWatch = [
        asset.cssSource+'**/**/*',
        asset.cssDest+'lib/**/**/*',
        asset.cssDest+'common/**/**/*',
        '!'+asset.folder+'css/src/style.css' // Compiled Sass
        // config.ignoreFiles - watch Sass partials
    ]
  }

  if ( asset.js ) {
    asset.jsSlug = asset.jsSlug || asset.slug;
    asset.jsSource = asset.folder+'js/src/';
    asset.jsDest = asset.folder+'js/';
    asset.jsFiles = [
        asset.jsDest+'lib/**/*.js',
        asset.jsDest+'common/**/*.js',
        asset.jsDest+asset.jsSlug+'.js', // Browserified
        config.ignoreFiles
    ];
    asset.jsWatch = [
        asset.jsSource+'**/*.js',
        asset.jsDest+'lib/**/*.js',
        asset.jsDest+'common/**/*.js',
        config.ignoreFiles
    ]
  }

  if ( asset.image ) {
    asset.imageSource = asset.folder+'images/src/';
    asset.imageDest = asset.folder+'images/build/';
    asset.imageFiles = [
        asset.imageSource+'**/**/*',
        config.ignoreFiles
    ];
    asset.imageWatch = asset.imageFiles;
  }

  config.assets.push(asset);
});

module.exports = config;
