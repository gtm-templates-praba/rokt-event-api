/********************************************
 * 1. Missing Account ID - Should Fail
 */
const mockData = {
  // accountId missing
  rpub: 'rpub-1234-5678',
  rsec: 'rsec-abcd-efgh',
  eventType: 'sign_up'
};

runCode(mockData);

// Should fail due to missing accountId
assertApi('gtmOnFailure').wasCalled();
assertApi('gtmOnSuccess').wasNotCalled();

/********************************************
 * 2. Empty Account ID - Should Fail
 ********************************************/
const mockData = {
  accountId: '',
  rpub: 'rpub-1234-5678',
  rsec: 'rsec-abcd-efgh',
  eventType: 'sign_up'
};

runCode(mockData);

// Should fail due to empty accountId
assertApi('gtmOnFailure').wasCalled();
assertApi('gtmOnSuccess').wasNotCalled();

/********************************************
 * 3. Invalid Rokt Public Key Format - Should Fail
 ********************************************/
const mockData = {
  accountId: 'test-account-123',
  rpub: 'invalid-key-format',
  rsec: 'rsec-abcd-efgh',
  eventType: 'sign_up'
};

runCode(mockData);

// Should fail due to invalid rpub format
assertApi('gtmOnFailure').wasCalled();
assertApi('gtmOnSuccess').wasNotCalled();

/********************************************
 * 4. Missing Rokt Public Key - Should Fail
 ********************************************/
const mockData = {
  accountId: 'test-account-123',
  // rpub missing
  rsec: 'rsec-abcd-efgh',
  eventType: 'sign_up'
};

runCode(mockData);

// Should fail due to missing rpub
assertApi('gtmOnFailure').wasCalled();
assertApi('gtmOnSuccess').wasNotCalled();

/********************************************
 * 5. Invalid Rokt Secret Key Format - Should Fail
 ********************************************/
const mockData = {
  accountId: 'test-account-123',
  rpub: 'rpub-1234-5678',
  rsec: 'invalid-secret-format',
  eventType: 'sign_up'
};

runCode(mockData);

// Should fail due to invalid rsec format
assertApi('gtmOnFailure').wasCalled();
assertApi('gtmOnSuccess').wasNotCalled();

/********************************************
 * 6. Missing Rokt Secret Key - Should Fail
 ********************************************/
const mockData = {
  accountId: 'test-account-123',
  rpub: 'rpub-1234-5678',
  // rsec missing
  eventType: 'sign_up'
};

runCode(mockData);

// Should fail due to missing rsec
assertApi('gtmOnFailure').wasCalled();
assertApi('gtmOnSuccess').wasNotCalled();

/********************************************
 * 7. Missing Event Type - Should Fail
 ********************************************/
const mockData = {
  accountId: 'test-account-123',
  rpub: 'rpub-1234-5678',
  rsec: 'rsec-abcd-efgh'
  // eventType missing
};

runCode(mockData);

// Should fail due to missing eventType
assertApi('gtmOnFailure').wasCalled();
assertApi('gtmOnSuccess').wasNotCalled();

/********************************************
 * 8. Empty Event Type - Should Fail
 ********************************************/
const mockData = {
  accountId: 'test-account-123',
  rpub: 'rpub-1234-5678',
  rsec: 'rsec-abcd-efgh',
  eventType: ''
};

runCode(mockData);

// Should fail due to empty eventType
assertApi('gtmOnFailure').wasCalled();
assertApi('gtmOnSuccess').wasNotCalled();

/********************************************
 * 9. Valid Parameters with Optional Fields
 ********************************************/
const mockData = {
  accountId: 'test-account-123',
  rpub: 'rpub-1234-5678',
  rsec: 'rsec-abcd-efgh',
  eventType: 'purchase',
  passbackconversiontrackingid: 'tracking-123-456',
  objectDataTable: [
    { name: 'email', value: 'test@example.com' },
    { name: 'amount', value: '99.99' }
  ],
  metaDataTable: [
    { name: 'source', value: 'website' },
    { name: 'campaign', value: 'summer2024' }
  ]
};

// Mock the sendHttpRequest with a function that returns a mock promise-like object
mock('sendHttpRequest', (url, options, body) => {
  return {
    then: (successCallback, errorCallback) => {
      // Call the success callback with our mock response
      successCallback({
        statusCode: 200,
        body: '{"data":{"unprocessedRecords":[]}}'
      });
    }
  };
});

mock('getTimestampMillis', 1642684800000);

runCode(mockData);

assertApi('gtmOnSuccess').wasCalled();
assertApi('gtmOnFailure').wasNotCalled();

/********************************************
 * 10. Valid Parameters - All Required Fields Present
 ********************************************/
// Test with all valid required parameters
const mockData = {
  accountId: 'test-account-123',
  rpub: 'rpub-1234-5678',
  rsec: 'rsec-abcd-efgh',
  eventType: 'sign_up'
};

// Mock the sendHttpRequest with a function that returns a mock promise-like object
mock('sendHttpRequest', (url, options, body) => {
  return {
    then: (successCallback, errorCallback) => {
      // Call the success callback with our mock response
      successCallback({
        statusCode: 200,
        body: '{"data":{"unprocessedRecords":[]}}'
      });
    }
  };
});

// Mock timestamp for consistent testing
mock('getTimestampMillis', 1642684800000);

runCode(mockData);

// Verify successful execution
assertApi('gtmOnSuccess').wasCalled();
assertApi('gtmOnFailure').wasNotCalled();

/********************************************
 * 11. Rokt Reserved Prefix Filter Test
 ********************************************/
const mockData = {
  accountId: 'test-account-123',
  rpub: 'rpub-1234-5678',
  rsec: 'rsec-abcd-efgh',
  eventType: 'conversion',
  objectDataTable: [
    { name: 'validField', value: 'validValue' },
    { name: 'rokt.reserved', value: 'shouldBeFiltered' },
    { name: 'ROKT.UPPERCASE', value: 'shouldAlsoBeFiltered' }
  ],
  metaDataTable: [
    { name: 'validMeta', value: 'validMetaValue' },
    { name: 'rokt.metaReserved', value: 'shouldBeFilteredToo' }
  ]
};

// Mock the sendHttpRequest with verification
mock('sendHttpRequest', (url, options, body) => {
  // Verify that valid fields are included and rokt.* fields are filtered out
  assertThat(body).contains('validField');
  assertThat(body).contains('validValue');
  assertThat(body).contains('validMeta');
  assertThat(body).contains('validMetaValue');

  // Verify rokt.* prefixed fields are NOT included
  assertThat(body).doesNotContain('rokt.reserved');
  assertThat(body).doesNotContain('ROKT.UPPERCASE');
  assertThat(body).doesNotContain('rokt.metaReserved');

  return {
    then: (successCallback, errorCallback) => {
      successCallback({
        statusCode: 200,
        body: '{"data":{"unprocessedRecords":[]}}'
      });
    }
  };
});

mock('getTimestampMillis', 1642684800000);

runCode(mockData);

assertApi('gtmOnSuccess').wasCalled();
assertApi('gtmOnFailure').wasNotCalled();
