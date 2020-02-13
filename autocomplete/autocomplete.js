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
  queryModel,
  hasItems
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

  const parsedLogics = cleanUserInput
    ? logics.filter(logic => logic.value.toLowerCase().includes(cleanUserInput))
    : [];

  const aggregateSuggestions = [...parsedLogics, ...suggestions];

  suggestions = aggregateSuggestions;

  // event fired when the input value is changed
  const onUserInputChange = e => {
    const userInput = e.currentTarget.value;

    // sanitize the user input and filtered suggestions, reset the active
    // suggestion and make sure the suggestions are shown
    let cleanUserInput = sanitizeInput(userInput);

    onInputChange(cleanUserInput);
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

  const onEnterKeyUp = (e, { inputValue, clearSelection }) => {
    e.nativeEvent.preventDownshiftDefault = true;
    const { items, activeId } = query;

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
      return;
    }

    // Else run the search.
    // TODO - dispatch action?
    console.log("Running search for - ", items);
  };

  /**
   * On delete
   *
   * @param {Event}
   * @param {Object} Downshift's stateAndHelpers
   */
  const onBackspaceKeyUp = (e, { inputValue, setState: downShiftSetState }) => {
    const { items, activeId } = query;
    if (activeId) {
      inputValue
        ? dispatchQuery(updateItem({ value: inputValue }))
        : dispatchQuery(removeItem(activeId));
      return;
    }

    // Start chipping away at adjacent chip
    // TODO - Combine with cursorIndex to determine where the in items set this is.
    e.preventDefault();
    const { id, value } = items[items.length - 1];

    dispatchQuery(setActiveId(id));
    dispatchQuery(updateItem({ type: "text" }));

    downShiftSetState({ inputValue: value });
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
      [ENDS_WITH]: /^([^"].*)\s(AND|OR|NOT)\s$/,
      // "boating AND tourism"
      [CONTAINS]: /^([^"].*)\s(AND|OR|NOT)\s(.+)$/
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
   * @param {string[]} chips
   * @returns {undefined}
   */
  const setChips = chips => {
    const { activeId } = query;

    chips.forEach((input, index) => {
      const itemContents = {
        value: input,
        type: getModelItemType(input)
      };

      // If a item has been edited update it
      // and then add any remaining items to the model
      if (activeId && index === 0) {
        dispatchQuery(updateItem(itemContents));
      } else {
        dispatchQuery(addItem(itemContents));
      }
    });

    dispatchQuery(setActiveId(null));
  };

  /**
   * Compiles input into chipable content
   *
   * @param {string} input
   * @return {string[]|undefined} Chipable content
   */
  const getChipItems = input =>
    parseInputForLogicOperator(input, hasItems(query)) || inputHasPhrase(input);

  /**
   * Parses input
   *
   * @param {object} Dropdown's state and helpers
   * @return {undefined}
   */
  const parseOnKeyUp = ({ inputValue, clearSelection }) => {
    if (!inputValue) return;
    const { activeId } = query;
    const chips = getChipItems(inputValue);

    if (chips) {
      setChips(chips);
      clearSelection();
      return;
    }

    if (activeId) {
      dispatchQuery(updateItem({ value: inputValue }));
      return;
    }

    dispatchQuery(
      addActiveItem({
        value: inputValue,
        type: "text"
      })
    );
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
                      switch (e.key) {
                        case "Backspace":
                          onBackspaceKeyUp(e, { inputValue, setState });
                          return;
                        case "Enter":
                          // An item was selected from the dropdown suggestions.
                          // Let handleOnSelect take over.
                          if (highlightedIndex || highlightedIndex === 0) {
                            return;
                          }

                          onEnterKeyUp(e, { inputValue, clearSelection });
                          return;
                        default:
                          parseOnKeyUp({ inputValue, clearSelection });
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
