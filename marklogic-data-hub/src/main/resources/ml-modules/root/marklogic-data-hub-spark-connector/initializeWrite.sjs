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

declareUpdate();

// No privilege required: This endpoint is called by the spark connector.

var externalMetadata = externalMetadata != null ? fn.head(xdmp.fromJSON(externalMetadata)) : {};


const mjsProxy = require("/data-hub/core/util/mjsProxy.sjs");
const jobs = mjsProxy.requireMjsModule("/data-hub/5/impl/jobs.mjs");

const id = sem.uuidString();

xdmp.documentInsert(
  "/jobs/" + id + ".json",
  {
    job: {
      jobId: id,
      user: xdmp.getCurrentUser(),
      jobStatus: "started",
      timeStarted: fn.currentDateTime(),
      externalMetadata
    }
  },
  jobs.buildJobPermissions(),
  ['Jobs', 'Job']
);

id;
