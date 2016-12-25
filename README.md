# atom-maven package

[![Build Status](https://api.travis-ci.org/concon121/atom-maven.png)](https://api.travis-ci.org/concon121/atom-maven)
[![Dependency Status](https://david-dm.org/concon121/atom-maven.svg)](https://david-dm.org/concon121/atom-maven)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/9b9b60c42152461a9ec4e29d84848b01)](https://www.codacy.com/app/connor-bray/atom-maven?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=concon121/atom-maven&amp;utm_campaign=Badge_Grade)
[![Code Climate](https://codeclimate.com/github/concon121/atom-maven/badges/gpa.svg)](https://codeclimate.com/github/concon121/atom-maven)
[![Issue Count](https://codeclimate.com/github/concon121/atom-maven/badges/issue_count.svg)](https://codeclimate.com/github/concon121/atom-maven)
[![Test Coverage](https://codeclimate.com/github/concon121/atom-maven/badges/coverage.svg)](https://codeclimate.com/github/concon121/atom-maven/coverage)
[![Downloads](https://img.shields.io/apm/dm/atom-maven.svg?maxAge=2592000)](https://atom.io/packages/atom-maven)

Maven integration for atom!

Generates module specific .classpath files based on the Maven pom files in your Atom workspace.

## Features

| Feature | Status |
| :------ | :-----: |
| Configures the classpath for every Maven module in your workspace. | :white_check_mark: |
| Automatically update the classpath when you update your pom files. | :white_check_mark: |
| Build the Maven projects in the workspace on save. | :white_check_mark: |
| Build the Maven project via user interaction with the UI. | :x: |
| Notification when your classpath has been configured. | :white_check_mark: |
| Notification when a duplicate dependency definition has been identified. | :x: |
| Notification when a dependency does not exist. | :white_check_mark: |
| Link to the location of erroneous dependencies. | :o: |
| Identify when a new pom file is added into the workspace and bind the change event to it. | :x: |


![310516](https://cloud.githubusercontent.com/assets/12021575/15692408/12018824-2786-11e6-8cac-289fd0af4076.JPG)


## Known Issues
- The notification which informs you that a dependency doesn't exist always points to line 0.

## Configuration  
Currently no configuration is required for this package.  Please ensure that Apache Maven is correctly installed on your computer and is ready to use on the command line.

Please see the Maven website for [installation instructions](http://maven.apache.org/install.html).

## What's new in version 1.0.0
The atom-maven package is a lot lazier in the new release, relying on your Maven installation to do all the hard work, rather than trying to replicate everything that Maven does.  In doing this, a lot of the features I wanted to implement I got for free.  

Checkout the [changelog](https://github.com/concon121/atom-maven/blob/master/CHANGELOG.md) for the full list of recently implemented features and bug fixes.

## Backlog and Issues
The complete list of features which needs to be implemented, future enhancements, known issues and bugs can be found on the atom-maven GitHub repository [issues page](https://github.com/concon121/atom-maven/issues).

## Contributing
Contributions are always welcome, there is still a lot of work to be done!  Feel free to pick up an issue in the backlog and open a pull request to get the conversation going.  I am more than happy to provide help and direction, and very welcoming of advice and suggestions.

## Raising Issues

If atom-maven is not resolving your classpath correctly, it is really useful for debugging purposes if you could provide sample pom files which I can use to reproduce your issue.

## What can I use atom-maven for?

I started developing atom-maven as I wanted to be able to write my Java code in Atom.  There are a couple of packages I found which make this easier, but they depend on a .classpath file being configured.  As a user of Maven, Maven configures your classpath and makes sure all your dependencies are available when you need them to be.  The atom-maven package replicates this functionality and generates the .classpath file other Atom Java packages need, based on your Maven pom files!   

### Useful Java Packages

* [autocomplete-java](https://atom.io/packages/autocomplete-java)
* [linter-javac](https://atom.io/packages/linter-javac)

#### autocomplete-java
Capable of reading the generated .classpath file, this package provides functionlity to organise imports, complete packages and classes, examine methods etc...

Note. git ignored .classpath files are not discovered.

#### linter-javac
Capable of reading the generated .classpath file, this package will attempt to compile your .java files and show you all the compile time problems with your code.

## Kudos
Kudos to the following, for making my life easier!

* [node-maven-api](https://www.npmjs.com/package/node-maven-api)
* [atom-message-panel](https://github.com/tcarlsen/atom-message-panel)
* [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js)
