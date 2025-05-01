#!/bin/bash

# Docker image építése kifejezetten Linux/amd64 platformra
echo "Building Docker image for Linux/amd64 platform..."
docker build --platform linux/amd64 -t hw-demo-app:amd64 .

# Ellenőrizzük az eredményt
if [ $? -eq 0 ]; then
  echo "Build successful! Image created: hw-demo-app:amd64"
  
  # Opcionális: image exportálása fájlba
  echo "Exporting image to hw-demo-app-amd64-image.tar..."
  docker save -o hw-demo-app-amd64-image.tar hw-demo-app:amd64
  
  echo "You can now run the container with:"
  echo "docker run -d -p 3002:3000 --name hw-demo-container hw-demo-app:amd64"
else
  echo "Build failed! Please check the error messages above."
fi 