var gulp = require('gulp');
var runSequence = require('run-sequence');
var conventionalChangelog = require('gulp-conventional-changelog');
var conventionalGithubReleaser = require('conventional-github-releaser');
var bump = require('gulp-bump');
var gutil = require('gulp-util');
var git = require('gulp-git');
var fs = require('fs');
var uglify = require('gulp-uglify');
var mocha = require('gulp-mocha');
var rename = require('gulp-rename');
var uglifycss = require('gulp-uglifycss');
var gulpif = require('gulp-if');

gulp.task('test', function () {
	return gulp.src('test.js', {read: false})
		// gulp-mocha needs filepaths so you can't have any plugins before it
		.pipe(mocha({reporter: 'nyan'}));
});

gulp.task('changelog', function () {
  return gulp.src('CHANGELOG.md', {
    buffer: false
  })
    .pipe(conventionalChangelog({
      preset: 'angular' // Or to any other commit message convention you use.
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('github-release', function(done) {

	if(process.argv.length == 3)	if(process.argv[2].indexOf("--nogit") > -1)	return;
  conventionalGithubReleaser({
    type: "oauth",
    token: JSON.parse(fs.readFileSync('./config/data.json', 'utf8')).github // change this to your own GitHub token or use an environment variable
  }, {
    preset: 'automated upload with gulp' // Or to any other commit message convention you use.
  }, done);
});

gulp.task('bump-version', function () {
// We hardcode the version change type to 'patch' but it may be a good idea to
// use minimist (https://www.npmjs.com/package/minimist) to determine with a
// command argument whether you are doing a 'major', 'minor' or a 'patch' change.

	if(process.argv.length == 3)	if(process.argv[2].indexOf("--nogit") > -1)	return;
  return gulp.src(['./package.json'])
    .pipe(bump({type: "patch"}).on('error', gutil.log))
    .pipe(gulp.dest('./'));
});

gulp.task('commit-changes', function () {

	if(process.argv.length == 3)	if(process.argv[2].indexOf("--nogit") > -1)	return;
	return gulp.src('.')
    .pipe(git.add())
    .pipe(git.commit('[Prerelease] Bumped version number'));
});

gulp.task('push-changes', function (cb) {

	if(process.argv.length == 3)	if(process.argv[2].indexOf("--nogit") > -1)	return;
	git.push('github', 'master', cb);
});

gulp.task('create-new-tag', function (cb) {

	if(process.argv.length == 3)	if(process.argv[2].indexOf("--nogit") > -1)	return;
	var version = getPackageJsonVersion();
  git.tag(version, 'Created Tag for version: ' + version, function (error) {
    if (error) {
      return cb(error);
    }
    git.push('origin', 'master', {args: '--tags'}, cb);
  });

  function getPackageJsonVersion () {
    // We parse the json file instead of using require because require caches
    // multiple calls so the version number won't be updated
    return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
  };
});

gulp.task('default', function (callback) {
  runSequence(
    //'test',
//    'compress-controllers',
//    'compress-javascripts',
//		'export-files-not-valid',
//		'compress-css',
    'bump-version',
    'changelog',
    'commit-changes',
    'push-changes',
//    'create-new-tag',
    'github-release',
    function (error) {
      if (error) {
        console.log(error.message);
      } else {
        console.log('RELEASE FINISHED SUCCESSFULLY');
      }
      callback(error);
    });
});
