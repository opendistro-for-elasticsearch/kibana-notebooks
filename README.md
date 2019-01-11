## What?

Sample plugins for Elasticsearch. Currently includes helloworld plugin. 

## Setup

1. Checkout this package from version control. 
1. Launch Intellij IDEA, Choose Import Project and select the `settings.gradle` file in the root of this package. 
1. Launch all gradle tasks from Intellij with the command line option '-Dcompiler.java=11'
1. To build from command line set `JAVA_HOME` to point to a JDK 10 and set up paths for both JAVA8_HOME and JAVA11_HOME before running `./gradlew`
1. Till we go public, ensure that you have environment variables set up to read from S3 bucket. The team has permissions to read the S3 bucket for openes account. In IDE, you can set up `RunConfigurations` with the right environment variables.

## Build

This package is organised into subprojects most of which contribute JARs to the top-level ES plugin in the `helloworld` subproject. 

All subprojects in this package use the [Gradle](https://docs.gradle.org/4.10.2/userguide/userguide.html) build system. Gradle comes with excellent documentation which should be your first stop when trying to figure out how to operate or modify the build. 

However to build the `helloworld` plugin subproject we also use the Elastic build tools for Gradle.  These tools are idiosyncratic and don't always follow the conventions and instructions for building regular java code using Gradle. Not everything in `helloworld` will work the way it's described in the Gradle documentation. If you encounter such a situation the Elastic build tools [source code](https://github.com/elastic/elasticsearch/tree/master/buildSrc) is your best bet for figuring out what's going on. 
  
### Building from command line

1. `./gradlew build -Dcompiler.java=11` builds and tests all subprojects. Creates a zip in build/distribution.
1. `./gradlew :helloworld:run -Dcompiler.java=11` launches a single node cluster with the monitoring plugin installed
1. `./gradlew :helloworld:integTest -Dcompiler.java=11` launches a single node cluster with the monitoring plugin installed and runs all integ tests
1. ` ./gradlew :helloworld:integTest --tests="**.test execute foo" -Dcompiler.java=11` runs a single integ test class or method
 (remember to quote the test method name if it contains spaces).
1. `./gradlew build --es.version=6.5.5-SNAPSHOT -Dcompiler.java=11` builds and tests all subprojects against a particular es version.
1. Add `publishArtifact=true` for publishing artifacts.

## Publish artifacts
1. `./gradlew publish -Dcompiler.java=11` publishes the build artifacts to local file system. The default local path containing the published artifacts is `${rootProject.buildDir}\local-test-repo`
1. `./gradlew publish -DlocalPublish=false '-Dorg.gradle.jvmargs=--add-modules java.xml.bind' -Dcompiler.java=11` publishes the build artifacts to snapshot repo in S3.
1. `./gradlew publish -DlocalPublish=false '-Dorg.gradle.jvmargs=--add-modules java.xml.bind' -Dcompiler.java=11 -Dbuild.snapshot=false` publishes the build artifacts to release repo in S3.
