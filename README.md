# Pixel Art Converter

| Original | Result |
|----------|--------|
| ![Original 1](web/o1.PNG) | ![Result 1](web/r1.PNG) |
| ![Original 2](web/o2.PNG) | ![Result 2](web/r2.PNG) |
| ![Original 3](web/o3.JPG) | ![Result 3](web/r3.PNG) |

A simple web-based tool that converts images into pixel art style. 

## Features

- Easy-to-use interface
- Real-time preview
- Adjustable pixel block size (2-10 pixels)
- Customizable color palette (2-64 colors)
- Download results as PNG
- No installation required - works in browser
- Improved mobile viewing experience

## How to Use

1. Click 'Open' to select an image
2. Adjust 'Block Size' to control pixel size
3. Adjust 'Color Count' to set the number of colors
4. Click 'Save' to download your pixel art

## Technology

The converter uses two main techniques:
- **Pixel Blocking**: Groups pixels into blocks and averages their colors
- **Color Quantization**: Reduces colors using median cut algorithm

## Project Structure

```
web/
├── css/
│   └── style.css      # Styles
├── js/
│   └── main.js        # Core functionality
└── index.html         # Main page
```

## Local Development

Simply clone the repository and open `web/index.html` in your browser. No build process or dependencies required.

```bash
git clone htts：//github.com/JobYu/pixel-art-converter.git
```

## Version

Current version: v1.0.1

- Added CSS media query to hide the original image container on mobile screens (width <= 768px)
- Adjusted the result container to take full width and provide better height utilization
- Improved mobile viewing experience by focusing on the converted result

v1.0.0

- Easy-to-use interface
- Real-time preview
- Adjustable pixel block size (2-10 pixels)
- Customizable color palette (2-64 colors)
- Download results as PNG
- No installation required - works in browser


## License

Copyright © 2024 [32comic.com](https://32comic.com). All rights reserved.

## Acknowledgments

Thanks to [Pixel It](https://github.com/giventofly/pixelit) for the inspiration.
