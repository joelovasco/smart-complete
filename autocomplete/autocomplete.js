import React, { Component, useState, useEffect, useReducer } from "react";
import ReactDOM from "react-dom";
import { v1 as uuid } from "uuid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import Downshift from "downshift";
import "./autocomplete.scss";
import Chip from "./chip";
import { subjects } from "../data/subjects";
import queryReducer, {
  addItem,
  updateItem,
  removeItem,
  setActiveId,
  queryModel
} from "../query-model/query-model";

library.add(faSearch, faTimes);

const sanitizeInput = input => {
  return input.replace(/\"/g, "");
};

const quotedTermCheck = input => {
  const quoteCount = input.split('"').length - 1;
  const inputValue = input.replace(/\"/g, "");

  return inputValue !== "" && quoteCount > 1;
};

export default function Autocomplete({ suggestions, logics, onInputChange }) {
  const [query, setQuery] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeChipId, setActiveChipId] = useState(null);
  const [query, dispatchQuery] = useReducer(queryReducer, queryModel);

  let cleanUserInput = sanitizeInput(userInput);

  const aggregateSuggestions = [...logics, ...suggestions];

  suggestions = aggregateSuggestions;
  console.log("suggestions", suggestions);

  // event fired when the input value is changed
  const onUserInputChange = e => {
    const userInput = e.currentTarget.value;

    // sanatize the user input and filtered suggestions, reset the active
    // suggestion and make sure the suggestions are shown
    let cleanUserInput = sanitizeInput(userInput);

    onInputChange(cleanUserInput);
    setActiveSuggestion(0);

    if (cleanUserInput !== "") setShowSuggestions(true);
    setUserInput(e.currentTarget.value);
  };

  // const handleOnChange = (e, stateAndHelpers) =>
  //   console.log("change", e, stateAndHelpers);

  // Handles adding query items
  const handleOnSelect = (e, { clearSelection }) => {
    if (!e) return;

    const { value, type } = e;

    // TODO - dispatch different actions based off of type
    // if type === logic
    // ADD_ITEM
    // anything else reset query with auto complete suggestion array.
    dispatchQuery(
      addItem({
        value,
        type: type || "pharse",
        id: uuid()
      })
    );

    clearSelection();
  };

  const itemToString = item => {
    return item ? item.value : "";
  };

  return (
    <>
      <Downshift onSelect={handleOnSelect} itemToString={itemToString}>
        {({
          getInputProps,
          getItemProps,
          getMenuProps,
          isOpen,
          openMenu,
          inputValue,
          highlightedIndex,
          clearSelection,
          setState
        }) => (
          <div className="autocomplete">
            <div className="autocomplete__controls">
              <div className="autocomplete__input">
                {query.items.map(
                  ({ value, id, type }, index) =>
                    id !== query.activeId ? (
                      <Chip
                        type={type}
                        index={index}
                        key={id}
                        onDelete={() => dispatchQuery(removeItem(id))}
                      >
                        {value}
                      </Chip>
                    ) : null // replace with shared input
                )}
                <input
                  {...getInputProps({
                    onChange: onUserInputChange,
                    onFocus: e => {
                      openMenu();
                    },
                    onKeyDown: e => {
                      const { key } = e;
                      const { items, activeId } = query;

                      // key === ENTER
                      // if chip is being edited

                      // dispatch UPDATE_ITEM with new value.
                      // reset editID once chip has been reminted.

                      if (key === "Enter" && activeId) {
                        e.preventDefault();
                        dispatchQuery(updateItem(inputValue));
                        clearSelection();
                      }

                      if (key !== "Backspace" || inputValue) return;

                      if (query.items.length > 0) {
                        e.preventDefault();

                        console.log("??")

                        // TODO - build this out to be shared by inputs between chips
                        const { id, value } = items[items.length - 1];

                        dispatchQuery(setActiveId(id));

                        setState({ inputValue: value });
                      }
                    }
                  })}
                />
              </div>
              <div className="autocomplete__button">
                <FontAwesomeIcon icon="search" className="search-icon" />
              </div>
            </div>
            {isOpen && (
              <ul class="suggestions" {...getMenuProps()}>
                {suggestions.map((item, index) => (
                  <li
                    className={
                      highlightedIndex === index ? "suggestion-active" : null
                    }
                    {...getItemProps({
                      key: item._id || uuid(),
                      index,
                      item
                    })}
                  >
                    {item.value}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Downshift>
      <pre>{JSON.stringify(query, 0, 2)}</pre>
    </>
  );
}
