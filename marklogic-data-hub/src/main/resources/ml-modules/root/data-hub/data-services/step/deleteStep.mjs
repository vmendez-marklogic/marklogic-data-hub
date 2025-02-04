/**
 Copyright (c) 2021 MarkLogic Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
'use strict';

import Artifacts from "/data-hub/5/artifacts/core.mjs";
import consts from "/data-hub/5/impl/consts.mjs";
import httpUtils from "/data-hub/5/impl/http-utils.mjs";

const stepDefinitionType = external.stepDefinitionType.toLowerCase();
const stepName = external.stepName;

if ("ingestion" === stepDefinitionType) {
  xdmp.securityAssert("http://marklogic.com/data-hub/privileges/write-ingestion", "execute");
} else if ("mapping" === stepDefinitionType) {
  xdmp.securityAssert("http://marklogic.com/data-hub/privileges/write-mapping", "execute");
} else if ("matching" === stepDefinitionType || "merging" === stepDefinitionType) {
  xdmp.securityAssert("http://marklogic.com/data-hub/privileges/write-match-merge", "execute");
} else if ("custom" === stepDefinitionType) {
  xdmp.securityAssert("http://marklogic.com/data-hub/privileges/write-custom", "execute");
} else {
  httpUtils.throwBadRequest("Unsupported step definition type: " + stepDefinitionType);
}

const stepId = stepName + "-" + stepDefinitionType;
xdmp.trace(consts.TRACE_STEP, `Deleting step ${stepId}`);

const flowsWithReferences = cts.search(cts.andQuery([
  cts.collectionQuery(consts.FLOW_COLLECTION),
  cts.jsonPropertyValueQuery("stepId", stepId, "case-insensitive")
]), ["unfiltered", "score-zero", "unfaceted"]);

for (let flowDoc of flowsWithReferences) {
  const flow = flowDoc.toObject();
  let foundStep = false;
  Object.keys(flow.steps).forEach(key => {
    if (flow.steps[key].stepId && flow.steps[key].stepId.toLowerCase() == stepId.toLowerCase()) {
      foundStep = true;
      delete flow.steps[key];
    }
  });

  if (foundStep) {
    xdmp.trace(consts.TRACE_STEP, `Removing step ${stepId} from flow ${flow.name}`);
    Artifacts.setArtifact("flow", flow.name, flow);
  }
}

Artifacts.deleteArtifact(stepDefinitionType, stepName);
xdmp.trace(consts.TRACE_STEP, `Finished deleting step ${stepId}`);
