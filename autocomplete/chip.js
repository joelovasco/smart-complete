import React, { Component, useContext } from 'react'
import { render } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function Chip({ type, index, children, onDelete }) {
  return (
    <span className={type === 'logic' ? 'chip' : 'chip entry'}>
      {children}
      <FontAwesomeIcon 
        icon='times' 
        className='delete-chip'
        onClick={onDelete}
      />
    </span>
  )
}