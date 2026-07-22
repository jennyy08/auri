# AURI

AURI is a hardware-focused project that combines an Arduino Uno Q, a Python sound-detection layer, and a web-based customization interface. The system reacts to important sounds and gives immediate feedback through LEDs, vibration, and an LCD display.

## What it does

- Detects sounds such as a baby crying, ambulance or firetruck sirens, traffic noise, glass breaking, and a named voice trigger
- Sends detection events from Python to the Arduino board
- Controls physical outputs on the board:
  - vibration motor
  - LEDs
  - LCD display
- Provides a phone-style web app for customizing settings such as name, haptics, lights, and emergency preferences

## Project components

- Arduino firmware: [sketch/sketch.ino](sketch/sketch.ino)
- Python bridge: [python/main.py](python/main.py)
- Web app: [src](src)

## Hardware

This project is designed for an Arduino Uno Q with the following outputs connected:

- LCD screen
- vibration motor
- LEDs
- USB connection to a computer or host device

## Getting started

### 1. Install the web app dependencies

```bash
npm install
```

### 2. Run the frontend

```bash
npm run dev
```

Then open the local URL shown in the terminal.

### 3. Upload the Arduino sketch

Open [sketch/sketch.ino](sketch/sketch.ino) in the Arduino IDE and upload it to your Arduino Uno Q.

### 4. Run the Python bridge

Run the Python script in [python/main.py](python/main.py) using the environment that supports your Arduino bridge and audio libraries.

## Notes

- The web app is the configuration and feedback interface for the hardware experience.
- The Arduino board handles the immediate physical response.
- The Python script is responsible for sound detection and communication with the hardware.

## Future ideas

- Add real emergency SMS or call automation
- Support more sound classes
- Improve the physical prototype and enclosure
- Make the experience more polished for demos and presentations
