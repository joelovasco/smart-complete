import React, { Component, useContext } from "react";
import { render } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./chip.scss";

export default function Chip({ type, children, onDelete }) {
  return (
    <span className={`chip ${type}`}>
      <span className="chip__value">{children}</span>
      {type !== "logic" && (
        <span className="chip__delete">
          <FontAwesomeIcon icon="times" onClick={onDelete} />
        </span>
      )}
    </span>
  );
}
