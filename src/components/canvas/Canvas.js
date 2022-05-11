import React, { useState, useRef, useEffect } from 'react'
import './Canvas.scss'

import CanvasContextMenu from '../canvasContextMenu/CanvasContextMenu'


const Canvas = props => {
  
  const canvasRef = useRef(null)

  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1920, height: 1080, scaleFactor: 1 })
  // add a reference to the canvasDimensions variable for use in code below
  const canvasDimensionsRef = useRef()
  canvasDimensionsRef.current = canvasDimensions

  const [imagesOnCanvas, setImagesOnCanvas] = useState([]) // array of objects containing {imageBitMap, imageZ, naturalW, naturalH, posX, posY, width, height}
  // add reference for imagesOnCanvas variable
  const imagesOnCanvasRef = useRef()
  imagesOnCanvasRef.current = imagesOnCanvas

  // collect selected file and set its initial state
  const handleFileUpload = (event) => {
    // programatically create and open a file explorer dialog
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/png, image/jpeg' // only accept jpg and png files
    fileInput.onchange = async (event) => {
      const uploadedFile = event.target.files[0] // grab user-selected file blob
      const imageBitmap = await createImageBitmap(uploadedFile) // convert the blob to an imageBitmap (compatible with canvas api `drawImage` function)

      let imageWidth = imageBitmap.width
      let imageHeight = imageBitmap.height

      // check that the image wouldn't overflow the canvas initially and scale down it's natural w and h if it would
      // first get the image aspect ratio
      let imageAspectRatio = imageWidth/imageHeight
      // get the differences between image w and h and canvas w and h
      let dW = imageWidth - canvasDimensionsRef.current.width
      let dH = imageHeight - canvasDimensionsRef.current.height
      // check if either are positive (meaning the image w or h is larger than canvas)
      if (dW > 0 || dH > 0) {
        // check which value is larger then scale based on that value
        if (dW > dH) { // scale based on width
          imageWidth = 1920
          imageHeight = imageWidth / imageAspectRatio
        } else if (dH > dW) { //scale based on height
          imageHeight = 1080
          imageWidth = imageHeight * imageAspectRatio
        }
      }

      // get scaled width and height of the image
      let scaledWidth = imageWidth * canvasDimensionsRef.current.scaleFactor
      let scaledHeight = imageHeight * canvasDimensionsRef.current.scaleFactor

      const newImageDrawObj = {imageBitmap, imageZ: imagesOnCanvasRef.current.length + 1, naturalW: imageWidth, naturalH: imageHeight, posX: 0, posY: 0, width: scaledWidth, height: scaledHeight}

      drawNewImageToCanvas(newImageDrawObj)
    }
    fileInput.click()
  }

  const [contextMenuOptions, setContextMenuOptions] = useState([{name: 'Insert Image', function: handleFileUpload, className: 'insert-image'}])
  const contextMenuOptionsRef = useRef()
  contextMenuOptionsRef.current = contextMenuOptions

  const [rightClickedImage, setRightClickedImage] = useState(null)
  const rightClickedImageRef = useRef()
  rightClickedImageRef.current = rightClickedImage

  // runs only on initial component mount.
  useEffect(() => {
    // handles resizing the canvas to fit and fill the viewport as the window is resized.
    const handleCanvasResize = () => {
      // instantiate new width and height variables
      let width, height

      /* 
        assume first the height of the canvas is 100% the viewport height.
        If the width based on 16:9 ratio is larger than the window width, 
        set the dimensions based on the width being 100% the viewport width.
      */
      if ((window.innerHeight * (16/9)) > window.innerWidth) {
        width = window.innerWidth
        height = (window.innerWidth * (9/16))
      } else {
        height = window.innerHeight
        width = (window.innerHeight * (16/9))
      }

      // find the scale factor between 1920x1080 and the actual size on the page
      const scale = width / 1920

      // call canvasDimensions state setter with determined canvas height and width
      setCanvasDimensions({width, height, scaleFactor: scale})
    }


    // handle moving images around within the canvas
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    let dragging = false
    let draggableImage = null

    const handleDeleteImage = (e) => {
      // get the last image that was clicked and reference the array of images on the canvas
      const rightClickedImage = rightClickedImageRef.current
      const updatedImagesOnCanvas = imagesOnCanvasRef.current

      // find the image in the array, remove it
      const foundIndex = updatedImagesOnCanvas.findIndex(image => image.imageZ === rightClickedImage.imageZ)
      if (foundIndex !== -1) { // if the menu item is not already in the context menu, push it
        updatedImagesOnCanvas.splice(foundIndex, 1)
        setImagesOnCanvas(updatedImagesOnCanvas)
        redrawCanvas()
      }
    }

    const getClickedImage = (e) => {
      // get mouse down coordinates inside canvas
      const canvasArea = e.target.getBoundingClientRect() // need to get canvas area relative to viewport since mousedown coordinates are relative to viewport
      // adjust mousedown coordinates relative to where the canvas area begins and ends in the viewport
      let downX = e.layerX - canvasArea.left
      let downY = e.layerY - canvasArea.top

      // check and collect which images may cover the spot where the click occurs
      let imagesContainingMouseDown = []
      imagesOnCanvasRef.current.forEach((image) => {
        let imageAreaOccupied = getImageAreaOccupied(image)
        if ((downX >= imageAreaOccupied.minX && downX <= imageAreaOccupied.maxX) && (downY >= imageAreaOccupied.minY && downY <= imageAreaOccupied.maxY)) {
          imagesContainingMouseDown.push(image)
        }
      })

      // return the draggableImage
      return (imagesContainingMouseDown.length !== 0 ? imagesContainingMouseDown.reduce((prev, current) => (prev.imageZ > current.imageZ) ? prev : current) : null)
    }

    const handleMouseDown = (e) => {
      // get the image with highest z index to be the drag target
      draggableImage = getClickedImage(e)
      dragging = draggableImage ? true : false

      // if an image was right clicked, add the delete image option to the context menu
      if (e.which === 3) {
        const updatedContextMenu = contextMenuOptionsRef.current
        const deleteImageMenuItem = {name: 'Delete Image', function: handleDeleteImage, className: 'delete-image'}
  
        if (draggableImage) {
          setRightClickedImage(draggableImage) // enter the right clicked image into state so it can be referenced to delete
          const foundIndex = updatedContextMenu.findIndex(item => item.name === deleteImageMenuItem.name)
          if (foundIndex === -1) { // if the menu item is not already in the context menu, push it
            updatedContextMenu.push(deleteImageMenuItem)
            setContextMenuOptions(updatedContextMenu)
          }
        } else {
          setRightClickedImage(null) // force unset the right clicked image state
          const foundIndex = updatedContextMenu.findIndex(item => item.name === deleteImageMenuItem.name)
          if (foundIndex !== -1) { // make sure to remove the delete menu item when an image is not clicked
            updatedContextMenu.splice(foundIndex, 1)
            setContextMenuOptions(updatedContextMenu)
          }
        }
      }
    }

    // on mouse move we will continually clear and redraw the images on the canvas.
    const handleImageDragMouseMove = (e) => {
      if (dragging) {
        // update the position of the image that is being dragged
        draggableImage.posX += e.movementX
        draggableImage.posY += e.movementY

        // find and replace the old image object with the new image object with updated position.
        let updatedImagesOnCanvas = [...imagesOnCanvasRef.current]
        let previousImageIndex = updatedImagesOnCanvas.findIndex(temp => temp.imageZ === draggableImage.imageZ)
        updatedImagesOnCanvas[previousImageIndex] = draggableImage

        redrawCanvas(updatedImagesOnCanvas)
        context.lineWidth = "2"
        context.strokeStyle = '#74ff67'
        context.strokeRect(draggableImage.posX, draggableImage.posY, draggableImage.width, draggableImage.height)
      }
    }

    const handleImageDroppedOutOfBounds = () => {
        dragging = false // always remove dragging pseudo state
  
        // check to see if the image is out of the canvas bounds, then move it back inside if necessary
        const dXRight = canvasRef.current.width - (draggableImage.posX + draggableImage.width)
        const dXLeft = 0 - draggableImage.posX
        const dYBottom = canvasRef.current.height - (draggableImage.posY + draggableImage.height)
        const dYTop = 0 - draggableImage.posY
  
        if (dXRight < 0) { // if out of bounds on right
          draggableImage.posX += dXRight
        } else if (dXLeft > 0) { // if out of bounds on left
          draggableImage.posX = 0
        }
  
        if (dYBottom < 0) { // if out of bounds at bottom
          draggableImage.posY += dYBottom
        } else if (dYTop > 0) { // if out of bounds at top
          draggableImage.posY = 0
        }
        
        // find and replace the old image object with the new image object with updated position.
        let updatedImagesOnCanvas = [...imagesOnCanvasRef.current]
        let previousImageIndex = updatedImagesOnCanvas.findIndex(temp => temp.imageZ === draggableImage.imageZ)
        updatedImagesOnCanvas[previousImageIndex] = draggableImage
        redrawCanvas(updatedImagesOnCanvas)
  
        draggableImage = null // reset draggable image variable
    }

    const handleMouseUp = (e) => {
      if (dragging) {
        handleImageDroppedOutOfBounds()
      }
    }

    const handleMouseOut = (e) => {
      if (dragging) {
        handleImageDroppedOutOfBounds()
      }
    }
    // add canvas mouse listeners
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleImageDragMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseout', handleMouseOut)

    // make sure the canvas resizes properly on component mount, then add window resize listener
    handleCanvasResize()
    window.addEventListener('resize', handleCanvasResize)

    // cleanup resize listener on unmount
    return () => {
      window.removeEventListener('resize', handleCanvasResize)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleImageDragMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseout', handleMouseOut)
    }
  }, [])


  // scale and redraw all previously existing elements on canvas resize.
  useEffect(() => { redrawCanvas() }, [canvasDimensions])

  // function passed down to context menu to draw another image to the canvas
  const drawNewImageToCanvas = (newImageDrawObj) => {
    // get the current reference to the canvas, then get the 2d rendering context
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    const {imageBitmap, posX, posY, width, height} = newImageDrawObj
    context.drawImage(imageBitmap, posX, posY, width, height)

    setImagesOnCanvas(prevImagesArray => [...prevImagesArray, newImageDrawObj])
  }

  const redrawCanvas = (updatedImages = null) => {
    // clear the canvas
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)

    let imagesToRedraw = updatedImages ? updatedImages : imagesOnCanvasRef.current
    let newImagesOnCanvas = []

    // loop through each image on the canvas and update their state
    imagesToRedraw.forEach((image) => {
      // make sure to scale the images along with the canvas
      let scaledWidth = image.naturalW * canvasDimensionsRef.current.scaleFactor
      let scaledHeight = image.naturalH * canvasDimensionsRef.current.scaleFactor

      // also make sure to scale the relative position of the image to the canvas
      let dW = image.width / scaledWidth   // change in width as previous width divided by newly scaled width
      let dH = image.height / scaledHeight // change in height as previous height divided by newly scaled height
      // change the position by the same factor that the width and height changed
      let scaledX = image.posX / dW 
      let scaledY = image.posY / dH

      const scaledImage = {...image, posX: scaledX, posY: scaledY, width: scaledWidth, height: scaledHeight}

      newImagesOnCanvas.push(scaledImage)

      // get the current reference to the canvas, then get the 2d rendering context
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      context.drawImage(scaledImage.imageBitmap, scaledImage.posX, scaledImage.posY, scaledImage.width, scaledImage.height)
    });

    setImagesOnCanvas(newImagesOnCanvas)
  }

  // returns min and max x and y values of the image to represent the space it takes up on the canvas
  const getImageAreaOccupied = (image) => {
    let minX = image.posX
    let minY = image.posY
    let maxX = image.posX + image.width
    let maxY = image.posY + image.height

    // return object of {minX, minY, maxX, maxY}
    return {minX, minY, maxX, maxY}
  }

  return (
    <>
      <canvas className='canvas' height={canvasDimensions.height} width={canvasDimensions.width} ref={canvasRef} {...props} />
      <CanvasContextMenu target={'.canvas'} options={contextMenuOptions} />
    </>
  )

}

export default Canvas