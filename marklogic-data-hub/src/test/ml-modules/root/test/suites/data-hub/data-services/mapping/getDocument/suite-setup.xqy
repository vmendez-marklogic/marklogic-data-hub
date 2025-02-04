xquery version "1.0-ml";
import module namespace hub-test = "http://marklogic.com/data-hub/test" at "/test/data-hub-test-helper.xqy";
hub-test:reset-hub();



xquery version "1.0-ml";
import module namespace hub-test = "http://marklogic.com/data-hub/test" at "/test/data-hub-test-helper.xqy";
import module namespace test = "http://marklogic.com/test" at "/test/test-helper.xqy";
hub-test:load-entities($test:__CALLER_FILE__);



xquery version "1.0-ml";
import module namespace hub-test = "http://marklogic.com/data-hub/test" at "/test/data-hub-test-helper.xqy";
import module namespace test = "http://marklogic.com/test" at "/test/test-helper.xqy";
hub-test:load-non-entities($test:__CALLER_FILE__);



xquery version "1.0-ml";
xdmp:javascript-eval("
  // Alternative to hub-test; this way gets the step def into the collection required by mapping.mjs' getArtifactNode().
  import mappingService from '/test/suites/data-hub/data-services/lib/mappingService.mjs';
  mappingService.DocumentForTestingUtils.loadTestData();
")


