import React, {
  Component,
  useState,
  useEffect,
  createContext,
  useContext
} from "react";
import ReactDOM from "react-dom";

export const DataContext = createContext();

// test autocomplete endpoint
// https://jsonbox.io/box_a9a9da840b49dfdb575a
export async function post(url = "", data) {
  const response = await fetch(url, {
    method: "POST",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    },
    referrer: "no-referrer",
    body: JSON.stringify(data)
  });

  return await response.json();
}

export async function postQueryModel(url = "", data) {
  const response = await fetch(url, {
    method: "POST",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    },
    referrer: "no-referrer",
    body: JSON.stringify(data)
  });

  return await response.json();
}

export async function get(url = "") {
  const response = await fetch(url, {
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    },
    referrer: "no-referrer"
  });

  return await response.json();
}

export function Data({ children }) {
  //console.log("Data");
  const [data, setData] = useState(0);

  const state = {
    data: data,
    cb: input => {
      console.log("input: ", input);
      const initData = async () => {
        try {
          const data = get(
            `https://jsonbox.io/box_a9a9da840b49dfdb575a?limit=1000&q=value:${input}*`
          ).then(data => {
            //console.log("GET: ", data);
            setData(data);
          });
        } catch (e) {
          //console.log(e);
        }
      };
      initData();
    },
    fetchSuggestions: model => {

      const formattedModel = {model};
console.log(formattedModel);

      const initData = async () => {
        try {
          const data = postQueryModel(
            "http://10.25.198.250:8080/autocomplete/suggestions",
            formattedModel
          ).then(data => {
            console.log("postQueryModel: ", data);
            //setData(data);
          });
        } catch (e) {
          //console.log(e);
        }
      };
      initData();
    }
  };

  useEffect(() => {
    setData([]);
  }, []);

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
}
