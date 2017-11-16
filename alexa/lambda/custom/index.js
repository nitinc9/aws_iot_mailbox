/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * The mailbox Alexa skill.
 */

'use strict';
const Alexa = require('alexa-sdk');

//=========================================================================================================================================
//TODO: Replace this data with your skill.
//=========================================================================================================================================
// Replace with your skill's App ID
//const APP_ID = undefined;
const APP_ID = 'amzn1.ask.skill.fcca8fcb-b2e0-4221-819a-a1ecbbe44d02';

const SKILL_NAME = 'Mailbox';
const HELP_MESSAGE = 'You can say check mail or do I have mail?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';

//=========================================================================================================================================
//TODO: Replace this data with your test IOT device.
//=========================================================================================================================================
const IOT_BROKER_ENDPOINT = "a1t29bkg2wt9ft.iot.us-east-1.amazonaws.com";
const IOT_BROKER_REGION = "us-east-1";
const IOT_THING_NAME = "MyMailbox";

/** Main event handler. */
exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.appId = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

/** Intent handlers. */
const handlers = {
    'LaunchRequest': function () {
      this.emit('CheckMailIntent');
    },
    'CheckMailIntent': function () {
      var intent = this;
      var config = {};
      config.IOT_BROKER_ENDPOINT = IOT_BROKER_ENDPOINT.toLowerCase();
      config.IOT_BROKER_REGION = IOT_BROKER_REGION;
      config.IOT_THING_NAME = IOT_THING_NAME;
      
      //Loading AWS SDK libraries
      var AWS = require('aws-sdk');
      AWS.config.region = config.IOT_BROKER_REGION;
      
      //Initializing client for IoT
      var iotData = new AWS.IotData({endpoint: config.IOT_BROKER_ENDPOINT});
      var params = {
        "thingName": config.IOT_THING_NAME
      };
      iotData.getThingShadow(params, function(err, data) {
        if (err) {
          console.log("Error getting thing: " + err);
          callback(err);
        }
        else {
          console.log("Device data: " + JSON.stringify(data));
          var payload = JSON.parse(data.payload);
          var hasMail = payload.state.desired.hasMail;
          var msg = "You do not have mail";
          if (hasMail === 'true') {
              msg = "You have got mail";
          }
          var speechOutput = msg;
          intent.response.speak(speechOutput);
          intent.emit(':responseReady');
        }
      });
    },
    'ResetMailboxIntent': function () {
      var intent = this;
      var config = {};
      config.IOT_BROKER_ENDPOINT = IOT_BROKER_ENDPOINT.toLowerCase();
      config.IOT_BROKER_REGION = IOT_BROKER_REGION;
      config.IOT_THING_NAME = IOT_THING_NAME;
      
      //Loading AWS SDK libraries
      var AWS = require('aws-sdk');
      AWS.config.region = config.IOT_BROKER_REGION;
      
      //Initializing client for IoT
      var iotData = new AWS.IotData({endpoint: config.IOT_BROKER_ENDPOINT});
      var payload = {
        "state": {
          "desired": {
              "isOpen": "false",
              "hasMail": "false"
          },
          "reported": {
              "isOpen": "false",
              "hasMail": "false"
          }
        }
      };
      var params = {
        "thingName": config.IOT_THING_NAME,
        "payload": JSON.stringify(payload)
      };
      iotData.updateThingShadow(params, function(err, data) {
        if (err) {
          console.log("Error updating thing: " + err);
          callback(err);
        }
        else {
          console.log("Device data: " + JSON.stringify(data));
          var payload = JSON.parse(data.payload);
          var hasMail = payload.state.desired.hasMail;
          var msg = "Your mailbox has been cleared.";
          var speechOutput = msg;
          intent.response.speak(speechOutput);
          intent.emit(':responseReady');
        }
      });
    },
    'AMAZON.HelpIntent': function () {
      const speechOutput = HELP_MESSAGE;
      const reprompt = HELP_REPROMPT;

      this.response.speak(speechOutput).listen(reprompt);
      this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
      this.response.speak(STOP_MESSAGE);
      this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
      this.response.speak(STOP_MESSAGE);
      this.emit(':responseReady');
    },
};
