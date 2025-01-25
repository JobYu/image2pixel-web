# Pixel Art Converter

![Image2pixel](web/Image2pixel.png)

A simple web-based tool that converts images into pixel art style. 

## Features

- Easy-to-use interface
- Real-time preview
- Adjustable pixel block size (2-10 pixels)
- Customizable color palette (2-64 colors)
- Download results as PNG
- No installation required - works in browser

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

Current version: v1.0.0

## License

Copyright © 2024 [32comic.com](https://32comic.com). All rights reserved.

## Acknowledgments

Thanks to [Pixel It](https://github.com/giventofly/pixelit) for the inspiration.
