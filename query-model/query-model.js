import { v1 as uuid } from "uuid";

const ADD_ITEM = "ADD_ITEM";
const UPDATE_ITEM = "UPDATE_ITEM";
const REMOVE_ITEM = "REMOVE_ITEM";
const SET_ACTIVE_ID = "SET_ACTIVE_ID";
const SET_CURSOR_INDEX = "SET_CURSOR_INDEX";

export default function queryReducer(state, action) {
  switch (action.type) {
    case ADD_ITEM:
      console.log("ADD - ", action);
      return {
        ...state,
        items: [...state.items, { ...action.payload, id: uuid() }]
      };
    case UPDATE_ITEM:
      console.log("update - ", action);
      return {
        ...state,
        items: state.items.map((item, index) =>
          index === state.cursorIndex ? { ...item, ...action.payload } : item
        )
      };
    case REMOVE_ITEM:
      console.log("remove - ", action);
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    case SET_ACTIVE_ID:
      return {
        ...state,
        activeId: action.id
      };
    case SET_CURSOR_INDEX:
      return {
        ...state,
        cursorIndex: action.payload
      };
    default:
      return state;
  }
}

const queryModel = {
  items: [],
  itemsToString: () => "",
  activeId: null,
  cursorIndex: 0
};

// action
const addItem = payload => ({
  type: ADD_ITEM,
  payload
});

const updateItem = payload => ({
  type: UPDATE_ITEM,
  payload
});

const removeItem = id => (dispatch, getState) => {
  const { items, cursorIndex } = getState();

  dispatch({
    type: REMOVE_ITEM,
    payload: id || items[cursorIndex].id
  });

  dispatch(setCursorIndex());
};

const setActiveId = id => ({
  type: SET_ACTIVE_ID,
  id
});

const setCursorIndex = (index = -1) => (dispatch, getState) => {
  dispatch({
    type: SET_CURSOR_INDEX,
    payload: index >= 0 ? index : getState().items.length
  });
};

// selectors

const hasItems = state => state.items.length >= 1;

export {
  addItem,
  updateItem,
  removeItem,
  setActiveId,
  setCursorIndex,
  queryModel,
  hasItems
};
