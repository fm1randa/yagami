# 🤖 Yagami

- [🤖 Yagami](#-yagami)
  - [📝 Description](#-description)
  - [💡 Usage](#-usage)
    - [⬆️ Install](#️-install)
    - [🔎 Example:](#-example)
  - [👾 Clients](#-clients)
  - [🕹 Commands](#-commands)
  - [⚙️ Environment variables](#️-environment-variables)
  - [📦 Main dependencies](#-main-dependencies)
    - [🎁 whatsapp-web.js](#-whatsapp-webjs)
    - [🖥 winston](#-winston)
  - [🗃 Database](#-database)
    - [📂 /app/collections](#-appcollections)
    - [📂 /app/models](#-appmodels)
  - [🎫 Session](#-session)

## 📝 Description

**Yagami** is a Whatsapp client for command execution via message.

## 💡 Usage

### ⬆️ Install

```bash
npm install wwebjs-yagami
```

### 🔎 Example:

**🚨 You must import `connectToDatabase` and call that function before instantiating Yagami Client.**
_See [commands.md](commands.md) for more info about `import commands from "./commands";`_

```ts
import { YagamiClient, connectToDatabase } from "wwebjs-yagami";
import commands from "./commands";
async function main() {
  const isServer = process.env.SERVER === "true";

  const { store } = await connectToDatabase();
  const authStrategy = new RemoteAuth({
    clientId: process.env.CLIENT_ID,
    store,
    backupSyncIntervalMs: 5 * 60 * 1000,
  });

  const clientOptions: YagamiOptions = {
    handleSignups: true,
    authStrategy,
    puppeteer: {
      headless: true,
      [isServer && "executablePath"]: "/usr/bin/chromium-browser",
      [isServer && "args"]: ["--no-sandbox"],
    },
  };

  const client = new YagamiClient(commands, clientOptions);

  start();

  function start() {
    client.init();
  }
}
main();
```

## 👾 Clients

It's possible to have many concurrent clients. In other words, you can manage more than one bot simultaneously with one Node instance.

To do so, it's necessary to instantiate different objects of `YagamiClient`, in that way:

```ts
const foo = new YagamiClient(commandsFoo, clientOptionsFoo);
const bar = new YagamiClient(commandsBar, clientOptionsBar);
start();

function start() {
  foo.init();
  bar.init();
...
```

## 🕹 Commands

See [commands README](commands.md).

## ⚙️ Environment variables

Some environment variables are necessary. You must create a `.env` file at the project root and follow this pattern:

```dockerfile
SERVER=false # is running in a server?
MONGO_URI="" # mongo connection string
CLIENT_ID="" # ID that will represent a unique session at the database
```

## 📦 Main dependencies

### 🎁 [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)

It's the main library that makes all the magic. It provides a helpful API with Whatsapp Web.

The [qrcode-terminal](https://github.com/gtanner/qrcode-terminal) module allows the QR Code mirroring from the Whatsapp Web page to the terminal.

### 🖥 [winston](https://github.com/winstonjs/winston)

It's the one responsible for standardization logs. You may use the helper [logger](src/helpers/logger.ts) instead of `console.log`.

## 🗃 Database

The Yagami Client, through [mongoose](https://github.com/Automattic/mongoose), uses Mongo's non-relational database to store some entities such as:

- Users
- Groups
- [Sessions](#session)

You find the DB logic in the `src/app` directory.

### 📂 /app/collections

A collection provides methods to maintain a database entity. In other words, you can create, update, delete and read a database entity.

### 📂 /app/models

A estrutura de dados das entidades `User` e `Group` do banco é representada nas classes contidas nessa pasta.

`User` and `Group`'s database entities are represented by the classes contained in that directory.

## 🎫 Session

You can use any phone number with Yagami Client. To do so, it is used a session stored in the database, for avoiding scanning the QR Code every execution. It is done through the `whatsapp-web.js` auth strategy, **Remote Auth**.

The [wwebjs-mongo](https://github.com/jtourisNS/wwebjs-mongo) library does the interface between `mongoose` and `whatsapp-web.js`.

Each session is identified by the [environment variable](#environment-variables) `CLIENT_ID`. For each new ID, two collections are created in the Mongo database:

- `whatsapp-RemoteAuth-<CLIENT_ID>.chunks`

- `whatsapp-RemoteAuth-<CLIENT_ID>.files`
