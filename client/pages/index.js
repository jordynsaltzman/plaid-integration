import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

export default function Home() {
  const [tokenState, setTokenState] = useState("");
  // const [showData, setShowData] = useState(false);
  // const [accountsData, setAccountsData] = useState("");
  // const [numbersData, setNumbersData] = useState("");
  const [accessTokenState, setAccessTokenState] = useState({
    itemId: "",
    accessToken: "",
    isItemAccess: false,
  });

  const fetchLinkToken = async () => {
    const response = await fetch("http://localhost:3001/create-link-token", {
      method: "POST",
    });
    const data = await response.json();
    console.log(data);
    setTokenState(data.link_token);
  };

  useEffect(() => {
    fetchLinkToken();
  }, []);

  const onSuccess = async (public_token, metadata) => {
    console.log("PUBLIC TOKEN", public_token);
    console.log("METADATA (ON SUCCESS): ", metadata);

    const response = await fetch("http://localhost:3001/token-exchange", {
      method: "POST",
      body: JSON.stringify({ public_token }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    setAccessTokenState({
      itemId: data.item_id,
      accessToken: data.access_token,
      isItemAccess: true,
    });
  };

  const config = {
    token: tokenState,
    onSuccess: onSuccess,
    onExit: async (error, metadata) => {
      console.log("ERROR", error);
      console.log("METADATA (ON EXIT): ", metadata);
    },
    onEvent: async (metadata) => {
      console.log("METADATA (ON EVENT): ", metadata);
    },
  };

  const { open, ready, error } = usePlaidLink(config);

  return (
    <div
      style={{
        marginTop: "80px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <p>
        Welcome to <b>Dome's Plaid Test Application!</b>
      </p>
      <button
        type="button"
        style={{ marginTop: "10px" }}
        onClick={() => open()}
        disabled={!ready}
      >
        Link your bank account via Plaid
      </button>
      {/* {showData ? (
        <div>
          <p>Number of Accounts: {accountsData.length}</p>
          <p>
            <b>{accountsData[0].name}</b> ({accountsData[0].official_name}):
          </p>
          <p>Routing Number: {numbersData.ach[0].routing}</p>
          <p>Account Number: {numbersData.ach[0].account}</p>
          <p>Current Balance: ${accountsData[0].balances.current}</p>
          <p>Available Balance: ${accountsData[0].balances.available}</p>
          <p>Current Balance: {accountsData[0].balances.current}</p>
          <p>
            <b>{accountsData[1].name}</b> ({accountsData[1].official_name}):
          </p>
          <p>Routing Number: {numbersData.ach[1].routing}</p>
          <p>Account Number: {numbersData.ach[1].account}</p>
          <p>Current Balance: ${accountsData[1].balances.current}</p>
          <p>Available Balance: ${accountsData[1].balances.available}</p>
          <p>Current Balance: {accountsData[1].balances.current}</p>
        </div>
      ) : null} */}
    </div>
  );
}
