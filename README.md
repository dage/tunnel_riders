# Tunnel Riders

A 3D space tunnel racing game built with Three.js.

## Current Status

This is an early prototype implementation based on the game specifications. Currently, it includes:

- A procedurally generated 3D tunnel
- Animation that gives the impression of flying through the tunnel
- Dynamic tunnel generation with varying shapes and colors

## How to Run

1. Clone this repository
2. Open `index.html` in a modern web browser
3. No additional setup or build process is required

## Technical Implementation

- The tunnel is created using a series of Three.js TorusGeometry objects
- Animation is handled using requestAnimationFrame
- The tunnel procedurally regenerates as you fly through it, creating an endless experience

## Next Steps

Future development will include:
- Player ship controls
- Enemy types (monsters and rival spaceships)
- Combat mechanics with weapons
- Upgrade system 