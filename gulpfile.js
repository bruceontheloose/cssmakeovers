var fs = require('fs');
var gulp = require('gulp');
var replace = require('gulp-replace');  // search and replace contents of a file

const siteUrl = 'https://www.cssmakeovers.com';
const baseRoot = '../cssmakeovers';
const basePath = `${baseRoot}/deploy`;

// Meta data
const pagesInfoAll = require(`${baseRoot}/src/content/pages-info.json`);
const pagesInfo = pagesInfoAll.filter(info => info.publish === true);


/* ------- COPY IMAGES ------- */
// * the ! marks files to skip
// * base specifies folder levels to omit from the created dest folders. in this case, dest folders begin with /patterns/ and /sites/ instead of /deploy/patterns/ and /deploy/sites/.
// * learn more: https://stackoverflow.com/questions/35845039/how-base-option-affects-gulp-src-gulp-dest
gulp.task('copy-imgs', function() {
  gulp.src([
    `${basePath}/patterns/**/img/*.*`, 
    `${basePath}/sites/**/img/*.*`, 
    `!${basePath}/patterns/**/img/fig-*.*`, 
    `!${basePath}/sites/**/img/fig-*.*`,
    `!${basePath}/patterns/**/img/z_*.*`, 
    `!${basePath}/sites/**/img/z_*.*`],
    { base: `${basePath}/` })
  .pipe(gulp.dest('./'));
});


/* ------- COPY CSS ------- */
// Use this instead if want to move the files into the individual pattern and site directories instead of /css/:
//   { base: `${basePath}/css/`}
gulp.task('copy-css', function() {
  gulp.src([
    `${basePath}/css/standalone.css`,
    `${basePath}/css/patterns/**/*.css`, 
    `${basePath}/css/sites/**/*.css`
    ],
    { base: `${basePath}/` })
  .pipe(gulp.dest('./'));
});


/* ------- COPY PAGES AND REPLACE HTML ------- */
gulp.task('copy-replace-html', function() {
  const htmlFilesToCopy = [];

  for (const page of pagesInfo) {
    htmlFilesToCopy.push(`${basePath}/${page.type}s/${page.folderName}/standalone.html`);
  }

  gulp.src(htmlFilesToCopy, { base: '../cssmakeovers/deploy/'})
    .pipe(replace('<link rel="stylesheet" href="/css/standalone.css">', '<link rel="stylesheet" href="../../css/standalone.css">'))
    .pipe(replace('<script async="" src="https://www.googletagmanager.com/gtag/js?id=UA-125025519-2"></script>', ''))
    .pipe(replace('<script>function gtag(){dataLayer.push(arguments)}window.dataLayer=window.dataLayer||[],gtag("js",new Date),gtag("config","UA-125025519-2");</script>', ''))
    .pipe(replace(`



</body>
</html>`, `
</body>
</html>`))
    .pipe(gulp.dest('./'));
});


/* ------- CREATE README FILES ------- */
// Sort array of objects based on key
// Modified from https://stackoverflow.com/questions/16648076/sort-array-on-key-value
function sortOn(arr, key) {
  var sorted = arr;

  sorted.sort(function(a, b){
    if (a[key] < b[key]) {
      return -1;
    } else if (a[key] > b[key]) {
      return 1;
    }
    
    return 0;
  });

  return sorted;
}

/**
 * Create main README.md for the repo
 */
gulp.task('create-repo-readme', function(cb) {
  const intro = fs.readFileSync('./src/readme-intro.md');
  const sortedPagesInfo = sortOn(pagesInfo, 'title'); // alphabetize them by title
  const markdown = {};
  markdown.patterns = [];
  markdown.sites = [];

  // Create MD list item for each pattern or site
  for (const page of sortedPagesInfo) {
    markdown[`${page.type}s`].push(`* [${page.title}](${siteUrl}/${page.type}s/${page.folderName}/)`);
  }

  // Create full MD content
  const content = `${intro}

## Patterns
Links to their pages on the site:
${markdown.patterns.join("\n")}

## Sites
Links to their pages on the site:
${markdown.sites.join("\n")}
`;

  // Create README file
  fs.writeFileSync('./README.md', content, cb);
});


/**
 * Create README.md for each pattern and site
 */
gulp.task('create-patterns-sites-readmes', function(cb) {
  for (const page of pagesInfo) {
    const content = `# CSS Makeovers: ${page.title}

* [View page with explanation](${siteUrl}/${page.type}s/${page.folderName}/)
* [View standalone page](${siteUrl}/${page.type}s/${page.folderName}/standalone.html)
`;

    // create README file
    fs.writeFileSync(`./${page.type}s/${page.folderName}/README.md`, content, cb);
  }
});


// ---------------------
// --- Run the tasks ---
// ---------------------
gulp.task('default', ['copy-imgs', 'copy-css', 'copy-replace-html', 'create-repo-readme', 'create-patterns-sites-readmes']);
