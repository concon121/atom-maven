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
- Automatically discovers your Maven settings and locates your local repository.
- When the package starts up, it will find every pom file in the working directory and configure the classpath for that module based on the dependencies in your pom.
- Java classpath is configured via a module specific .classpath file.
- Capable of detecting when your pom files change and updating your classpath accordingly.
- On screen warning messages when you enter maven dependencies which do not exist or can not be resolved in your local repo.
- Capable of resolving dependency information from dependency management structures within the parental hierarchy.
- Capable of resolving property placeholders from properties defined within the parental hierarchy, and getting the value of properties defined as environment variables.
- Dependencies defined within the parental hierarchy of your pom files are identified and added to the classpath.
- Transitive dependencies are identified and added to the classpath.
- Implemented [dependency mediation](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html#Transitive_Dependencies) to ensure that the dependency versions you specify in your pom files take precedence over dependency versions being inherited transitively.

![310516](https://cloud.githubusercontent.com/assets/12021575/15692408/12018824-2786-11e6-8cac-289fd0af4076.JPG)

## In Progress
- Work on technical debt.

## To Do
- If a dependency is identified as not existing in the local repository, then use maven to build the project so an attempt is made to download the dependency from the remote repository before showing the user that there is an error.
- Present an on screen warning for duplicate dependency definitions.
- When a parent pom changes, notify the parents children and re-render the ui errors (if any).
- When a dependency changes, notify its dependants and re-render the ui errors (if any).
- Identify when a new pom file is added into the workspace and bind the change event to it.
- Support for system scoped dependencies.
- Support for import scoped dependencies.
- Support for dependency exclusions.
- Support for optional dependencies.
- Support for properties defined in the users settings.xml file.

## Known Issues
- "Unclosed root tag" error message in the console.  An intermittent problem which is being caused because another package I'm using to format my files on save is modifying the file as atom-maven is trying to read from it.  This seems to only happen when I add comments to my pom files.
- The message panel is a little bit jumpy while atom-maven is loading the classpath.
- Maven installation is not found if it has been put on the PATH under another environment variable e.g. export PATH = $PATH:$M2_HOME.
- If Maven installation is not found, atom-maven still tries to load the poms and resolve the classpath.  This is an issue as it will likely attempt to read files which dont exist.

## Backlog and Issues
The complete list of features which needs to be implemented, future enhancements, known issues and bugs can be found on the GitHub repository [here](https://github.com/concon121/atom-maven/issues).

## Contributing
Contributions are always welcome, there is still a lot of work to be done!  Feel free to pick up an issue in the backlog and open a pull request to get the conversation going.  I am more than happy to provide help and direction, and very welcoming of advice and suggestions.

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
