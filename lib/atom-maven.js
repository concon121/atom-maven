'use babel';
'use strict';
const common = require('./common');
const fs = require('fs');
const ui = require('./ui-utils');
const mvn = require('./maven-utils');
const pomUtils = require('./pom-utils');
const fileUtils = require('./file-utils');
const Maven = require('node-maven-api');
const watch = require('node-watch');

const CONFIGURING_CLASSPATH_MSG = 'atom-maven is configuring your classpath';
const BUILDING_PROJECT = 'atom-maven is building your project: ';
const FINISHED_BUILDING = 'atom-maven has finished configuring the classpath for project: ';
const INVALID_DEPENDENCY = 'Dependency not found.';
const BUILD_FAILED = 'build failed!';
const CLEAN_FAILED = 'clean failed!'

module.exports = {

  config: {
    classpathFileName: {
      type: 'string',
      default: '.classpath'
    }
  },

  classpathFileName: atom.config.get('atom-maven.classpathFileName'),

  activate: function () {
    const self = this;
    self.setup();
    atom.config.observe('atom-maven.classpathFileName', {}, () => {
      self.classpathFileName = atom.config.get('atom-maven.classpathFileName');
    });
  },

  setup: function () {
    var self = this;

    atom.workspace.scan(/<project.*/g, (match) => {
      if (match.filePath.endsWith('pom.xml')) {

        ui.info(CONFIGURING_CLASSPATH_MSG);

        var maven = Maven.create(match.filePath);
        var lastPom = null;

        var buildFailed = function () {
          if (lastPom && pomUtils.hasDependencies(lastPom)) {
            var notExistsCallback = function (err, dependency) {
              if (err) {
                console.error(err);
              } else {
                var pre = '<dependency>\n';
                pre = pre + '\t<groupId>' + dependency.groupId + '</groupId>\n';
                pre = pre + '\t<artifactId>' + dependency.artifactId + '</artifactId>\n';
                pre = pre + '\t<version>' + dependency.version + '</version>\n';
                pre += '</dependency>';
                ui.error(INVALID_DEPENDENCY, null, null, match.filePath, pre);
              }
            };
            for (var dependency of lastPom.project.dependencies.dependency) {
              var location = pomUtils.getDependencyRepoLocation(dependency, 'jar');
              fileUtils.fileExists(location, notExistsCallback, dependency);
            }
          }
        };

        maven.registerEvent('clean', () => {
          console.log('clean called');
          maven.install();
        });
        maven.registerEvent('clean-failed', () => {
          ui.error(CLEAN_FAILED + match.filePath, null, null, match.filePath, null);
          buildFailed();
        });
        maven.registerEvent('install', () => {
          ui.success(FINISHED_BUILDING + match.filePath);
        });
        maven.registerEvent('install-failed', () => {
          ui.error(BUILD_FAILED + match.filePath, null, null, match.filePath, null);
          buildFailed();
        });
        maven.registerEvent('effective-pom', (pom) => {
          lastPom = pom;
          var cp = self.getClasspath(match.filePath);
          self.writeClasspath(cp, pom, self);
          ui.clearFileMessages(match.filePath);
          ui.info(BUILDING_PROJECT + match.filePath);
          maven.clean();
        });

        var updateClasspath = function () {
          maven.effectivePom(self.getEffectivePom(match.filePath));
        };
        updateClasspath();
        watch(match.filePath, (evt, name) => {
          if (evt === 'remove') {
            console.log('Delete operation not yet implemented.')
            // file has been deleted
          }
          if (evt === 'update') {
            ui.info('File changed: ' + name);
            ui.info(CONFIGURING_CLASSPATH_MSG);
            updateClasspath();
          }
        });
      }
    });

    setInterval(() => {
      ui.clearText(['info', 'success']);
    }, 2e4);
  },

  writeClasspath: function (cp, pom, self) {
    var locations = self.initLocations() + self.getClasspathFromDependencies(pom, self);
    fs.writeFile(cp, locations, (err) => {
      if (err) {
        ui.error(err);
      }
    });
  },

  getClasspath: function (pomPath) {
    return pomPath.replace('pom.xml', this.classpathFileName);
  },

  getEffectivePom: function (pomPath) {
    return pomPath.replace('pom.xml', 'effective.pom');
  },

  initLocations: function () {
    return '.' + common.fileSeparator + 'target' + common.fileSeparator + 'classes;';
  },

  getClasspathFromDependencies: function (pom) {
    var locations = '';
    if (pomUtils.hasDependencies(pom)) {
      for (var dependency of pom.project.dependencies.dependency) {
        var dependencyRepoLocation = pomUtils.getDependencyRepoLocation(dependency);
        locations = locations + dependencyRepoLocation + ';';
      }
    }
    return locations;
  },

  displayDependencyError: function (classpathElement) {
    var xml = classpathElement.xml;
    var dependency = classpathElement.dependency;
    var file = classpathElement.file;

    var tomatch = '(' + dependency.groupId + '[\\s\\S]*' + dependency.artifactId + ')|(' + dependency.artifactId + '[\\s\\S]*' + dependency.groupId + ')';
    var result = new RegExp(tomatch, 'g').exec(xml);
    var substr = (result) ? xml.substr(0, result.index) : null;
    var lineNo = (substr) ? substr.match(/\n/g).length + 1 : 0;
    var message = mvn.getDependencyNotFoundMessage(dependency);
    var preview = '<dependency>\n\t<groupId>' + dependency.groupId + '</groupId>\n\t<artifactId>' + dependency.artifactId + '</artifactId>\n\t<version>' + dependency.version + '</version>\n</dependency>';

    ui.error(message, lineNo, 0, file, preview);
  }

};
