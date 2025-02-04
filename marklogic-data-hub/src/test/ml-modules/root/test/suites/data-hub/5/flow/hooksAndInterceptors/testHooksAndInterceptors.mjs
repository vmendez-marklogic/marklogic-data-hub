import config from "/com.marklogic.hub/config.mjs";
import flowApi from "/data-hub/public/flow/flow-api.mjs";
import hubTest from "/test/data-hub-test-helper.mjs";
const test = require("/test/test-helper.xqy");

const response = flowApi.runFlowOnContent("simpleMappingFlow",
  [{
    "uri": "/customer1.json",
    "value": {
      "customerId": 1,
      "name": "Jane"
    }
  }],
  sem.uuidString(), {}
);

const message = "Unexpected response: " + xdmp.toJsonString(response);
const assertions = [
  test.assertEqual("finished", response.jobStatus, message),
  test.assertEqual("completed step 1", response.stepResponses["1"].status, message),
  test.assertEqual("completed step 2", response.stepResponses["2"].status, message)
];

const mappedCustomer = hubTest.getRecord("/customer1.json").document.envelope;

assertions.push(
  test.assertEqual("hello", mappedCustomer.headers.beforeHeader,
    "Verifying that the beforeMain interceptor was invoked correctly"),
  test.assertEqual("data-hub-STAGING", mappedCustomer.headers.beforeHeaderDatabase,
    "Verifying that the beforeMain interceptor was invoked against the source database"),

  test.assertEqual("world", mappedCustomer.headers.afterHeader,
    "Verifying that the beforeContentPersisted interceptor was invoked correctly"),
  test.assertEqual("data-hub-FINAL", mappedCustomer.headers.afterHeaderDatabase,
    "Verifying that the beforeMain interceptor was invoked against the target database")
);

const beforeHookDoc = hubTest.getRecord("/beforeHook/customer1.json", config.STAGINGDATABASE);
assertions.push(
  test.assertEqual("Jane", beforeHookDoc.document.name, "Since the hook is a 'before' one, the document written by the hook " +
    "should be the input document, and it should be written to the source database for the step, which is staging"),
  test.assertEqual(1, beforeHookDoc.document.customerId)
);

const afterHookDoc = hubTest.getRecord("/afterHook/customer1.json", config.FINALDATABASE);
assertions.push(
  test.assertEqual("world", afterHookDoc.document.envelope.headers.afterHeader,
    "Starting in 5.5, an 'after' hook receives the output content array from a step instead of the input " +
    "content array. So the hook should see the data added by the interceptor."),
  test.assertEqual("hello", afterHookDoc.document.envelope.headers.beforeHeader)
);

assertions;
