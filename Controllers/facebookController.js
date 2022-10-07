//libraries
const express = require("express");
const router = express.Router();

//files
const config = require("../config");
const respond = require("./respondController");

//mongodb models
const Users = require("../Models/Users");
const { default: axios } = require("axios");

// Messenger API parameters
if (!config.FB_PAGE_TOKEN) {
  throw new Error("missing FB_PAGE_TOKEN");
}
if (!config.FB_VERIFY_TOKEN) {
  throw new Error("missing FB_VERIFY_TOKEN");
}
if (!config.GOOGLE_PROJECT_ID) {
  throw new Error("missing GOOGLE_PROJECT_ID");
}
if (!config.DF_LANGUAGE_CODE) {
  throw new Error("missing DF_LANGUAGE_CODE");
}
if (!config.GOOGLE_CLIENT_EMAIL) {
  throw new Error("missing GOOGLE_CLIENT_EMAIL");
}
if (!config.GOOGLE_PRIVATE_KEY) {
  throw new Error("missing GOOGLE_PRIVATE_KEY");
}
if (!config.FB_APP_SECRET) {
  throw new Error("missing FB_APP_SECRET");
}

// for Facebook verification
router.get("/webhook/", function (req, res) {
  if (
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === config.FB_VERIFY_TOKEN
  ) {
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

//for webhook facebook
router.post("/webhook/", function (req, res) {
  var data = req.body;
  // Make sure this is a page subscription
  if (data.object == "page") {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function (pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function (messagingEvent) {
        if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else {
          console.log(
            "Webhook received unknown messagingEvent: ",
            messagingEvent
          );
        }
      });
    });

    // Assume all went well.
    // You must send back a 200, within 20 seconds
    res.sendStatus(200);
  }
});

async function receivedMessage(event) {
  var senderId = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  console.log(
    "Received message for user %d and page %d at %d with message:",
    senderId,
    recipientID,
    timeOfMessage
  );

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  if (isEcho) {
    //handleEcho(messageId, appId, metadata);
    return;
  } else if (quickReply) {
    handleQuickReply(senderId, quickReply, messageId);
    return;
  }

  saveUserData(senderId);

  if (messageText) {
    //send message to dialogflow
    console.log("MENSAJE DEL USUARIO: ", messageText);
    await respond.sendToDialogFlow(senderId, messageText);
  } else if (messageAttachments) {
    handleMessageAttachments(messageAttachments, senderId);
  }
}

async function saveUserData(facebookID) {
  let userData = await getUserData(facebookID);
  let chatUser = new Users({
    firstName: userData.first_name,
    lastName: userData.last_name,
    facebookId: facebookID,
  });
  chatUser.save((err, res) => {
    if (err) return console.log(err);
    console.log("Se creó un Usuario: ", res);
  });
}

async function getUserData(senderId) {
  console.log("consiguiendo datos del usuario...");
  let access_token = config.FB_PAGE_TOKEN;
  try {
    let userData = await axios.get(
      "https://graph.facebook.com/v6.0/" + senderId,
      {
        params: {
          access_token,
        },
      }
    );

    return userData.data;
  } catch (err) {
    console.log("¡¡¡¡¡¡¡¡¡¡¡¡¡DATOS DEL USUARIO!!!!!!!!!!!!!");
    console.log(userData.data);
    console.log("algo salio mal en axios getUserData: ", err);
    return {
      first_name: "",
      last_name: "",
      profile_pic: "",
    };
  }
}

function handleMessageAttachments(messageAttachments, senderId) {
  //for now just reply
  respond.sendTextMessage(senderId, "Archivo adjunto recibido... gracias! .");
}

async function handleQuickReply(senderId, quickReply, messageId) {
  let quickReplyPayload = quickReply.payload;
  console.log(
    "Quick reply for message %s with payload %s",
    messageId,
    quickReplyPayload
  );
  this.elements = a;
  // send payload to api.ai
  respond.sendToDialogFlow(senderId, quickReplyPayload);
}

async function receivedPostback(event) {
  var senderId = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  var payload = event.postback.payload;
  switch (payload) {
    case "Ver Información0":
      respond.setIndex(0);
      respond.sendToDialogFlow(senderId, payload);
      break;
    case "Ver Información1":
      respond.setIndex(1);
      respond.sendToDialogFlow(senderId, payload);
      break;
    case "Ver Información2":
      respond.setIndex(2);
      respond.sendToDialogFlow(senderId, payload);
      break;
    case "Ver Información3":
      respond.setIndex(3);
      respond.sendToDialogFlow(senderId, payload);
      break;
    case "Ver Información4":
      respond.setIndex(4);
      respond.sendToDialogFlow(senderId, payload);
      break;
    default:
      //unindentified payload
      respond.sendToDialogFlow(senderId, payload);
      break;
  }

  console.log(
    "Received postback for user %d and page %d with payload '%s' " + "at %d",
    senderId,
    recipientID,
    payload,
    timeOfPostback
  );
}

module.exports = router;
