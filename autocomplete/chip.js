import React, { Component, useContext } from "react";
import { render } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./chip.scss";

export default function Chip({ type, index, children, onDelete }) {
  return (
    <span className={`chip ${type}`}>
      {children}
      {type === "phrase" && (
        <FontAwesomeIcon
          icon="times"
          className="delete-chip"
          onClick={onDelete}
        />
      )}
    </span>
  );
}
