import React, { Component, useState } from "react";
import { render } from "react-dom";
import { animals } from "./data/animals";
import Autocomplete from "./autocomplete/autocomplete";
import { post, get, Data, DataContext } from "./data";

const App = () => (
  <div>
    <Data>
      <DataContext.Consumer>
        {context => {
          console.log("context: ", context);
          return (
            <Autocomplete
              suggestions={context.data}
              logics={[
                {
                  description: `Add boolean operator "and"`,
                  value: "AND",
                  type: "logic"
                },
                {
                  description: `Add boolean operator "or"`,
                  value: "OR",
                  type: "logic"
                },
                {
                  description: `Add boolean operator "in"`,
                  value: "IN",
                  type: "logic"
                }
              ]}
              onInputChange={context.cb}
              fetchSuggestions={context.fetchSuggestions}
            />
          );
        }}
      </DataContext.Consumer>
    </Data>
  </div>
);

render(<App />, document.getElementById("root"));
