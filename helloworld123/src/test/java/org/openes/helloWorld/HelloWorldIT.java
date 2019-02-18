package org.openes.helloWorld;

import com.carrotsearch.randomizedtesting.annotations.Name;
import com.carrotsearch.randomizedtesting.annotations.ParametersFactory;
import org.elasticsearch.test.rest.yaml.ClientYamlTestCandidate;
import org.elasticsearch.test.rest.yaml.ESClientYamlSuiteTestCase;
public class HelloWorldIT extends ESClientYamlSuiteTestCase {

    public HelloWorldIT(@Name("yaml") ClientYamlTestCandidate testCandidate) {
        super(testCandidate);
    }

    @ParametersFactory
    public static Iterable<Object[]> parameters() throws Exception {
        // The test executes all the test candidates by default
        // see ESClientYamlSuiteTestCase.REST_TESTS_SUITE
        return ESClientYamlSuiteTestCase.createParameters();
    }


}
