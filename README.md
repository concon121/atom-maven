# atom-maven package

Maven integration for atom!

Generates a .classpath file based on your maven pom file.

## Features
- Automatically discovers your Maven settings and locates your local repository.
- When the package starts up, it will find every pom file in the working directory and configure the classpath for that module based on the dependencies in your pom.
- Java classpath is configured via a module specific .classpath file.
- Capable of detecting when your pom files change and updating your classpath accordingly.
- On screen warning messages when you enter maven dependencies which do not exist or can not be resolved in your local repo.
- Resolves version numbers dependency management and recursively searches <parent>.
- Resolves property placeholders from user defined <properties> and recursively searches <parent>.

## To Do
- Parental dependencies should be identified and added to the classpath.
- Transitive dependencies should be identified and added to the classpath.
- If a dependency is identified as not existing in the local repository, then use maven to build the project so an attempt is made to download the dependency from the remote repository before showing the user that there is an error.

![atom-maven](https://cloud.githubusercontent.com/assets/12021575/15276879/4429112e-1aec-11e6-8bbe-c24901b3ee17.JPG)

## To be used with

* [autocomplete-java](https://atom.io/packages/autocomplete-java)
* [linter-javac](https://atom.io/packages/linter-javac)

### autocomplete-java
Capable of reading the generated .classpath file, this package provides functionlity to organise imports, complete packages and classes, examine methods etc...

Note. git ignored .classpath files are not discovered.

### linter-javac
Capable of reading the generated .classpath file, this package will attempt to compile your .java files and show you all the compile time problems with your code.

## Kudos
Kudos to the following, for making my life easier!

* [atom-message-panel](https://github.com/tcarlsen/atom-message-panel)
