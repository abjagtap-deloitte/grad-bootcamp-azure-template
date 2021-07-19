// Create the basic authentication header here
// https://flightaware.com/commercial/aeroapi/documentation2.rvt -->  REST / JSON section
var flightAwareBasePath = "https://flightxml.flightaware.com/json/FlightXML2/";
var flightAwareUsername = process.env["flightAwareUsername"]
var flightAwarePassword = process.env["flightAwarePassword"]

//TODO:  Create base64 encoded string using the username and password
var flightAwareAuthHeader = "" // TODO: replace with base64 encoded

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    
    if (/*TODO: Validate query parameters exist (flightNumber and departureTime) and are not empty*/ req.query ) {
        
        // We can now access the parameters since we know they exist

        let flightNumbner = ""; // TODO: assign to correct value from the request parameters
        let departureTime = ""; // TODO: assign to correct value from the request parameters

        /**
         * You'll you need to utilise FlightInfoEX API to get information of a flight
         * https://flightaware.com/commercial/aeroapi/explorer/#op_FlightInfoEx
         * 
         * From the API's documentation we can see that a flight ID (ident) is required.
         * One of the option is to pass in "ident@departureTime" as the ident which will identify a flight to get information about that flight 
         * 
         * So to request information from the API we first need to create this ident
         */

        // This function will return ident@departureTime format for the given flight ID and departure Time
        let flightId = getFlightId(context, flightNumber, departureTime); // TODO: Complete this function       
        context.log('flightId: ' + flightId);

        // Make a request to FlightInfoEx API and get the response
        let flightInfoResponseBody = await getFlightInfo(context, flightId);

        /* If response is not returned log appropriate error */
        if ( flightInfoResponseBody == null ) {
            context.log.error(''); //TODO: Enter appropriate error message
        } 
        
        // A response is returned but the returned response does not contain any data, which means given flight was not found
        if ( /* TODO: replace condition to check that response body is contains flight not found message */ flightInfoResponseBody) {
            
        } else {
            /**
             * The flight provided was found and flight information was returned. We can now apply our business rules
             * 
             * use getClaimRefundRules(flightInfo) --> a function to apply the business rules and return a response based on the given flightInfo
             * 
             * e.g. 
             *  let claimRefundRules = getClaimRefundRules(flightInfo);
                context.res = {
                    status: 200, 
                    body: claimRefundRules
                };
             */

        }

    } else {
        // if we get here it means no query params were given or they were empty.
        // return error response
        context.res = {
            status: 200, // TODO: replce with appropriate error response code
            body : "" // TODO: set appropriate error message
        };
    }

};

/**
 * https://flightaware.com/commercial/aeroapi/documentation2.rvt --> Documentation for what HTTP header is expected
 * 
 * Given the flightId return the flightInfo using the FlightAware FlightInfoEx API
 * 
 * @param {string} flightId ident (flightNumber@departimeTime)
 * @returns the response from FlightAware FlightInfoEx API
 */
async function getFlightInfo(context, flightId) {
    let request = require('request');
    let url = flightAwareBasePath + "FlightInfoEx";
    let queryParams = { 'ident': flightId };
    let headers = ""; //TODO: Create Authorization header object using the flightAwareAuthHeader variable (declared the top of the file)
    context.log(url + '?' + queryParams);

    /** If you're familar with axios https://github.com/axios/axios you can use that too */
    return new Promise((resolve, reject) => {
        request({
            url:url, 
            qs:queryParams, 
            headers:headers, 
            method: 'GET'
            }, 
            function(err, response, body) {
                if (!err && response.statusCode == 200) {
                    resolve(body);
                }
                else {
                    reject(err);
                }
            }
        );
    });
}

function getFlightId(context, flightNumber, departureTime) {
    /** 
     * The FlightInfoEx API requires departure time to be in a special format
     * "Times are in integer seconds since 1970 (UNIX epoch time), except for estimated time enroute, which is in hours and minutes."
     * 
     * The departureTime passed in as request parameters is not in that format, we need to first convert the time to 
     * UNIX epoch time before the ident can be created.
     * 
     * https://www.epochconverter.com/
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date 
     * 
     * e.g. 2021-07-06T05:55:00+10:00 is 1625514900
     */

    // TODO: convert given departureTime to the required epoch time.
    let departureTimeEpoch = "";

    /**
     * return ident
     * 
     * e.g flightNumber = VOZ304 & departureTime = '2021-07-06T05:55:00+10:00'
     * return VOZ304@1625514900
     */ 

    return flightNumber + "@" + (departureTimeEpoch);

}


/**
 * The given parameter contains all the flight information.
 * Apply the business rules as stated here https://hub.deloittedigital.com.au/wiki/pages/viewpage.action?spaceKey=DTD&title=X+Claims+management+-+user+stories
 * and return an output as per https://hub.deloittedigital.com.au/wiki/pages/viewpage.action?pageId=326390761#BuildaServerlessAPIonAzure(FlightStatus)-AzureFunctionSpecs 
 * e.g. output 
 * 
    {
        "id":"VOZ304@1625514900",
        "flightStatus":"cancelled",
        "scheduleDepatureTime":"2021-07-06T05:55:00.000",
        "actualDepartureTime":null,
        "actualArrivalTime":null,
        "delayInMinutes":null,
        "refund":300
    }
 * @param {*} flightInfo information about a flight (in this format https://flightaware.com/commercial/aeroapi/explorer/#op_FlightInfoEx)
 * @returns An object that that contains flight status, id and refund is applicable
 */
function getClaimRefundRules(flightInfo) {

    let refund = 0; // variable to store the refund amount
    let delayInMinutes = null; // variable to store the flight delay (in minutes)
    let flightStatus = ""; // variable to store the flight status

    /**
     * TODO: Convert the filed_departuretime, actualdeparturetime & actualarrivaltime from time in seconds since 1970 to a Date & Time.
     * 
     * Helpful links
     * - https://flightaware.com/commercial/aeroapi/explorer/#op_FlightInfoEx 
     * - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset 
     * - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
     * 
     * Note: actualarrivaltime & actualdeparturetime will be 0 if not yet occured. 
     *  actualarrivaltime will be -1 if the flight will never depart (i.e. cancelled)
     * 
     */


    /* Check that there is a delay in flight departure by comparing the scheduled departure time with the actual departure time
     * If there is a delay then update the delayInMinutes variable with the correct value
     */
    // TODO: update delayInMinutes variable
    
    
    // TODO: check if flight status should be one of "scheduled", "cancelled", "delayed" or "on time" by using the delayInMinutes variable
    // and set the correct refund value
    // TODO: update flightStatus and refund variables

    // Return the response
    let claimRefundRules = {
        id: flightInfo.ident + '@' + flightInfo.filed_departuretime,
        flightStatus: flightStatus,
        scheduleDepatureTime: scheduleDepatureTime,
        actualDepartureTime: actualDepartureTime,
        actualArrivalTime: actualArrivalTime,
        delayInMinutes: delayInMinutes,
        refund: refund
    }
    return claimRefundRules;
}