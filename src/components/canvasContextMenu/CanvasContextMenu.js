import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import './CanvasContextMenu.scss'

const CanvasContextMenu = ({target, options}) => {
  const [menuPosition, setMenuPosition] = useState({visible: false, posX: 0, posY: 0})
  const menuRef = useRef(null)

  useEffect(() => {
    // handle the click event to 'open' the menu
    const handleMenu = (event) => {
      const targetElement= document.querySelector(target)
      // check the target passed through props is the same target as the click event.
      if(targetElement && targetElement.contains(event.target)){
        // prevent the default context menu from opening
        event.preventDefault();
        // if the target is the expected one, show the context menu at the click event coordinates.
        setMenuPosition({ visible: true, posX: event.clientX, posY: event.clientY })
      }else if(menuRef.current && !menuRef.current.contains(event.target)){
        // if the target is not the expected one, make sure the context menu is not visible.
        setMenuPosition({ ...menuPosition, visible: false })
      }
    }

    // handle the user clicking outside of the menu, this will close the context menu
    const handleCloseClick= (event) => {
      if(menuRef.current && !menuRef.current.contains(event.target)){ // if the menu is open and the click event is outside of the menu
        setMenuPosition({ ...menuPosition, visible: false })
      }
    }

    document.addEventListener('contextmenu', handleMenu)
    document.addEventListener('mousedown', handleCloseClick)

    // cleanup event listeners on unmount
    return () => {
      document.removeEventListener('contextmenu', handleMenu)
      document.removeEventListener('mousedown', handleCloseClick)
    }
  }, [menuPosition, target]) //run when menuPosition or target values change.

  // when menu position state is updated, check that the menu does not overflow the viewport
  useLayoutEffect(() => {
    if(menuPosition.posX + menuRef.current?.offsetWidth > window.innerWidth){ // 
      setMenuPosition({ ...menuPosition, posX: menuPosition.posX - menuRef.current?.offsetWidth})
    }
    if(menuPosition.posY + menuRef.current?.offsetHeight > window.innerHeight){
      setMenuPosition({ ...menuPosition, posY: menuPosition.posY - menuRef.current?.offsetHeight})
    }
  }, [menuPosition])

  return (
    <div ref={menuRef} className="context-menu" style={{ display: `${menuPosition.visible ? 'block' : 'none'}`, left: menuPosition.posX, top: menuPosition.posY}}>
      {options.map((option) => {
        return (
          <li key={option.name} className={`context-menu--item ${option.className}`} onClick={option.function}>
            {option.name}
          </li>
        )
      })}
    </div>
  )
}

export default CanvasContextMenu