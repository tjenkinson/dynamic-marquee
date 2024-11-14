#!/bin/bash

# Exit on any error
set -e

# Functions for better readability
install_dependencies() {
    echo "Installing main dependencies..."
    npm ci
}

link_package() {
    echo "Linking package..."
    if ! npm link &> /dev/null; then
        echo "Failed to link package. Exiting."
        exit 1
    fi
}

build_package() {
    echo "Building main package..."
    npm run build
}

setup_demo() {
    echo "Setting up demo environment..."
    cd demo
    npm install
    npm link dynamic-marquee  # Link the main package in the demo environment
    npm run build
}

# Run the functions in sequence
install_dependencies
link_package
build_package
setup_demo

echo "Done!"
