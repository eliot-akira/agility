
// ----- Define assets -----

var config = {},
    assets = [];

config.ignoreFiles = '!{**/_*,**/_*/**}'; // Exclude everything starting with _


assets = [
  {
    slug : 'agility',
    folder : './',
    js : true,
  }
];

config.assets = [];

assets.forEach(function( asset ){

  if ( asset.js ) {
    asset.jsSlug = asset.jsSlug || asset.slug;
    asset.jsSource = asset.folder+'src/';
    asset.jsDest = asset.folder+'build/';
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

  config.assets.push(asset);
});

module.exports = config;
