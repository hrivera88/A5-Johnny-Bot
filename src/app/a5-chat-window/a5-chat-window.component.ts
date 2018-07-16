import { Component, OnInit } from "@angular/core";
import {
  trigger,
  state,
  style,
  transition,
  useAnimation
} from "@angular/animations";
import { bounceInAnimation } from "../animations";
import { faComment } from "@fortawesome/free-solid-svg-icons";
import { Message } from "./message";
import { Option } from "./option";
import * as AWS from "aws-sdk";
import * as _ from "lodash";

@Component({
  selector: "a5-chat-window",
  templateUrl: "./a5-chat-window.component.html",
  styleUrls: ["./a5-chat-window.component.css"],
  animations: [
    trigger("bounceMenu", [
      state("botResponse", style({})),
      state("button", style({})),
      transition("* => *", [
        useAnimation(bounceInAnimation, {
          params: {
            duration: "2s",
            delay: "0ms"
          }
        })
      ])
    ])
  ]
})
export class A5ChatWindowComponent implements OnInit {
  lexRuntime: any;
  lexUserID = "Halbot" + Date.now();
  botOptionsTitle: string;
  botMenuOptions: Option[] = [];
  faComment = faComment;
  greetingMessage = "How can we help you?";
  userMessageInput: string;
  showMainMenuOptions = true;
  showMainMenuButton = false;
  showBotOptions = false;
  messages: Message[] = [];
  lottieConfig: Object;
  notMobileScreen = true;
  bounceMenu: string;

  constructor() {
    AWS.config.region = "us-east-1";
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: "us-east-1:21ece9e8-d2f1-4d74-9e3b-dbf9acd25e06"
    });
    this.lexRuntime = new AWS.LexRuntime();
    this.lottieConfig = {
      path: "../../assets/js/lottie/data.json",
      autoplay: true,
      loop: true
    };
  }

  ngOnInit() {
    this.sendTextMessageToBot("hello");
    console.log(screen.width);
    if (screen.width < 768) {
      this.notMobileScreen = false;
    }
  }

  displayMainMenuOptions() {
    this.showResponse(false, this.greetingMessage);
    this.showMainMenuButton = false;
    this.showMainMenuOptions = true;
  }

  showResponse(isUserMessage: boolean, message: string) {
    // Check whether the User to show a response from the User or Bot
    if (isUserMessage) {
      let response: Message = {
        userMessage: true,
        name: "",
        message: message
      };
      //Add User's response to Messages UI
      this.messages.unshift(response);
    } else {
      let response: Message = {
        userMessage: false,
        name: "",
        message: message
      };
      //Add Bot's response to Messages UI
      this.messages.unshift(response);
    }
  }

  loopThroughBotResponseCardButtons(responseCardButtons) {
    _.map(responseCardButtons, opt => {
      this.botMenuOptions.push(opt);
    });
  }

  showBotResponseToUser(botResponse) {
    //Display Bot's response to Chat UI
    this.showResponse(false, botResponse.message);
    //Check whether the Dialog is at the ending state or not.
    if (botResponse.dialogState !== "Fulfilled" && !botResponse.responseCard) {
      this.showMainMenuButton = false;
      this.showBotOptions = false;
      this.showMainMenuOptions = false;
    } else if (
      botResponse.responseCard &&
      botResponse.dialogState !== "Fulfilled"
    ) {
      this.botMenuOptions = [];
      //If the Bot response has a Response Card with Options show them in the UI
      this.botOptionsTitle =
        botResponse.responseCard.genericAttachments[0].title;
      this.showMainMenuOptions = false;
      this.loopThroughBotResponseCardButtons(
        botResponse.responseCard.genericAttachments[0].buttons
      );
      this.showBotOptions = true;
      this.bounceMenu = "botResponse";
    } else {
      if (botResponse.responseCard) {
        //If the Bot response has a Response Card with Options show them in the UI
        this.botMenuOptions = [];
        this.botOptionsTitle =
          botResponse.responseCard.genericAttachments[0].title;
        this.loopThroughBotResponseCardButtons(
          botResponse.responseCard.genericAttachments[0].buttons
        );
        this.showMainMenuOptions = false;
        this.showBotOptions = true;
        this.bounceMenu = "botResponse";
      } else {
        this.showBotOptions = false;
        this.showMainMenuOptions = false;
        this.showMainMenuButton = true;
      }
    }
  }

  submitMessageToBot(message: any) {
    let usersMessage = message;
    this.showResponse(true, usersMessage);
    this.sendTextMessageToBot(usersMessage);
  }

  sendTextMessageToBot(textMessage) {
    this.userMessageInput = "";
    // Gather needed parameters for Amazon Lex
    let params = {
      botAlias: "$LATEST",
      botName: "JohnnyBot",
      inputText: textMessage,
      userId: this.lexUserID
    };
    // Send Main Menu Button text value to Amazon Lex Bot
    this.lexRuntime.postText(params, (err, data) => {
      if (err) {
        console.log(err, err.stack);
      }
      if (data) {
        console.log("boooottttttttt: ", data);
        this.showBotResponseToUser(data);
      }
    });
  }

  chooseBotOption(evt: any) {
    let optionText = evt.target.value;
    this.showResponse(true, optionText);
    this.sendTextMessageToBot(optionText);
    this.bounceMenu = "button";
  }

  chooseMainOption(evt: any) {
    //Get text value from Main Menu Button
    let optionText = evt.target.value;
    // Show Main Menu Button text value in Messages UI
    this.showResponse(true, optionText);
    this.sendTextMessageToBot(optionText);
  }
}
