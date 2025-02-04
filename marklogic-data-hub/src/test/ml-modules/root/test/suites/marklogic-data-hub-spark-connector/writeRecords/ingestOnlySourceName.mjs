const test = require("/test/test-helper.xqy");
import hubTest from "/test/data-hub-test-helper.mjs";
import ingestionService from "../lib/ingestionService.mjs";

ingestionService.ingest(
  {
    "sourcename": "bulkSourceName",
    "collections": "bulkSourceTest"
  },
  {}, [{"testDoc": "one"}]
);

const record = hubTest.getRecordInCollection("bulkSourceTest");
const envelope = record.document.envelope;

[
  test.assertEqual(1, envelope.headers.sources.length),
  test.assertEqual("bulkSourceName", envelope.headers.sources[0].datahubSourceName),
  test.assertFalse(envelope.headers.sources[0].hasOwnProperty("datahubSourceType"),
    "datahubSourceType should not be set since sourcetype was not set")
];
