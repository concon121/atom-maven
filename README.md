# atom-maven package

[![Build Status](https://api.travis-ci.org/concon121/atom-maven.png)](https://api.travis-ci.org/concon121/atom-maven)
[![Dependency Status](https://david-dm.org/concon121/atom-maven.svg)](https://david-dm.org/concon121/atom-maven)
[![Code Climate](https://codeclimate.com/github/concon121/atom-maven/badges/gpa.svg)](https://codeclimate.com/github/concon121/atom-maven)
[![Test Coverage](https://codeclimate.com/github/concon121/atom-maven/badges/coverage.svg)](https://codeclimate.com/github/concon121/atom-maven/coverage)
[![Issue Count](https://codeclimate.com/github/concon121/atom-maven/badges/issue_count.svg)](https://codeclimate.com/github/concon121/atom-maven)
[![Downloads](https://img.shields.io/apm/dm/atom-maven.svg?maxAge=2592000)](https://atom.io/packages/atom-maven)

Maven integration for atom!

Generates a .classpath file based on your maven pom file.

## Features

| Feature | Status |
| :------ | :-----: |
| Automatic discovery of your maven installation and settings. | :white_check_mark: |
| Optional manual configuration of your maven installation. | :white_check_mark: |
| Configures the classpath for every Maven module in your workspace. | :white_check_mark: |
| Automatically update the classpath when you update your pom files. | :white_check_mark: |
| Reads Maven properties. | :white_check_mark: |
| Reads Maven properties referencing environment variables. | :white_check_mark: |
| Reads Maven properties referencing Java properties. | :x: |
| Reads Maven properties defined in the Maven settings file. | :x: |
| Uses Maven properties to resolve property placeholders for Maven versions. | :white_check_mark: |
| Traverses up the parental hierarchy to resolve versions from dependency management. | :white_check_mark: |
| Support for dependency exclusions. | :o: |
| Support for system scoped dependencies. | :x: |
| Support for import scoped dependencies. | :x: |
| Support for optional dependencies. | :white_check_mark: |
| Support for transitive dependencies. | :white_check_mark: |
| Implementation of [dependency mediation](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html#Transitive_Dependencies) to resolve conflicting versions. | :white_check_mark: |
| Build the Maven projects in the workspace. | :x: |
| Notification when your classpath has been configured. | :white_check_mark: |
| Notification when a duplicate dependency definition has been identified. | :x: |
| Notification when a dependency does not exist. | :white_check_mark: |
| Identify when a new pom file is added into the workspace and bind the change event to it. | :x: |


![310516](https://cloud.githubusercontent.com/assets/12021575/15692408/12018824-2786-11e6-8cac-289fd0af4076.JPG)


## Known Issues
- "Unclosed root tag" error message in the console.  An intermittent problem which is being caused because another package I'm using to format my files on save is modifying the file as atom-maven is trying to read from it.  This seems to only happen when I add comments to my pom files.
- The message panel is a little bit jumpy while atom-maven is loading the classpath.

## Configuration  

### Maven Home

A number of uses have commented on the fact that their Maven set up does not rely on the use on environment variables, and putting the Maven bin directory on the PATH.  This means that atom-maven can not automatically discover the location of your Maven installation.

The Maven Home configuration item is an optional override for the automatic discovery of your Maven installation.

#### Examples

```
/tools/apache-maven/version/bin
```
```
C:\ProgramFiles\apache\maven\bin
```
```
/usr/local/Cellar/maven/VERSION/libexec/bin/
```

## Backlog and Issues
The complete list of features which needs to be implemented, future enhancements, known issues and bugs can be found on the GitHub repository [here](https://github.com/concon121/atom-maven/issues).

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

* [atom-message-panel](https://github.com/tcarlsen/atom-message-panel)
* [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js)
