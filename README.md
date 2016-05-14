# atom-maven package

Maven integration for atom!

Generates a .classpath file based on your maven pom file.

## Acceptance Criteria
- [x] Locate the maven repository by reading the settings.xml file. 
  - [x] Attempt to get the localRepository from the user level settings defined in ${user.home}/.m2/settings.xml.
  - [x] Attempt to get the localRepository from the global settings defined in ${maven.home}/conf/settings.xml.
  - [x] If repo is not defined in settings.xml, use the default repository location ${user.home}/.m2/repository.
- [x] Find every pom file in the working directory and configure the classpath for that module.
  - [x] Read the <dependencies> in the pom file and match them to locations in the local maven repository.
  - [x] Output the locations of the dependencies to the module specific .classpath file.
- [ ] Compute classpath for every module in the working directory when Atom starts up.
  - [ ] Remove toggle activation (ctrl + alt + 1) as it shouldn't be required.
- [ ] Be able to detect when the maven pom file changes and update the .classpath file to reflect these changes.
  - [ ] When a pom file is saved, compute the classpath for that module only.
  - [ ] Ensure that classpath is ONLY computed for pom file saves.
- [ ] Build the maven project when the pom changes, to ensure that any new dependencies are present in the local repository.
- [ ] Present a warning on screen if the user enters a maven dependency which does not exist or can not be resolved.
- [ ] Present a warning on screen if maven isn't on the PATH (and likely isn't installed).

## Atom Java EcoSystem

As a Java developer, I have grown to love Eclipse.  The problem I have with it, is that I don't actually use half of the features it provides.  I use git and subversion on the command line, I use maven on the command line, I prefer grep or find to search for things, I prefer sed to find and replace, and I prefer Atom for developing html, javascript, css, python, prolog, bash, and pretty much anything else which isn't Java!  Eclipse is lovely though.  It provides autocompletion and prediction, it tells you what methods are available to you in a particular class, it automatically figures out which classes you should be importing.

Wouldn't it be cool if we could do some of this stuff in Atom!

My quest is to be able to use Atom as a light weight Java IDE, to compliment how I already use Atom and make myself a more efficient developer!

### Plugins in my Atom IDE

* [autocomplete-java](https://atom.io/packages/autocomplete-java)
* [linter](https://atom.io/packages/linter)
* [linter-javac](https://atom.io/packages/linter-javac)
* [vim-mode](https://atom.io/packages/vim-mode)
* [ex-mode](https://atom.io/packages/ex-mode)
* [atom-terminal-panel](https://atom.io/packages/atom-terminal-panel)
* [atom-maven](https://github.com/concon121/atom-maven)
* [browser-plus](https://atom.io/packages/browser-plus)
* [atom-beautify](https://atom.io/packages/atom-beautify)


### autocomplete-java
Based on a .classpath file, this package will provide helpful drop down boxes displaying available options based on what you are currently typing.

### linter-javac
Again based on a .classpath file, this package will attempt to compile your .java files and show you all the compile time problems with your code.

### vim-mode
Not related to Java, this one is more of a personal preference.  As a user of vim, it is quite cool to be able to use some of my favourite shortcuts in my favourite text editor.

### ex-mode
An extension of the vim-mode package which enables vims ex mode.

### atom-terminal-panel
Who needs a GUI? This package gives you a terminal within atom which defaults to your current working directory.  It automatically discovers your PATH, so there is no configuration required!

### atom-maven
Sets up your Java .classpath file based on your maven pom file.

### browser-plus
Gives you a browser in one of your atom tabs! This allows me to quickly preview changes to my html, css and javascript without having to leave atom.

### atom-beautify
Configure this plugin to conform to your code formatting standards and it will correct your formatting mistakes every time your save.
