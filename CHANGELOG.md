# Change Log

## [v1.0.0](https://github.com/concon121/atom-maven/tree/v1.0.0) (2016-12-18)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.14.0...v1.0.0)

**Implemented enhancements:**

- feature/nodeMavenApi build maven project [\#58](https://github.com/concon121/atom-maven/issues/58)
- feature/nodeMavenApi watch pom files for changes [\#57](https://github.com/concon121/atom-maven/issues/57)
- feature/nodeMavenApi Migrate to node-maven-api [\#55](https://github.com/concon121/atom-maven/issues/55)
- Support for properties defined in settings.xml [\#37](https://github.com/concon121/atom-maven/issues/37)
- Support for dependency exclusions [\#32](https://github.com/concon121/atom-maven/issues/32)
- Support for import scoped dependencies [\#31](https://github.com/concon121/atom-maven/issues/31)
- Support for system scoped dependencies [\#30](https://github.com/concon121/atom-maven/issues/30)
- Notify dependants when dependency changes [\#27](https://github.com/concon121/atom-maven/issues/27)
- Notify children when parent pom changes [\#24](https://github.com/concon121/atom-maven/issues/24)
- Download from remote repository [\#4](https://github.com/concon121/atom-maven/issues/4)

**Fixed bugs:**

- Uncaught ReferenceError: $ is not defined [\#47](https://github.com/concon121/atom-maven/issues/47)
- Uncaught TypeError: Cannot read property 'pomPath' of undefined [\#42](https://github.com/concon121/atom-maven/issues/42)
- "Jumpy" message panel [\#38](https://github.com/concon121/atom-maven/issues/38)
- Unclosed root tag [\#35](https://github.com/concon121/atom-maven/issues/35)

**Merged pull requests:**

- Feature/nodeMavenApi [\#62](https://github.com/concon121/atom-maven/pull/62) ([concon121](https://github.com/concon121))

## [v0.14.0](https://github.com/concon121/atom-maven/tree/v0.14.0) (2016-06-12)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.13.3...v0.14.0)

**Implemented enhancements:**

- Support for optional dependencies [\#33](https://github.com/concon121/atom-maven/issues/33)

**Fixed bugs:**

- Possible failure when finding line number in pom for unkown dependency [\#50](https://github.com/concon121/atom-maven/issues/50)

**Merged pull requests:**

- Hotfix/tech debt [\#54](https://github.com/concon121/atom-maven/pull/54) ([concon121](https://github.com/concon121))
- Hotfix/issue47 [\#52](https://github.com/concon121/atom-maven/pull/52) ([concon121](https://github.com/concon121))

## [v0.13.3](https://github.com/concon121/atom-maven/tree/v0.13.3) (2016-06-11)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.13.2...v0.13.3)

**Fixed bugs:**

- Dependency mediation not working correctly [\#46](https://github.com/concon121/atom-maven/issues/46)

## [v0.13.2](https://github.com/concon121/atom-maven/tree/v0.13.2) (2016-06-08)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.13.1...v0.13.2)

## [v0.13.1](https://github.com/concon121/atom-maven/tree/v0.13.1) (2016-06-08)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.13.0...v0.13.1)

## [v0.13.0](https://github.com/concon121/atom-maven/tree/v0.13.0) (2016-06-08)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.12.1...v0.13.0)

**Implemented enhancements:**

- atom-maven expects $PATH to contain the string 'maven' or 'M2' or 'M3' [\#43](https://github.com/concon121/atom-maven/issues/43)

**Fixed bugs:**

- Uncaught TypeError: Cannot read property '0' of undefined [\#36](https://github.com/concon121/atom-maven/issues/36)
- Cannot find module './FileUtils' [\#11](https://github.com/concon121/atom-maven/issues/11)

**Merged pull requests:**

- Develop [\#44](https://github.com/concon121/atom-maven/pull/44) ([concon121](https://github.com/concon121))

## [v0.12.1](https://github.com/concon121/atom-maven/tree/v0.12.1) (2016-06-04)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.12.0...v0.12.1)

**Merged pull requests:**

- Hotfix/find maven installation [\#41](https://github.com/concon121/atom-maven/pull/41) ([concon121](https://github.com/concon121))

## [v0.12.0](https://github.com/concon121/atom-maven/tree/v0.12.0) (2016-05-31)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.11.0...v0.12.0)

**Merged pull requests:**

- Develop [\#40](https://github.com/concon121/atom-maven/pull/40) ([concon121](https://github.com/concon121))
- Feature/dependency mediation [\#39](https://github.com/concon121/atom-maven/pull/39) ([concon121](https://github.com/concon121))

## [v0.11.0](https://github.com/concon121/atom-maven/tree/v0.11.0) (2016-05-24)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.10.1...v0.11.0)

**Fixed bugs:**

- Dependencies not refreshed on save [\#34](https://github.com/concon121/atom-maven/issues/34)
- on save, getting cached versions of files which have changed [\#19](https://github.com/concon121/atom-maven/issues/19)

## [v0.10.1](https://github.com/concon121/atom-maven/tree/v0.10.1) (2016-05-23)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.10.0...v0.10.1)

## [v0.10.0](https://github.com/concon121/atom-maven/tree/v0.10.0) (2016-05-23)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.9.0...v0.10.0)

**Merged pull requests:**

- Develop [\#26](https://github.com/concon121/atom-maven/pull/26) ([concon121](https://github.com/concon121))

## [v0.9.0](https://github.com/concon121/atom-maven/tree/v0.9.0) (2016-05-19)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.8.0...v0.9.0)

**Closed issues:**

- Cannot find module 'underscore' [\#7](https://github.com/concon121/atom-maven/issues/7)

## [v0.8.0](https://github.com/concon121/atom-maven/tree/v0.8.0) (2016-05-19)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.7.0...v0.8.0)

**Closed issues:**

- remove waitfor [\#21](https://github.com/concon121/atom-maven/issues/21)
- Resolving version from dep management wrong [\#17](https://github.com/concon121/atom-maven/issues/17)
- Parents dependencies should be on the classpath [\#14](https://github.com/concon121/atom-maven/issues/14)

**Merged pull requests:**

- Develop [\#23](https://github.com/concon121/atom-maven/pull/23) ([concon121](https://github.com/concon121))
- Hotfix/files cached [\#22](https://github.com/concon121/atom-maven/pull/22) ([concon121](https://github.com/concon121))

## [v0.7.0](https://github.com/concon121/atom-maven/tree/v0.7.0) (2016-05-17)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.6.0...v0.7.0)

**Closed issues:**

- Versions defined as properties [\#9](https://github.com/concon121/atom-maven/issues/9)
- Inherited versions [\#8](https://github.com/concon121/atom-maven/issues/8)

## [v0.6.0](https://github.com/concon121/atom-maven/tree/v0.6.0) (2016-05-16)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.5.0...v0.6.0)

**Closed issues:**

- Type is always jar [\#10](https://github.com/concon121/atom-maven/issues/10)

**Merged pull requests:**

- Feature/inherited versions [\#15](https://github.com/concon121/atom-maven/pull/15) ([concon121](https://github.com/concon121))
- Parse dependency type, if not exists then default to jar [\#13](https://github.com/concon121/atom-maven/pull/13) ([concon121](https://github.com/concon121))

## [v0.5.0](https://github.com/concon121/atom-maven/tree/v0.5.0) (2016-05-16)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.4.0...v0.5.0)

## [v0.4.0](https://github.com/concon121/atom-maven/tree/v0.4.0) (2016-05-16)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.2.0...v0.4.0)

## [v0.2.0](https://github.com/concon121/atom-maven/tree/v0.2.0) (2016-05-15)
[Full Changelog](https://github.com/concon121/atom-maven/compare/v0.1.0...v0.2.0)

## [v0.1.0](https://github.com/concon121/atom-maven/tree/v0.1.0) (2016-05-15)


\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*