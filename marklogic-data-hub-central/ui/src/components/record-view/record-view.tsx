import React, {CSSProperties, useContext, useState} from "react";
import styles from "./record-view.module.scss";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import ReactHtmlParser from "react-html-parser";
import {Link, useHistory} from "react-router-dom";
import sourceFormatOptions from "@config/formats.config";
import {AuthoritiesContext} from "@util/authorities";
import {formatCardUri} from "@util/conversionFunctions";
import {CardViewDateConverter} from "@util/date-conversion";
import {SearchContext} from "@util/search-context";
import {getRecord} from "@api/record";
import {faInfoCircle} from "@fortawesome/free-solid-svg-icons";
import {Download, FileEarmark, ArrowRightSquare} from "react-bootstrap-icons";
import {HCCard, HCTooltip} from "@components/common";
import Popover from "react-bootstrap/Popover";
import {Overlay, Spinner} from "react-bootstrap";
import {SecurityTooltips} from "@config/tooltips.config";
import {MdCallMerge} from "react-icons/md";
import {previewMatchingActivity, getDocFromURI, getPreviewFromURIs} from "@api/matching";
import {deleteNotification, mergeUris} from "@api/merging";
import CompareValuesModal from "../../components/entities/matching/compare-values-modal/compare-values-modal";
import {AxiosResponse} from "axios";

const RecordCardView = props => {
  const authorityService = useContext(AuthoritiesContext);
  const history: any = useHistory();
  const {searchOptions} = useContext(SearchContext);
  const [loading, setToggleLoading] = useState<string>("");
  const [activeUri, setActiveUri] = useState<string>("");
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [previewMatchedActivity, setPreviewMatchedActivity] = useState<{}>({
    sampleSize: 100,
    uris: [],
    actionPreview: [],
  });
  const [activeEntityArray, setActiveEntityArray] = useState<any>([]);
  const [activeEntityUris, setActiveEntityUris] = useState<string[]>([]);
  const [uriInfo, setUriInfo] = useState<any>();
  const [flowName, setFlowname] = useState<string>("");
  const canWriteMatchMerge = authorityService.canWriteMatchMerge();
  const handleDetailViewNavigation = () => {}; // eslint-disable-line @typescript-eslint/no-unused-vars

  const [infoVisibility, setInfoVisibility] = useState(false);
  const [target, setTarget] = useState(null);
  const [element, setElement] = useState(null);

  // Custom CSS for source Format
  const sourceFormatStyle = sourceFmt => {
    let customStyles: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      height: "28px",
      width: "28px",
      lineHeight: "20px",
      backgroundColor: sourceFormatOptions[sourceFmt].color,
      fontSize: sourceFmt === "json" ? "9.5px" : "11.5px",
      borderRadius: "50%",
      textAlign: "center",
      color: "#ffffff",
      verticalAlign: "middle",
      marginRight: "8px",
    };
    return customStyles;
  };

  const displayUri = uri => {
    return formatCardUri(uri);
  };

  const displaySnippet = item => {
    if (["json", "xml", "text"].includes(item.format)) {
      let str = "";
      item.matches.forEach(item => {
        item["match-text"].forEach(element => {
          if (typeof element === "object") {
            str = str.concat("<b>").concat(element.highlight).concat("</b>").concat("...");
          } else {
            str = str.concat(element);
          }
        });
      });
      return <p>{ReactHtmlParser(str)}</p>;
    } else if ("binary" === item.format) {
      return (
        <div className={styles.binaryCard}>
          <FileEarmark className={styles.binaryIcon} />
          <div className={styles.binaryText} data-testid={item.uri + "-noPreview"}>
            {" "}
            No preview available
          </div>
        </div>
      );
    }
  };

  const displayRecordSources = item => {
    let sources = item.hubMetadata?.sources
      .map(record => {
        return record.datahubSourceName;
      })
      .join(", ");
    return sources;
  };

  const emptyField = <p className={styles.textDisabled}>none</p>;

  const displayRecordMetadata = item => {
    return (
      <Popover id={`popover-positioned-record-view-${item?.index ? item.index : ""}`} className={styles.popoverWrap}>
        <Popover.Body>
          <div className={styles.popover} data-testid={item.uri + "-popover"}>
            <div className={styles.colKey}>
              <p>Source:</p>
              <p>Flow:</p>
              <p>Step:</p>
              <p>Created On:</p>
            </div>
            <div className={styles.colValue}>
              {item.hubMetadata?.sources?.length > 0 ? (
                <span className={styles.valText} data-testid={item.uri + "-sources"}>
                  <HCTooltip
                    text={displayRecordSources(item)}
                    id="source-tooltip"
                    placement="bottom"
                    //width={"200px"} // DHFPROD-7711 MLTooltip -> Tooltip
                  >
                    <span tabIndex={0}>{displayRecordSources(item).substring(0, 28)}</span>
                  </HCTooltip>
                </span>
              ) : (
                emptyField
              )}
              {item.hubMetadata?.lastProcessedByFlow ? (
                <span className={styles.valText} data-testid={item.uri + "-lastProcessedByFlow"}>
                  <HCTooltip
                    text={item.hubMetadata?.lastProcessedByFlow}
                    id="last-processed-by-flow-tooltip"
                    placement="bottom"
                    //width={"200px"} // DHFPROD-7711 MLTooltip -> Tooltip
                  >
                    <span tabIndex={0}>{item.hubMetadata?.lastProcessedByFlow}</span>
                  </HCTooltip>
                </span>
              ) : (
                emptyField
              )}
              {item.hubMetadata?.lastProcessedByStep ? (
                <span className={styles.valText} data-testid={item.uri + "-lastProcessedByStep"}>
                  <HCTooltip
                    text={item.hubMetadata.lastProcessedByStep}
                    id="last-processed-by-step-tooltip"
                    placement="bottom"
                    //width={"200px"} // DHFPROD-7711 MLTooltip -> Tooltip
                  >
                    <span tabIndex={0}>{item.hubMetadata.lastProcessedByStep}</span>
                  </HCTooltip>
                </span>
              ) : (
                emptyField
              )}
              {item.hubMetadata?.lastProcessedDateTime ? (
                <span className={styles.valText} data-testid={item.uri + "-lastProcessedDateTime"}>
                  {CardViewDateConverter(item.hubMetadata?.lastProcessedDateTime)}
                </span>
              ) : (
                emptyField
              )}
            </div>
          </div>
        </Popover.Body>
      </Popover>
    );
  };

  const getLinkProperties = elem => {
    let sources = elem.hubMetadata && elem.hubMetadata.hasOwnProperty("sources") ? elem.hubMetadata["sources"] : [];

    let linkObject = {
      pathname: "/tiles/explore/detail",
      state: {
        selectedValue: "instance",
        entity: searchOptions.entityTypeIds,
        pageNumber: searchOptions.pageNumber,
        start: searchOptions.start,
        searchFacets: searchOptions.selectedFacets,
        query: searchOptions.query,
        tableView: props.tableView,
        sortOrder: searchOptions.sortOrder,
        sources: sources,
        primaryKey: elem.primaryKey?.propertyPath === "uri" ? "" : elem.primaryKey?.propertyValue,
        uri: elem.uri,
        entityInstance: elem.entityInstance ? elem.entityInstance : undefined,
        database: searchOptions.database,
        isEntityInstance: false,
        targetDatabase: searchOptions.database,
      },
    };

    return linkObject;
  };
  const navigateUsingKey = (event, elem) => {
    if (event.key === "Enter" || event.key === " ") {
      history.push(getLinkProperties(elem));
    }
  };

  const download = async docUri => {
    try {
      const response = await getRecord(docUri, searchOptions.database);
      if (response) {
        let result = String(response.headers["content-disposition"]).split(";")[1].trim().split("=")[1];
        let filename = result.replace(/"/g, "");
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const displayFileSize = elem => {
    let size = elem.documentSize?.hasOwnProperty("value") ? elem.documentSize?.value : "";
    let unit = elem.documentSize?.hasOwnProperty("units") ? elem.documentSize?.units : "";
    return `Download (${size} ${unit})`;
  };

  const openMergeCompare = async item => {
    let arrayUris = item.notifiedDocumentUris;
    let activeEntityIndex = props.entityDefArray.findIndex(entity => entity.name === item["entityName"]);
    setFlowname(item.hubMetadata.lastProcessedByFlow);
    setActiveEntityArray([props.entityDefArray[activeEntityIndex]]);
    setActiveEntityUris(arrayUris);
    setActiveUri(item.uri);
    setToggleLoading(item.uri);
    await fetchCompareData(arrayUris, item);
    setCompareModalVisible(true);
  };

  const fetchCompareData = async (array, item) => {
    let uriRequests: Promise<AxiosResponse<any>>[] = [];
    array.forEach(uri => {
      uriRequests.push(getDocFromURI(uri));
    });
    const results = await Promise.all(uriRequests);
    const result1 = results[0];
    const result2 = results[1];

    const flowName = result1.data.recordMetadata?.datahubCreatedInFlow;
    const preview = flowName ? await getPreviewFromURIs(flowName, array) : null;

    if (result1.status === 200 && result2.status === 200 && preview?.status === 200) {
      let urisInfo: any[] = [];
      results.forEach((result, index) => {
        const instanceKey = `result${index + 1}Instance`;
        urisInfo.push({
          [instanceKey]: result.data.data.envelope.instance,
        });
      });
      let previewInstance = preview.data.value.envelope.instance;
      urisInfo.push({previewInstance});
      setUriInfo(urisInfo);
    }

    let testMatchData = {
      restrictToUris: true,
      uris: array,
      sampleSize: 100,
      stepName: item.matchStepName,
    };

    let previewMatchActivity = await previewMatchingActivity(testMatchData);
    if (previewMatchActivity) {
      setToggleLoading("");
      setPreviewMatchedActivity(previewMatchActivity);
    }
  };

  const submitMergeUri = async (uri, payload) => {
    const documentsHaveMerged = await mergeUris(payload);
    if (documentsHaveMerged) {
      await deleteNotification(uri);
    }
  };

  const handleInfoIconClick = (event, element) => {
    setElement(element);
    setTarget(event.target);
    setInfoVisibility(true);
  };

  const closePopover = () => {
    if (infoVisibility) {
      setInfoVisibility(false);
    }
  };

  const infoKeyDownHandler = (event, element) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleInfoIconClick(event, element);
    }
    if (event.key === "Escape") {
      closePopover();
    }
  };

  const infoPopover = (
    <Overlay show={infoVisibility} target={target} placement="bottom-end">
      {element ? displayRecordMetadata(element) : <></>}
    </Overlay>
  );

  return (
    <div id="record-data-card" aria-label="record-data-card" className={styles.recordDataCard}>
      <Row className="w-100 m-0">
        {infoVisibility && element && infoPopover}
        {props.data && props.data.length > 0 ? (
          props.data.map((elem, index) => (
            <Col xs={"auto"} key={index}>
              <div>
                <HCCard className={styles.cardStyle}>
                  <div className={styles.cardMetadataContainer}>
                    <span className={styles.uriContainer} data-testid={elem.uri + "-URI"}>
                      URI:{" "}
                      <span className={styles.uri}>
                        <HCTooltip text={elem.uri} id="element-uri-tooltip" placement="bottom">
                          <span tabIndex={0} onFocus={closePopover}>
                            {displayUri(elem.uri)}
                          </span>
                        </HCTooltip>
                      </span>
                    </span>
                    <span className={styles.cardIcons}>
                      <span>
                        <HCTooltip text={"View info"} id="view-info-tooltip" placement="bottom">
                          <span className={styles.infoIcon}>
                            <i>
                              <FontAwesomeIcon
                                tabIndex={0}
                                icon={faInfoCircle}
                                size="1x"
                                data-testid={elem.uri + "-InfoIcon"}
                                onClick={event => handleInfoIconClick(event, elem)}
                                onKeyDown={event => infoKeyDownHandler(event, elem)}
                              />
                            </i>
                          </span>
                        </HCTooltip>
                      </span>
                      <span
                        className={styles.sourceFormat}
                        style={sourceFormatStyle(elem.format)}
                        data-testid={elem.uri + "-sourceFormat"}
                      >
                        {sourceFormatOptions[elem.format].label}
                      </span>
                      {elem.format === "binary" ? (
                        <span id={"instance"} data-cy="instance">
                          <HCTooltip text="View details" id="binary-detail-view-tooltip" placement="bottom">
                            <ArrowRightSquare className={styles.arrowRightSquare} />
                          </HCTooltip>
                        </span>
                      ) : (
                        <Link
                          to={getLinkProperties(elem)}
                          onKeyDown={e => navigateUsingKey(e, elem)}
                          id={"instance"}
                          data-cy="instance"
                          onFocus={closePopover}
                        >
                          <HCTooltip text="View details" id="detail-view-tooltip" placement="bottom">
                            <ArrowRightSquare
                              className={styles.arrowRightSquare}
                              role="detail-link icon"
                              data-testid={elem.uri + "-detailViewIcon"}
                            />
                          </HCTooltip>
                        </Link>
                      )}
                    </span>
                  </div>
                  <div className={styles.snippetContainer} data-testid={elem.uri + "-snippet"}>
                    {displaySnippet(elem)}
                  </div>
                  {elem.notifiedDoc ? (
                    <div className={styles.mergeIconDiv}>
                      {loading === elem.uri ? (
                        <Spinner
                          data-testid="hc-button-component-spinner"
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className={styles.spinner}
                        />
                      ) : null}
                      {canWriteMatchMerge ? (
                        <HCTooltip text={"Merge Documents"} id="merge-icon" placement="top-end">
                          <i>
                            <MdCallMerge
                              className={styles.mergeIcon}
                              data-testid={"merge-icon"}
                              onClick={() => openMergeCompare(elem)}
                              tabIndex={0}
                              onKeyDown={e => {
                                if (e.key === "Enter" || e.key === " ") {
                                  openMergeCompare(elem);
                                }
                              }}
                            />
                          </i>
                        </HCTooltip>
                      ) : (
                        <HCTooltip
                          text={SecurityTooltips.missingPermissionMerge}
                          id="missing-permission-tooltip"
                          placement="top-end"
                        >
                          <i data-testid={`merge-icon${index}`}>
                            <MdCallMerge className={styles.mergeIconDisabled} data-testid={"merge-icon"} />
                          </i>
                        </HCTooltip>
                      )}
                    </div>
                  ) : null}
                  <span className={styles.downloadIcon}>
                    <HCTooltip text={displayFileSize(elem)} id="download-icon-tooltip" placement="bottom">
                      <Download
                        onClick={() => download(elem.uri)}
                        data-testid={elem.uri + "-download-icon"}
                        size={18}
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === "Enter" || e.key === " ") {
                            download(elem.uri);
                          }
                        }}
                      />
                    </HCTooltip>
                  </span>
                </HCCard>
              </div>
            </Col>
          ))
        ) : (
          <span />
        )}
      </Row>
      <CompareValuesModal
        isVisible={compareModalVisible}
        fetchNotifications={() => void 0}
        toggleModal={setCompareModalVisible}
        uriInfo={uriInfo}
        activeStepDetails={activeEntityArray}
        entityProperties={{}}
        uriCompared={activeEntityUris}
        previewMatchActivity={previewMatchedActivity}
        entityDefinitionsArray={activeEntityArray}
        uris={activeEntityUris}
        isPreview={false}
        isMerge={true}
        flowName={flowName}
        mergeUris={async payload => submitMergeUri(activeUri, payload)}
        unmergeUri={{}}
        originalUri={activeUri}
      />
    </div>
  );
};

export default RecordCardView;
