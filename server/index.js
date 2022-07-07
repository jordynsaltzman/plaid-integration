require("dotenv").config();
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
const express = require("express");
const cors = require("cors");
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT || 3001;

const path = require("path");

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
      "Plaid-Version": "2020-09-14",
    },
  },
});

const client = new PlaidApi(configuration);

// Create a link token with configs which we can then use to initialize Plaid Link client-side.
//1. we are creating this link token, getting the token and sending it over to the frontend, and by doing so we are passing in the users client unique ID, etc
app.post("/create-link-token", async (req, res) => {
  Promise.resolve()
    .then(async function () {
      const configs = {
        user: {
          // This should correspond to a unique id for the current user.
          client_user_id: "user-id",
        },
        client_name: "Dome Plaid Test App",
        products: ["auth", "identity"],
        country_codes: ["US"],
        language: "en",
      };

      const createTokenResponse = await client.linkTokenCreate(configs);
      res.json(createTokenResponse.data);
    })
    .catch((err) => console.log(err));
});

//after user goes through plaid link flow and onSuccess callback fires,
//we are going to send public token to the frontend and exchange it for an access token, and
//then take that token and pass it into the auth endpoint, the identity endpoint, and the balance endpoint
//typically, we will persist that data in the local data store
app.post("/token-exchange", async (req, res) => {
  PUBLIC_TOKEN = req.body.public_token;
  Promise.resolve()
    .then(async () => {
      const tokenResponse = await client.itemPublicTokenExchange({
        public_token: PUBLIC_TOKEN,
      });
      
      console.log("TOKEN EXCHANGE RESPONSE", tokenResponse);
      ACCESS_TOKEN = tokenResponse.data.access_token;
      ITEM_ID = tokenResponse.data.item_id;
      // if (PLAID_PRODUCTS.includes('transfer')) {
      //   TRANSFER_ID = await authorizeAndCreateTransfer(ACCESS_TOKEN);
      // }
      const authResponse = await client.authGet({
        access_token: ACCESS_TOKEN,
      });
      const identityResponse = await client.identityGet({
        access_token: ACCESS_TOKEN,
      });
      const balanceResponse = await client.accountsBalanceGet({
        access_token: ACCESS_TOKEN,
      });

      console.log("AUTH RESPONSE!!!");
      console.log("___________________");
      console.log("RES.DATA.ACCOUNTS: ");
      //array of accounts on file at the financial institution, includes balances
      console.log(authResponse.data.accounts);
      console.log("___________________");
      console.log("RES.DATA.NUMBERS: ");
      //tells you the ach numbers associated with the account
      //account number, routing number, account ID that the numbers belong to
      console.log(authResponse.data.numbers);
      console.log("___________________");
      console.log("IDENTITY RESPONSE!!!");
      console.log(identityResponse.data);
      console.log("___________________");
      console.log("RES.DATA.ACCOUNTS.OWNERS: ");
      console.log(identityResponse.data.accounts[0].owners);
      console.log("___________________");
      console.log("BALANCE RESPONSE!!!");
      // Retrieve real-time Balances for each of an Item's accounts
      console.log(balanceResponse.data);

      res.json({
        access_token: ACCESS_TOKEN,
        item_id: ITEM_ID,
        error: null,
        accounts: authResponse.data.accounts,
        numbers: authResponse.data.numbers,
        owners: identityResponse.data.accounts[0].owners,
      });
    })
    .catch((err) => console.log(err));
});

// Retrieve Transactions for an Item
app.get("/api/transactions", function (req, res) {
  Promise.resolve()
    .then(async function () {
      // Set cursor to empty to receive all historical updates
      let cursor = null;

      // New transaction updates since "cursor"
      let added = [];
      let modified = [];
      // Removed transaction ids
      let removed = [];
      let hasMore = true;
      // Iterate through each page of new transaction updates for item
      while (hasMore) {
        const request = {
          access_token: ACCESS_TOKEN,
          cursor: cursor,
        };
        const res = await client.transactionsSync(req);
        const data = response.data;
        // Add this page of results
        added = added.concat(data.added);
        modified = modified.concat(data.modified);
        removed = removed.concat(data.removed);
        hasMore = data.has_more;
        // Update cursor to the next cursor
        cursor = data.next_cursor;
        console.log(res);
      }

      const compareTxnsByDateAscending = (a, b) =>
        (a.date > b.date) - (a.date < b.date);
      // Return the 8 most recent transactions
      const recently_added = [...added]
        .sort(compareTxnsByDateAscending)
        .slice(-8);
      response.json({ latest_transactions: recently_added });
    })
    .catch((err) => console.log(err));
});

app.get("/", async (req, res) => {
  req.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log("listening on port: ", PORT);
});

// main dif between auth and identity endpoints is that within each account object,
//there is an array of owners who are on file for that account.
//we get their addresses, emails, names, phone numbers, etc

//balance endpoint, when called, will do a real time extraction at the financial institution
//in order to update balances in real time
//typically, this is called right before an ach payment
//to know if the user has the available funds
