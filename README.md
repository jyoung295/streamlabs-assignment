## Instructions
- Run `npm i` at the root.
- Run `npm start` to open the local dev page.
- Right click inside the canvas to open the context menu, click 'Insert Image' and select an image to add to the canvas.
- Right click an image in the canvas, then click 'Delete Image' to remove that image from the canvas.

## Questions
1. *How long did it take you to complete this assignment?*
About 6 hours.
1. *What about this assignment did you find most challenging?*
Figuring out the math for scaling the position of the images on the canvas as the canvas is resized.
1. *What about this assignment did you find unclear?*
Nothing, I think the requirements and expectations were very clear.
1. *Do you feel like this assignment has an appropriate level of difficulty?*
Yes, I think so. The assignment was challenging overall with differing levels of difficulty throughout for the various requirements and expectations.
1. *Briefly explain the technical decisions you made in this project, i.e. architecture, code-splitting, libraries, or other decisions and tradeoffs.*
I chose to use React with a basic `create-react-app` install and I felt the app would be simple enough to solve without using any other libraries; the only other library I added was `sass` so I could write my styles in scss. Since the images and all the interactions were all going to be within the canvas, I decided to write all the logic in the Canvas compenent. As I was thinking about how this simple app could be extended, I liked the idea of adding a custom context menu. The menu gets its options passed in as props from the parent component, so it can be utilized anywhere in the app with menu options specific to wherever the context menu click occurs, and new menu options can added as needed easily. 