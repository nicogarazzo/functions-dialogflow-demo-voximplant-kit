const VoximplantKit = require('voximplant-kit-sdk').default
const axios = require('axios')
const dialogflow = require('@google-cloud/dialogflow')
const uuid = require('uuid')
// kit.incomingMessage.current_request.id
async function runSample(projectId = 'your-project-id', text, session_id) {
  // A unique identifier for the given session
  const sessionId = (session_id == true?uuid.v4():session_id);
  const credentials = {
  client_email: 'YOUR ACCOUNT CREDENTIALS',
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDCnppfr8rlGXH4\nN06siOUpf0aTEkCKf0Uov8KS5H9CkR8mF8rYq+7J\n-----END PRIVATE KEY-----\n"
};
  // Create a new session
  const sessionClient = new dialogflow.SessionsClient({projectId, credentials});
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        // The query to send to the dialogflow agent
        text: text,
        // The language used by the client (en-US)
        languageCode: 'en-US',
      },
    },
  };
  // Send request and log result
  const responses = await sessionClient.detectIntent(request);
  console.log('Detected intent');
  const result = responses[0].queryResult;
  console.log(`  Query: ${result.queryText}`);
  console.log(`  Response: ${result.fulfillmentText}`);
  if (result.intent) {
    console.log(`  Intent: ${result.intent.displayName}`);
  } else {
    console.log(`  No intent matched.`);
  }
  return result
}
module.exports = async function(context, callback) {
  var kit = new VoximplantKit(context)
  var result
  console.log('start', new Date())
  // await kit.loadDatabases()
  // check if we have dialogflow session_id for the current request
  console.log(kit.incomingMessage.conversation.current_request)
  // let session_id = kit.dbGet(kit.incomingMessage.conversation.current_request.id)
  session_id = "session-" + kit.incomingMessage.conversation.current_request.id.toString()
  console.log('Session id: ' + session_id)
  if (session_id == null) result = await runSample('rtpventures-ynyxbj',  kit.incomingMessage.text, true)
  else result = await runSample('rtpventures-ynyxbj',  kit.incomingMessage.text, session_id)
  //console.log(result)
  if (result.diagnosticInfo && result.diagnosticInfo.fields && result.diagnosticInfo.fields.end_conversation) {
      console.log('FINISH!')
      if (result.intent.displayName == 'to-operator') {
          console.log('transferToQueue')
          kit.transferToQueue({ queue_name: 'SomeTestQueue' })
          callback(200, kit.getResponseBody())
      } else {
          kit.finishRequest()
      }
  } else {
    kit.replyMessage.text = result.fulfillmentText
    // Формируем текст ответного сообщения, используя имя написавшего клиента
    // kit.replyMessage.text = 'Добрый день, ' +  kit.incomingMessage.client_data.client_display_name + '!' 123
    // Возвращаем ответное сообщение
    console.log('end', new Date())
    callback(200, kit.getResponseBody())
  }
}
