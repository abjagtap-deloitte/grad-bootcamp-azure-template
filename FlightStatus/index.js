
// Create the basic authentication header here
var flightAwareBasePath = "https://flightxml.flightaware.com/json/FlightXML2/";
var flightAwareUsername = process.env["flightAwareUsername"]
var flightAwarePassword = process.env["flightAwarePassword"]

//TODO:  Create base64 encoded string using the username and password
var flightAwareAuthHeader = "" // TODO: replace with base64 encoded

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    
    if (/*TODO: Validate query parameters exist and are not empty*/ req.query ) {

        // If we get here it means all the required parameters are passed in as part of the request

    } else {
        // if we get here it mean no query params were given to return error response
        context.res = {
            status: 200, // TODO: replce with appropriate error response code
            body : "" // TODO: set appropriate error message
        }
    }

};
