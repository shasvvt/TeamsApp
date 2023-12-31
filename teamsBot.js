const { TeamsActivityHandler, CardFactory, TurnContext, MessageFactory } = require("botbuilder");
const rawWelcomeCard = require("./adaptiveCards/welcome.json");
const rawLearnCard = require("./adaptiveCards/learn.json");
const cardTools = require("@microsoft/adaptivecards-tools");
const test = require("./adaptiveCards/test.json");
const ACData = require("adaptivecards-templating");
const { TaskModuleResponseFactory } = require('./models/taskmoduleresponsefactory');

class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();

    // record the likeCount
    this.likeCountObj = { likeCount: 0 };

    this.onMessage(async (context, next) => {
      console.log("Running with Message Activity.");
      let txt = context.activity.text;
      const removedMentionText = TurnContext.removeRecipientMention(context.activity);
      if (removedMentionText) {
        // Remove the line break
        txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
      }

      // Trigger command by IM text
      switch (txt) {
        case "welcome": {
          const card = cardTools.AdaptiveCards.declareWithoutData(rawWelcomeCard).render();
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }
        case "learn": {
          this.likeCountObj.likeCount = 0;
          const card = cardTools.AdaptiveCards.declare(rawLearnCard).render(this.likeCountObj);
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }
        case "hi": {
          // Create a Template instance from the template payload
          const template = new ACData.Template(test);
          const cardPayload = template.expand({
            $root: {
              "fullname": "Shaswat",
              "places": [
                {
                  "title": "Albania",
                  "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Flag_of_Albania.svg/2560px-Flag_of_Albania.svg.png",
                  "days": "10",
                  "description": "Albania Description"
                },
                {
                  "title": "Deutschland",
                  "image": "https://upload.wikimedia.org/wikipedia/en/thumb/b/ba/Flag_of_Germany.svg/2560px-Flag_of_Germany.svg.png",
                  "days": "4",
                  "description": "Deutschland Description"
                }
              ],
              "email": "shasvvt@shasvvt.onmicro.com"
            }
          });
          //  const card = cardTools.AdaptiveCards.declareWithoutData(template).render();
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(cardPayload)] });
          break;
        }

      }

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    // Listen to MembersAdded event, view https://docs.microsoft.com/en-us/microsoftteams/platform/resources/bot-v3/bots-notifications for more events
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id) {
          const card = cardTools.AdaptiveCards.declareWithoutData(rawWelcomeCard).render();
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }
      }
      await next();
    });
  }

  // Invoked when an action is taken on an Adaptive Card. The Adaptive Card sends an event to the Bot and this
  // method handles that event.
  async onAdaptiveCardInvoke(context, invokeValue) {
    // The verb "userlike" is sent from the Adaptive Card defined in adaptiveCards/learn.json
    if (invokeValue.action.verb === "userlike") {
      this.likeCountObj.likeCount++;
      const card = cardTools.AdaptiveCards.declare(rawLearnCard).render(this.likeCountObj);
      await context.updateActivity({
        type: "message",
        id: context.activity.replyToId,
        attachments: [CardFactory.adaptiveCard(card)],
      });
      return { statusCode: 200 };
    }
  }


  handleTeamsTaskModuleFetch(context, taskModuleRequest) {
    // Called when the user selects an options from the displayed HeroCard or
    // AdaptiveCard.  The result is the action to perform.

    var taskInfo = {}; // TaskModuleTaskInfo

    taskInfo.card = this.createAdaptiveCardAttachment();
    this.setTaskInfo(taskInfo, {
      title: "Task Module Demo",
      width: 400,
      heigth: 200
    })

    return TaskModuleResponseFactory.toTaskModuleResponse(taskInfo);
  }

  async handleTeamsTaskModuleSubmit(context, taskModuleRequest) {
    // Called when data is being returned from the selected option (see `handleTeamsTaskModuleFetch').

    // Echo the users input back.  In a production bot, this is where you'd add behavior in
    // response to the input.
    await context.sendActivity(MessageFactory.text('handleTeamsTaskModuleSubmit: ' + JSON.stringify(taskModuleRequest.data)));

    // Return TaskModuleResponse
    return {
      // TaskModuleMessageResponse
      task: {
        type: 'message',
        value: 'Thanks!'
      }
    };
  }

  setTaskInfo(taskInfo, uiSettings) {
    taskInfo.height = uiSettings.height;
    taskInfo.width = uiSettings.width;
    taskInfo.title = uiSettings.title;
}

  createAdaptiveCardAttachment() {
    return CardFactory.adaptiveCard({
      version: '1.0.0',
      type: 'AdaptiveCard',
      body: [
        {
          type: 'TextBlock',
          text: 'Enter Text Here'
        },
        {
          type: 'Input.Text',
          id: 'usertext',
          placeholder: 'add some text and submit',
          IsMultiline: true
        }
      ],
      actions: [
        {
          type: 'Action.Submit',
          title: 'Submit'
        }
      ]
    });
  }
}

module.exports.TeamsBot = TeamsBot;
