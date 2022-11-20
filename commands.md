# 🕹 Commands

- [🕹 Commands](#-commands)
  - [📒 Summary](#-summary)
  - [🔎 Example:](#-example)
    - [📄 action.ts](#-actionts)
    - [📄 commands.ts](#-commandsts)
  - [🗳 Registering commands](#-registering-commands)
  - [▶️ Command execution](#️-command-execution)
  - [🆕 How to create commands](#-how-to-create-commands)
  - [📃 `Command` attributes](#-command-attributes)
    - [🔑 description](#-description)
    - [🔑 attributes](#-attributes)
    - [🔑 trigger](#-trigger)
    - [🔑 action](#-action)
    - [🌐 MessageProps](#-messageprops)

## 📒 Summary

The [main library](./README.md#main-dependencies) provides some event listeners. It's possible to listen, for example, to every received message and execute some action based on that.

A command runs on `message_create` listener. When a new message is received, Yagami Client handles user and group registration, then executes the command execution process.

## 🔎 Example:

### 📄 action.ts

```ts
export default function action(message: Message, client: YagamiClient) {
  const { clientId } = client;
  return message.reply(`Hello world from ${clientId}!`);
}
```

### 📄 commands.ts

```ts
import action from "./action";
import { Command } from "wwebjs-yagami";
const commands = [
  new Command("Hello world command", {
    trigger: {
      mainText: "!hello",
      mainCheckRule: "contains",
      inAnyChat: {
        type: "text",
        body: {
          checkRule: "exactly",
          text: "!hw", // H ello W orld
        },
      },
    },
    action,
    restricted: false,
    help: `Type "!hw" or "!hello" in any chat to execute this command =)`,
    countAsCommandExecuted: true,
  }),
];
export default commands;
```

## 🗳 Registering commands

The main class `YagamiClient`, when instantiated, receives as the first argument a `Command` array. The bot will look for these `triggers` in every message.

## ▶️ Command execution

An iteration is made through all the commands registered in the client, and then for each `command` it will follow these execution steps:

1. Message's `body` checking, following the `command`'s check rule.
2. Permissions verification.
3. If these above validations pass, the command is executed, and then a `command_executed` event is emitted.

## 🆕 How to create commands

You can insert a new command pushing a new `Command` object to the `commands` array received by the `YagamiClient` class.

Each command receives a string of **description** and an object of **attributes**.

## 📃 `Command` attributes

### 🔑 description

The command description is a short text that explains what it will do when its `trigger` is activated. It will help **developer** to understand.

### 🔑 attributes

The attributes are the `command`'s principal characteristics. They involve how will be its behavior (action), permissioning (restricted), etc.

| Name                   | Type          | Description                                                                                                                                                      |
| ---------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| trigger                | TriggerType   | It's the object that will tell how will be de functioning of the trigger. [See more](#trigger)                                                                   |
| action                 | CommandAction | It's the action that the bot will execute when the `trigger` is activated. [See more](#action)                                                                   |
| restricted             | boolean       | If `true`, the command will only be available for admins.                                                                                                        |
| help                   | string        | A longer text that will explain for the user what the command will do.                                                                                           |
| countAsCommandExecuted | boolean       | If `true`, the command will count as `CommandExecuted`. In other words, every time that this command is executed, it will sum +1 in the executed commands count. |

### 🔑 trigger

The trigger is the object that will tell how will be the trigger of the command action. Basically it's composed of which text will be searched, where and how it will be searched (check rule).

| Name           | Type                            | Description                                                                                                                                                              |
| -------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| mainText       | string                          | It's the main text that will serve as a "trigger" to trigger the command action. Also, it's what will represent the command as a trigger in the `!help` command listing. |
| mainCheckRule  | CheckRule                       | It's the main check rule. [See more](#checkrule)                                                                                                                         |
| inGroup?       | MessageProps \| MessageProps [] | It's the object that will tell which attributes will be checked in the group message. [See more](#messageprops)                                                          |
| inPrivateChat? | MessageProps \| MessageProps [] | It's the object that will tell which attributes will be checked in the private chat message. [See more](#messageprops)                                                   |
| inAnyChat?     | MessageProps \| MessageProps [] | It's the object that will tell which attributes will be checked in any chat. This config will overrite the others. [See more](#messageprops)                             |

### 🔑 action

It's the function that the bot will execute when the message matches the `trigger` activation rules. It receives the string `message` object and the YagamiClient `client` object.

See [above example](#actionts).

### 🌐 MessageProps

You may set the `trigger` to check for some specific message properties. For example:

You may want to execute the action if the message is a image, includes specific caption and was sent in a group. You can do it by setting the `inGroup` property to:

```ts
import { MessageTypes } from "whatsapp-web.js";
const { IMAGE } = MessageTypes;

const imageWithCaption = {
  type: IMAGE,
  body: {
    checkRule: "includes",
    text: "!helloworld",
  },
};
```
