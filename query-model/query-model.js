import { v1 as uuid } from "uuid";

const ADD_ITEM = "ADD_ITEM";
const UPDATE_ITEM = "UPDATE_ITEM";
const REMOVE_ITEM = "REMOVE_ITEM";
const SET_ACTIVE_ID = "SET_ACTIVE_ID";

export default function queryReducer(state, action) {
  switch (action.type) {
    case ADD_ITEM:
      const id = uuid();
      return {
        ...state,
        items: [...state.items, { ...action.payload, id }],
        activeId: action.payload.activeId || id
      };
    case UPDATE_ITEM:
      return {
        ...state,
        items: state.items.map(item =>
          item.id === state.activeId ? { ...item, ...action.payload } : item
        )
      };
    case REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.id),
        activeId: null
      };
    case SET_ACTIVE_ID:
      return {
        ...state,
        activeId: action.id
      };
    default:
      return state;
  }
}

const queryModel = {
  items: [],
  itemsToString: () => "",
  activeId: null
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

const removeItem = id => ({
  type: REMOVE_ITEM,
  id
});

const setActiveId = id => ({
  type: SET_ACTIVE_ID,
  id
});

export { addItem, updateItem, removeItem, setActiveId, queryModel };
