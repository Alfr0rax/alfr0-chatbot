const express = require("express");
const request = require("request");
const uuid = require("uuid");
const axios = require("axios");
//files
const config = require("../config");
const dialogflow = require("../dialogflow");
const { structProtoToJson } = require("../Facebook/helpers/structFunctions");

const sessionIds = new Map();

async function handleDialogFlowAction(
    sender,
    action,
    messages,
    contexts,
    parameters
  ) {
    switch (action) {
      default:
        //unhandled action, just send back the text
        handleMessages(messages, sender);
    }
  }



async function sendToDialogFlow(senderId, messageText) {
    sendTypingOn(senderId);
    try {
      let result;
      setSessionAndUser(senderId);
      let session = sessionIds.get(senderId);
      result = await dialogflow.sendToDialogFlow(
        messageText,
        session,
        "FACEBOOK"
      );
      handleDialogFlowResponse(senderId, result);
    } catch (error) {
      console.log("salio mal en sendToDialogflow...", error);
    }
  }

async function handleMessage(message, sender) {
    switch (message.message) {
      case "text": // text
        for (const text of message.text.text) {
          if (text !== "") {
            await sendTextMessage(sender, text);
          }
        }
        break;
      case "quickReplies": // quick replies
        let replies = [];
        message.quickReplies.quickReplies.forEach((text) => {
          let reply = {
            content_type: "text",
            title: text,
            payload: text,
          };
          replies.push(reply);
        });
        await sendQuickReply(sender, message.quickReplies.title, replies);
        break;
      case "image": // image
        await sendImageMessage(sender, message.image.imageUri);
        break;
      case "payload":
        let desestructPayload = structProtoToJson(message.payload);
        var messageData = {
          recipient: {
            id: sender,
          },
          message: desestructPayload.facebook,
        };
        await callSendAPI(messageData);
        break;
      default:
        break;
    }
  }
  
  async function handleCardMessages(messages, sender) {
    let elements = [];
    for (let m = 0; m < messages.length; m++) {
      let message = messages[m];
      let buttons = [];
      for (let b = 0; b < message.card.buttons.length; b++) {
        let isLink = message.card.buttons[b].postback.substring(0, 4) === "http";
        let button;
        if (isLink) {
          button = {
            type: "web_url",
            title: message.card.buttons[b].text,
            url: message.card.buttons[b].postback,
          };
        } else {
          button = {
            type: "postback",
            title: message.card.buttons[b].text,
            payload:
              message.card.buttons[b].postback === ""
                ? message.card.buttons[b].text
                : message.card.buttons[b].postback,
          };
        }
        buttons.push(button);
      }
  
      let element = {
        title: message.card.title,
        image_url: message.card.imageUri,
        subtitle: message.card.subtitle,
        buttons,
      };
      elements.push(element);
    }
    await sendGenericMessage(sender, elements);
  }
  
  async function handleMessages(messages, sender) {
    try {
      let i = 0;
      let cards = [];
      while (i < messages.length) {
        switch (messages[i].message) {
          case "card":
            for (let j = i; j < messages.length; j++) {
              if (messages[j].message === "card") {
                cards.push(messages[j]);
                i += 1;
              } else j = 9999;
            }
            await handleCardMessages(cards, sender);
            cards = [];
            break;
          case "text":
            await handleMessage(messages[i], sender);
            break;
          case "image":
            await handleMessage(messages[i], sender);
            break;
          case "quickReplies":
            await handleMessage(messages[i], sender);
            break;
          case "payload":
            await handleMessage(messages[i], sender);
            break;
          default:
            break;
        }
        i += 1;
      }
    } catch (error) {
      console.log(error);
    }
  }
  
  function handleDialogFlowResponse(sender, response) {
    let responseText = response.fulfillmentMessages.fulfillmentText;
    let messages = response.fulfillmentMessages;
    let action = response.action;
    let contexts = response.outputContexts;
    let parameters = response.parameters;
  
    sendTypingOff(sender);
  
    if (isDefined(action)) {
      handleDialogFlowAction(sender, action, messages, contexts, parameters);
    } else if (isDefined(messages)) {
      handleMessages(messages, sender);
    } else if (responseText == "" && !isDefined(action)) {
      //dialogflow could not evaluate input.
      sendTextMessage(sender, "No entiendo lo que trataste de decir ...");
    } else if (isDefined(responseText)) {
      sendTextMessage(sender, responseText);
    }
  }

  async function setSessionAndUser(senderId) {
    try {
      if (!sessionIds.has(senderId)) {
        sessionIds.set(senderId, uuid.v1());
      }
    } catch (error) {
      throw error;
    }
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
      console.log("algo salio mal en axios getUserData: ", err);
      return {
        first_name: "",
        last_name: "",
        profile_pic: "",
      };
    }
  }
  async function sendTextMessage(recipientId, text) {
    if (text.includes("{first_name}") || text.includes("{last_name}")) {
      let userData = await getUserData(recipientId);
      text = text
        .replace("{first_name}", userData.first_name)
        .replace("{last_name}", userData.last_name);
    }
    var messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        text: text,
      },
    };
    await callSendAPI(messageData);
  }

    //Send an image using the Send API.   
  async function sendImageMessage(recipientId, imageUrl) {
    var messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        attachment: {
          type: "image",
          payload: {
            url: imageUrl,
          },
        },
      },
    };
    await callSendAPI(messageData);
  }

    //Send a button message using the Send API.
  async function sendButtonMessage(recipientId, text, buttons) {
    var messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: text,
            buttons: buttons,
          },
        },
      },
    };
    await callSendAPI(messageData);
  }

  async function sendGenericMessage(recipientId, elements) {
    var messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: elements,
          },
        },
      },
    };
  
    await callSendAPI(messageData);
  }  

  //Send a message with Quick Reply buttons.    
  async function sendQuickReply(recipientId, text, replies, metadata) {
    var messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        text: text,
        metadata: isDefined(metadata) ? metadata : "",
        quick_replies: replies,
      },
    };
  
    await callSendAPI(messageData);
  }  

  //Turn typing indicator on    
  function sendTypingOn(recipientId) {
    var messageData = {
      recipient: {
        id: recipientId,
      },
      sender_action: "typing_on",
    };
  
    callSendAPI(messageData);
  }  

  //Turn typing indicator off    
  function sendTypingOff(recipientId) {
    var messageData = {
      recipient: {
        id: recipientId,
      },
      sender_action: "typing_off",
    };
  
    callSendAPI(messageData);
  }

  /*Call the Send API. The message data goes in the body. If successful, we'll
  get the message id in a response*/
  function callSendAPI(messageData) {
    return new Promise((resolve, reject) => {
      request(
        {
          uri: "https://graph.facebook.com/v6.0/me/messages",
          qs: {
            access_token: config.FB_PAGE_TOKEN,
          },
          method: "POST",
          json: messageData,
        },
        function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;
  
            if (messageId) {
              console.log(
                "Successfully sent message with id %s to recipient %s",
                messageId,
                recipientId
              );
            } else {
              console.log(
                "Successfully called Send API for recipient %s",
                recipientId
              );
            }
            resolve();
          } else {
            reject();
            console.error(
              "Failed calling Send API",
              response.statusCode,
              response.statusMessage,
              body.error
            );
          }
        }
      );
    });
  }

  function isDefined(obj) {
    if (typeof obj == "undefined") {
      return false;
    }
  
    if (!obj) {
      return false;
    }
  
    return obj != null;
  }

module.exports = {
    handleDialogFlowAction,
    handleMessage,
    handleCardMessages,
    handleMessages,
    sendToDialogFlow,
    handleDialogFlowResponse,
    sendTextMessage
}
