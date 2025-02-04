package com.marklogic.hub.dataservices;

// IMPORTANT: Do not edit. This file is generated.

import com.marklogic.client.SessionState;
import com.marklogic.client.io.Format;
import java.io.Reader;
import java.io.InputStream;
import java.util.stream.Stream;


import com.marklogic.client.DatabaseClient;
import com.marklogic.client.io.marker.JSONWriteHandle;

import com.marklogic.client.impl.BaseProxy;

/**
 * Provides a set of operations on the database server
 */
public interface StepRunnerService {
    /**
     * Creates a StepRunnerService object for executing operations on the database server.
     *
     * The DatabaseClientFactory class can create the DatabaseClient parameter. A single
     * client object can be used for any number of requests and in multiple threads.
     *
     * @param db	provides a client for communicating with the database server
     * @return	an object for executing database operations
     */
    static StepRunnerService on(DatabaseClient db) {
      return on(db, null);
    }
    /**
     * Creates a StepRunnerService object for executing operations on the database server.
     *
     * The DatabaseClientFactory class can create the DatabaseClient parameter. A single
     * client object can be used for any number of requests and in multiple threads.
     *
     * The service declaration uses a custom implementation of the same service instead
     * of the default implementation of the service by specifying an endpoint directory
     * in the modules database with the implementation. A service.json file with the
     * declaration can be read with FileHandle or a string serialization of the JSON
     * declaration with StringHandle.
     *
     * @param db	provides a client for communicating with the database server
     * @param serviceDeclaration	substitutes a custom implementation of the service
     * @return	an object for executing database operations
     */
    static StepRunnerService on(DatabaseClient db, JSONWriteHandle serviceDeclaration) {
        final class StepRunnerServiceImpl implements StepRunnerService {
            private DatabaseClient dbClient;
            private BaseProxy baseProxy;

            private BaseProxy.DBFunctionRequest req_processIngestBatch;
            private BaseProxy.DBFunctionRequest req_processBatch;

            private StepRunnerServiceImpl(DatabaseClient dbClient, JSONWriteHandle servDecl) {
                this.dbClient  = dbClient;
                this.baseProxy = new BaseProxy("/data-hub/data-services/stepRunner/", servDecl);

                this.req_processIngestBatch = this.baseProxy.request(
                    "processIngestBatch.mjs", BaseProxy.ParameterValuesKind.MULTIPLE_NODES);
                this.req_processBatch = this.baseProxy.request(
                    "processBatch.mjs", BaseProxy.ParameterValuesKind.SINGLE_NODE);
            }
            @Override
            public SessionState newSessionState() {
              return baseProxy.newSessionState();
            }

            @Override
            public com.fasterxml.jackson.databind.JsonNode processIngestBatch(SessionState session, Reader endpointState, Reader endpointConstants, Stream<InputStream> input) {
                return processIngestBatch(
                    this.req_processIngestBatch.on(this.dbClient), session, endpointState, endpointConstants, input
                    );
            }
            private com.fasterxml.jackson.databind.JsonNode processIngestBatch(BaseProxy.DBFunctionRequest request, SessionState session, Reader endpointState, Reader endpointConstants, Stream<InputStream> input) {
              return BaseProxy.JsonDocumentType.toJsonNode(
                request
                      .withSession("session", session, false)
                      .withParams(
                          BaseProxy.documentParam("endpointState", true, BaseProxy.JsonDocumentType.fromReader(endpointState)),
                          BaseProxy.documentParam("endpointConstants", false, BaseProxy.JsonDocumentType.fromReader(endpointConstants)),
                          BaseProxy.documentParam("input", true, BaseProxy.BinaryDocumentType.fromInputStream(input))
                          ).responseSingle(true, Format.JSON)
                );
            }

            @Override
            public com.fasterxml.jackson.databind.JsonNode processBatch(SessionState api_session, com.fasterxml.jackson.databind.JsonNode inputs) {
                return processBatch(
                    this.req_processBatch.on(this.dbClient), api_session, inputs
                    );
            }
            private com.fasterxml.jackson.databind.JsonNode processBatch(BaseProxy.DBFunctionRequest request, SessionState api_session, com.fasterxml.jackson.databind.JsonNode inputs) {
              return BaseProxy.JsonDocumentType.toJsonNode(
                request
                      .withSession("api_session", api_session, false)
                      .withParams(
                          BaseProxy.documentParam("inputs", false, BaseProxy.JsonDocumentType.fromJsonNode(inputs))
                          ).responseSingle(false, Format.JSON)
                );
            }
        }

        return new StepRunnerServiceImpl(db, serviceDeclaration);
    }
    /**
     * Creates an object to track a session for a set of operations
     * that require session state on the database server.
     *
     * @return	an object for session state
     */
    SessionState newSessionState();

  /**
   * Replacement for the mlRunIngest REST transform; processes a batch of items using the given flow and step
   *
   * @param session	Holds the session object
   * @param endpointState	provides input
   * @param endpointConstants	provides input
   * @param input	provides input
   * @return	as output
   */
    com.fasterxml.jackson.databind.JsonNode processIngestBatch(SessionState session, Reader endpointState, Reader endpointConstants, Stream<InputStream> input);

  /**
   * Replacement for the mlRunFlow REST extension; processes a batch of items using the given flow and step
   *
   * @param api_session	Holds the session object
   * @param inputs	provides input
   * @return	as output
   */
    com.fasterxml.jackson.databind.JsonNode processBatch(SessionState api_session, com.fasterxml.jackson.databind.JsonNode inputs);

}
