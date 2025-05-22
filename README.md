# image2pixel

A web-based tool that converts regular images into pixel art with customizable settings.

| Original | Result |
|----------|--------|
| ![Original 1](web/o1.PNG) | ![Result 1](web/r1.PNG) |
| ![Original 2](web/o2.PNG) | ![Result 2](web/r2.PNG) |
| ![Original 3](web/o3.png) | ![Result 3](web/r3.PNG) |

## Version

Current version: v1.0.3

- Added support for images with transparency (alpha channel)

v1.0.2

- Added grid display feature
- Improved download button interaction

v1.0.1

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

### Technical Details

#### Background Color Detection
- Samples corners of the image to determine background color
- Calculates average RGB values for consistent detection

#### Anti-Aliasing Removal Algorithm
- Uses color distance comparison
- Default threshold: 30 (adjustable)
- Replaces similar colors with exact background color

#### Image Scaling
- Dynamic scaling based on input dimensions
- Preserves aspect ratio
- Uses nearest-neighbor scaling for pixel-perfect results

## How to Use

1. Upload an image using the file input
2. Adjust settings:
   - Block Size: Controls pixel size
   - Color Count: Sets the number of colors in the final image
3. The image will be automatically processed with:
   - Scaled dimensions (if needed)
   - Pixel blocking
   - Color quantization
   - Anti-aliasing removal
4. Download the result using the save button

## Desktop Version on Steam

A desktop version of this pixel art generator is now available on Steam! Built on the same algorithm, the desktop application offers additional features and convenience.

**[Image2pixel-PixelArtGenerator on Steam](https://store.steampowered.com/app/3475120)**

If you enjoy this web tool, please consider adding the desktop version to your Steam wishlist. Thank you for your support! 🙏

## Technical Requirements

- Modern web browser with HTML5 Canvas support
- JavaScript enabled
- Recommended browsers: Chrome, Firefox, Safari, Edge

## Features

- Easy-to-use interface
- Real-time preview
- Adjustable pixel block size (2-10 pixels)
- Customizable color palette (2-64 colors)
- Download results as PNG
- No installation required - works in browser
- Improved mobile viewing experience

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
git clone htts：//github.com/JobYu/image2pixel-web.git
```

## License

Copyright © 2024 [image2pixel.app](https://image2pixel.app). All rights reserved.

## Acknowledgments

Thanks to [Pixel It](https://github.com/giventofly/pixelit) for the inspiration.
