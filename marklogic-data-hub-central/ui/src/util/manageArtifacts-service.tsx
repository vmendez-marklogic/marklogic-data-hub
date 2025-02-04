import axios from "axios";

const getMappingValidationResp = async (mapName: string, map, uri: string, dbName: string) => {
  let resp = await axios.post(`/api/artifacts/mapping/validation?uri=${encodeURIComponent(uri)}&db=${dbName}`, map);
  return resp;
};

const getNestedEntities = async entityTypeTitle => {
  const path = `/api/artifacts/mapping/entity/${entityTypeTitle}`;
  let response = await axios.get(path);
  return response;
};

export {getMappingValidationResp, getNestedEntities};
