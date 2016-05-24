# atom-maven package

Maven integration for atom!

Generates a .classpath file based on your maven pom file.

## Features
- Automatically discovers your Maven settings and locates your local repository.
- When the package starts up, it will find every pom file in the working directory and configure the classpath for that module based on the dependencies in your pom.
- Java classpath is configured via a module specific .classpath file.
- Capable of detecting when your pom files change and updating your classpath accordingly.
- On screen warning messages when you enter maven dependencies which do not exist or can not be resolved in your local repo.
- Recursively searches &lt;parent&gt; to resolve version numbers from your &lt;dependencyManagement&gt;.
- Recursively searches &lt;parent&gt; to resolve property placeholders from user defined &lt;properties&gt;.
- Dependencies defined in parents of your pom files are identified and added to the classpath.
- Transitive dependencies are identified and added to the classpath.

![atom-maven](https://cloud.githubusercontent.com/assets/12021575/15276879/4429112e-1aec-11e6-8bbe-c24901b3ee17.JPG)

## In Progress
- Implement [dependency mediation](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html#Transitive_Dependencies) for transitive dependencies.

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

## Known Issues
- Dependency mediation hasn't yet been implemented, so you may find you have the wrong versions of dependencies on your classpath.  

## Backlog and Issues
The complete list of features which needs to be implemented, future enhancements, known issues and bugs can be found on the GitHub repository [here](https://github.com/concon121/atom-maven/issues).

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
