// APIs
const createRegex = require('createRegex');
const generateRandom = require('generateRandom');
const getContainerVersion = require('getContainerVersion');
const getTimestampMillis = require('getTimestampMillis');
const getType = require('getType');
const JSON = require('JSON');
const logToConsole = require('logToConsole');
const makeString = require('makeString');
const Math = require('Math');
const sendHttpRequest = require('sendHttpRequest');
const testRegex = require('testRegex');
const toBase64 = require('toBase64');

// Detect if debug mode is enabled
const containerVer = getContainerVersion();
const isDebug = containerVer.debugMode;

// Constants
const API_ENDPOINT = 'https://api.rokt.com/v2/events';
const ROKT_VERSION = '2020-05-21';

// Date calculation constants
const leapYear = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const nonLeapYear = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Generate a random client event ID (max 36 characters)
 */
function generateClientEventId() {
  const timestamp = getTimestampMillis();
  const randomNum = generateRandom(100000, 999999);
  const clientEventId = 'sgtm-' + timestamp + '-' + randomNum;

  // Ensure it's within 36 character limit
  return clientEventId.length > 36 ? clientEventId.substring(0, 36) : clientEventId;
}

/**
 * Helper functions for time conversion
 */
const secToMs = (s) => s * 1000;
const minToMs = (m) => m * secToMs(60);
const hoursToMs = (h) => h * minToMs(60);
const daysToMs = (d) => d * hoursToMs(24);

const padStart = (value, length) => {
  let result = makeString(value);
  while (result.length < length) {
    result = '0' + result;
  }
  return result;
};

/**
 * Convert timestamp to ISO 8601 format
 */
function convertTimestampToISO(timestamp) {
  const fourYearsInMs = daysToMs(365 * 4 + 1);
  let year = 1970 + Math.floor(timestamp / fourYearsInMs) * 4;
  timestamp = timestamp % fourYearsInMs;

  while (true) {
    let isLeapYear = year % 4 === 0;
    let nextTimestamp = timestamp - daysToMs(isLeapYear ? 366 : 365);
    if (nextTimestamp < 0) {
      break;
    }
    timestamp = nextTimestamp;
    year = year + 1;
  }

  const daysByMonth = year % 4 === 0 ? leapYear : nonLeapYear;

  let month = 0;
  for (let i = 0; i < daysByMonth.length; i++) {
    let msInThisMonth = daysToMs(daysByMonth[i]);
    if (timestamp > msInThisMonth) {
      timestamp = timestamp - msInThisMonth;
    } else {
      month = i + 1;
      break;
    }
  }

  let date = Math.ceil(timestamp / daysToMs(1));
  timestamp = timestamp - daysToMs(date - 1);
  let hours = Math.floor(timestamp / hoursToMs(1));
  timestamp = timestamp - hoursToMs(hours);
  let minutes = Math.floor(timestamp / minToMs(1));
  timestamp = timestamp - minToMs(minutes);
  let sec = Math.floor(timestamp / secToMs(1));
  timestamp = timestamp - secToMs(sec);
  let milliSeconds = timestamp;

  return (
    year +
    '-' +
    padStart(month, 2) +
    '-' +
    padStart(date, 2) +
    'T' +
    padStart(hours, 2) +
    ':' +
    padStart(minutes, 2) +
    ':' +
    padStart(sec, 2) +
    '.' +
    padStart(milliSeconds, 3) +
    'Z'
  );
}

/**
 * Generate ISO 8601 timestamp for eventTime using current timestamp
 */
function generateEventTime() {
  return convertTimestampToISO(getTimestampMillis());
}

/**
 * Create Basic Auth header from public and private keys
 */
function createAuthHeader(publicKey, secretKey) {
  const credentials = publicKey + ':' + secretKey;
  return 'Basic ' + toBase64(credentials);
}

/**
 * Check if string starts with a prefix (case insensitive)
 */
function startsWithIgnoreCase(str, prefix) {
  if (!str || !prefix) return false;
  const lowerStr = makeString(str).toLowerCase();
  const lowerPrefix = makeString(prefix).toLowerCase();
  return lowerStr.substring(0, lowerPrefix.length) === lowerPrefix;
}

/**
 * Build object data array from template parameters
 */
function buildObjectData() {
  const objectData = [];

  // Add passbackconversiontrackingid if provided
  if (data.passbackconversiontrackingid) {
    objectData.push({
      name: 'passbackconversiontrackingid',
      value: makeString(data.passbackconversiontrackingid)
    });
  }

  // Add additional object data from table
  if (data.objectDataTable && getType(data.objectDataTable) === 'array') {
    data.objectDataTable.forEach(function (row) {
      if (row.name && row.value) {
        // Validate field name doesn't start with 'rokt.' (case insensitive)
        if (!startsWithIgnoreCase(row.name, 'rokt.')) {
          objectData.push({
            name: makeString(row.name),
            value: makeString(row.value)
          });
        } else if (isDebug) {
          logToConsole(
            JSON.stringify({
              Name: 'RoktEventAPI',
              Type: 'Warning',
              Message: 'Skipping field "' + row.name + '" - rokt. prefix is reserved'
            })
          );
        }
      }
    });
  }

  return objectData;
}

/**
 * Build metadata array from template parameters
 */
function buildMetaData() {
  const metaData = [];

  // Add metadata from table
  if (data.metaDataTable && getType(data.metaDataTable) === 'array') {
    data.metaDataTable.forEach(function (row) {
      if (row.name && row.value) {
        // Validate field name doesn't start with 'rokt.' (case insensitive)
        if (!startsWithIgnoreCase(row.name, 'rokt.')) {
          metaData.push({
            name: makeString(row.name),
            value: makeString(row.value)
          });
        } else if (isDebug) {
          logToConsole(
            JSON.stringify({
              Name: 'RoktEventAPI',
              Type: 'Warning',
              Message: 'Skipping metadata field "' + row.name + '" - rokt. prefix is reserved'
            })
          );
        }
      }
    });
  }

  return metaData;
}

/**
 * Validate required parameters
 */
function validateParameters() {
  if (!data.accountId) {
    if (isDebug) {
      logToConsole(
        JSON.stringify({
          Name: 'RoktEventAPI',
          Type: 'Error',
          Message: 'Missing accountId'
        })
      );
    }
    return false;
  }

  const rpubRegex = createRegex('^rpub-');
  if (!data.rpub || !testRegex(rpubRegex, data.rpub)) {
    if (isDebug) {
      logToConsole(
        JSON.stringify({
          Name: 'RoktEventAPI',
          Type: 'Error',
          Message: 'Invalid Rokt Public Key format'
        })
      );
    }
    return false;
  }

  const rsecRegex = createRegex('^rsec-');
  if (!data.rsec || !testRegex(rsecRegex, data.rsec)) {
    if (isDebug) {
      logToConsole(
        JSON.stringify({
          Name: 'RoktEventAPI',
          Type: 'Error',
          Message: 'Invalid Rokt Secret Key format'
        })
      );
    }
    return false;
  }

  if (!data.eventType) {
    if (isDebug) {
      logToConsole(
        JSON.stringify({
          Name: 'RoktEventAPI',
          Type: 'Error',
          Message: 'Missing eventType'
        })
      );
    }
    return false;
  }

  return true;
}

/**
 * Parse JSON response safely
 */
function parseJsonSafe(jsonString) {
  const parsed = JSON.parse(jsonString);
  return parsed;
}

/**
 * Main execution function
 */
function main() {
  // Validate parameters
  if (!validateParameters()) {
    data.gtmOnFailure();
    return;
  }

  // Build event object
  const event = {
    clientEventId: generateClientEventId(),
    eventType: makeString(data.eventType),
    eventTime: generateEventTime(),
    objectData: buildObjectData()
  };

  // Add metadata if present
  const metaData = buildMetaData();
  if (metaData.length > 0) {
    event.metaData = metaData;
  }

  // Build request payload
  const requestBody = {
    accountId: makeString(data.accountId),
    events: [event]
  };

  // Build headers
  const headers = {
    'Content-Type': 'application/json',
    Charset: 'utf-8',
    'Rokt-Version': ROKT_VERSION,
    Authorization: createAuthHeader(data.rpub, data.rsec)
  };

  // Log request
  if (isDebug) {
    logToConsole(
      JSON.stringify({
        Name: 'RoktEventAPI',
        Type: 'Request',
        RequestMethod: 'POST',
        RequestUrl: API_ENDPOINT,
        RequestBody: requestBody,
        RequestHeaders: headers,
        EventDetails: {
          EventType: event.eventType,
          ClientEventId: event.clientEventId,
          EventTime: event.eventTime,
          ObjectDataCount: event.objectData.length,
          MetaDataCount: event.metaData ? event.metaData.length : 0
        }
      })
    );
  }

  // Send HTTP request
  sendHttpRequest(
    API_ENDPOINT,
    {
      headers: headers,
      method: 'POST',
      timeout: 5000
    },
    JSON.stringify(requestBody)
  ).then(
    function (result) {
      // Log response if in debug mode
      if (isDebug) {
        logToConsole(
          JSON.stringify({
            Name: 'RoktEventAPI',
            Type: 'Response',
            ResponseStatusCode: result.statusCode,
            ResponseHeaders: result.headers,
            ResponseBody: result.body
          })
        );
      }

      if (result.statusCode >= 200 && result.statusCode < 300) {
        // Parse response to check for unprocessed records
        const response = parseJsonSafe(result.body);
        if (response && response.data && response.data.unprocessedRecords) {
          if (response.data.unprocessedRecords.length > 0) {
            if (isDebug) {
              logToConsole(
                JSON.stringify({
                  Name: 'RoktEventAPI',
                  Type: 'Warning',
                  Message: 'Some records were not processed',
                  UnprocessedRecords: response.data.unprocessedRecords
                })
              );
            }
            // Still call success as HTTP status was 200, but log the issues
            data.gtmOnSuccess();
          } else {
            if (isDebug) {
              logToConsole(
                JSON.stringify({
                  Name: 'RoktEventAPI',
                  Type: 'Success',
                  Message: 'All events processed successfully'
                })
              );
            }
            data.gtmOnSuccess();
          }
        } else {
          data.gtmOnSuccess();
        }
      } else {
        if (isDebug) {
          logToConsole(
            JSON.stringify({
              Name: 'RoktEventAPI',
              Type: 'Error',
              Message: 'HTTP Error',
              StatusCode: result.statusCode,
              ErrorBody: result.body
            })
          );
        }
        data.gtmOnFailure();
      }
    },
    function (error) {
      if (isDebug) {
        logToConsole(
          JSON.stringify({
            Name: 'RoktEventAPI',
            Type: 'Error',
            Message: 'Request failed',
            Error: error
          })
        );
      }
      data.gtmOnFailure();
    }
  );
}

// Execute main function
main();
