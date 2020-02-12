import React, { Component, useState } from "react";
import ReactDOM from "react-dom";
import { v1 as uuid } from "uuid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import Downshift from "downshift";
import { useThunkReducer } from "react-hook-thunk-reducer";
import Chip from "./chip";
import { subjects } from "../data/subjects";
import queryReducer, {
  addItem,
  addActiveItem,
  updateItem,
  removeItem,
  setActiveId,
  queryModel
} from "../query-model/query-model";

import "./autocomplete.scss";

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
  const [hasLogicOperator, setHasLogicOperator] = useState(false);
  const [query, dispatchQuery] = useThunkReducer(queryReducer, queryModel);

  let cleanUserInput = sanitizeInput(userInput);

  const parsedLogics = logics.filter(logic =>
    logic.value.toLowerCase().includes(cleanUserInput)
  );

  const aggregateSuggestions = [...parsedLogics, ...suggestions];

  suggestions = aggregateSuggestions;

  // event fired when the input value is changed
  const onUserInputChange = e => {
    const userInput = e.currentTarget.value;

    // sanitize the user input and filtered suggestions, reset the active
    // suggestion and make sure the suggestions are shown
    let cleanUserInput = sanitizeInput(userInput);

    onInputChange(cleanUserInput);
    setActiveSuggestion(0);

    setUserInput(e.currentTarget.value);
  };

  // Handles adding query items
  // TODO - update to parse an array of items
  const handleOnSelect = (e, { clearSelection }) => {
    if (!e) return;
    const { value, type } = e;
    const { activeId } = query;

    console.log("suggestion selected - ", e);

    dispatchQuery(
      updateItem({
        value,
        type: getModelItemType(value)
      })
    );

    dispatchQuery(setActiveId(null));
    clearSelection();
  };

  const itemToString = item => {
    return item ? item.value : "";
  };

  /**
   * On delete
   *
   * @param {Event}
   * @param {Object} Downshift's stateAndHelpers
   */
  const onBackspaceKeyUp = (e, { inputValue, setState }) => {
    const { items, activeId } = query;
    const hasChips = items.length > 0;

    // If a user has deleted past a chip
    // remove it from query.items
    if (activeId && inputValue === "") {
      dispatchQuery(removeItem(activeId));
    }

    // start chipping away at the existing chip
    if (hasChips && !activeId && !inputValue) {
      e.preventDefault();

      // TODO - build this out to be shared by inputs between chips
      const { id, value } = items[items.length - 1];

      dispatchQuery(setActiveId(id));
      dispatchQuery(updateItem({ type: "text" }));

      setState({ inputValue: value });
    }
  };

  /**
   * Parses input string for logic operators
   * and trys to return an array of matches.
   *
   * @param {string} input
   * @returns {null|string[]}
   */
  const parseInputForLogicOperator = (
    input,
    canStartWithLogicOperator = false
  ) => {
    const STARTS_WITH = "STARTS_WITH";
    const ENDS_WITH = "ENDS_WITH";
    const CONTAINS = "CONTAINS";

    const logicRegEx = {
      // "boating AND "
      [ENDS_WITH]: /^([^"][^\s]*)\s(AND|OR|NOT)\s$/,
      // "boating AND tourism"
      [CONTAINS]: /^([^"][^\s]*)\s(AND|OR|NOT)\s(.+)$/
    };

    if (canStartWithLogicOperator) {
      // "AND "
      logicRegEx[STARTS_WITH] = /^(AND|OR|NOT)\s$/;
    }

    const reKey = Object.keys(logicRegEx).find(key =>
      logicRegEx[key].test(input)
    );

    if (!reKey) return null;

    // example string "boating or tourism"
    // If a user wants to go back and replace or with OR~~.
    // We should wait unitl the user has pressed another key to determine if
    // a logic op is really what they are after.
    // Maybe they want to enter "boating OREGON tourism"
    if (reKey == CONTAINS && !hasLogicOperator) {
      setHasLogicOperator(true);
      return null;
    }

    if (hasLogicOperator) {
      setHasLogicOperator(false);
    }

    const matches = input.match(logicRegEx[reKey]);
    return matches ? matches.slice(1) : null;
  };

  /**
   * Determines if input is pharsed.
   * @param {string} input
   *
   * @returns {undefined|string[]}
   */
  const inputHasPhrase = input => {
    // one or more of anything that is wrapped in quotes and
    const phrasedInputRe = /^"(.+)"$/;

    if (!phrasedInputRe.test(input)) return;

    const cleanedInput = input.match(phrasedInputRe)[1].trim();
    return cleanedInput && [cleanedInput];
  };

  // TODO - build out for "field" type
  const getModelItemType = input =>
    ["AND", "OR", "NOT"].indexOf(input) !== -1 ? "logic" : "phrase";

  /**
   * Determines if input should be chipped.
   *
   * @param {Event}
   * @param {Object} Downshift's stateAndHelpers
   */
  const chipInput = (e, { inputValue, clearSelection }) => {
    const { items, activeId } = query;
    const hasChips = items.length > 0;

    let inputsToDispatch =
      parseInputForLogicOperator(inputValue, hasChips) ||
      inputHasPhrase(inputValue);

    if (!inputsToDispatch) return;

    // Update the active item
    // Shift the contents of inputsToDispatch so that the newest items can be added to the model.
    if (activeId) {
      const activeItemValue = inputsToDispatch.slice(0, 1)[0];
      inputsToDispatch = inputsToDispatch.slice(1);

      dispatchQuery(
        updateItem({
          value: activeItemValue,
          type: getModelItemType(activeItemValue)
        })
      );
      dispatchQuery(setActiveId(null));
    }

    inputsToDispatch.forEach(input => {
      if (!input) return;

      dispatchQuery(
        addItem({
          value: input,
          type: getModelItemType(input)
        })
      );
    });

    clearSelection();
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
                    id !== query.activeId || type !== "text" ? (
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
                    onKeyUp: e => {
                      const { items, activeId } = query;

                      if (!activeId && inputValue) {
                        dispatchQuery(
                          addActiveItem({
                            value: inputValue,
                            type: "text"
                          })
                        );
                      }

                      if (activeId) {
                        dispatchQuery(updateItem({ value: inputValue }));
                      }

                      switch (e.key) {
                        case "Backspace":
                          onBackspaceKeyUp(e, { inputValue, setState });
                          return;
                        case "Enter":
                          // Item(s) was selected from the dropdown suggestions.
                          // Let handleOnSelect take over.
                          if (highlightedIndex || highlightedIndex === 0) {
                            console.log(
                              "has highlightedIndex",
                              highlightedIndex
                            );
                            return;
                          }

                          e.nativeEvent.preventDownshiftDefault = true;

                          // If more than one item and activeId
                          // preventDefault
                          // update active chip
                          console.log("editing active item");
                          if (items.length > 1 && activeId) {
                            console.log("updating active item");
                            e.preventDefault();
                            dispatchQuery(
                              updateItem({
                                value: inputValue,
                                type: getModelItemType(inputValue)
                              })
                            );
                            dispatchQuery(setActiveId(null));
                            clearSelection();
                          }

                          // Else run the search.
                          // TODO - dispatch action?
                          console.log("Running search for - ", inputValue);
                          return;
                        default:
                          chipInput(e, { inputValue, clearSelection });
                          return;
                      }
                    },
                    onKeyDown: e => {
                      const { key } = e;
                      const { items, activeId } = query;
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
