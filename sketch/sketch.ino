// SPDX-FileCopyrightText: Copyright (C) Arduino s.r.l. and/or its affiliated companies
//
// SPDX-License-Identifier: MPL-2.0
//
// Combined UNO Q MCU sketch: receives sound-detection events from the
// Python (MPU) side over the Bridge and drives an LCD, vibration motor,
// and status LEDs. Replaces the old Serial-command version — since
// everything lives on ONE board, Bridge.call() replaces the USB serial
// link entirely.

#include <Arduino_RouterBridge.h>
#include <LiquidCrystal.h>

// ---------- LCD (RS, E, D4, D5, D6, D7) ----------
LiquidCrystal lcd(8, 7, 6, 5, 4, 2);

// ---------- Outputs ----------
const int VIBRO_PIN     = 9;
const int NAME_LED      = 10;
const int BABY_LED      = 11;
const int TRAFFIC_LED   = 12;
const int EMERGENCY_LED = 13;

void setup() {
  Serial.begin(9600);

  lcd.begin(16, 2);
  lcd.clear();
  lcd.print("Waiting...");

  pinMode(VIBRO_PIN, OUTPUT);
  pinMode(NAME_LED, OUTPUT);
  pinMode(BABY_LED, OUTPUT);
  pinMode(TRAFFIC_LED, OUTPUT);
  pinMode(EMERGENCY_LED, OUTPUT);
  turnEverythingOff();

  Bridge.begin();
  // Python calls: Bridge.call("sound_detected", label)
  Bridge.provide("sound_detected", handle_sound);

  Serial.println("Ready!");
}

void loop() {
  // Nothing to poll — Bridge callbacks fire asynchronously.
}

// Called directly by main.py's on_sound_detected() via the Bridge.
// label is one of: "baby", "ambulance", "traffic", "firetruck",
// "glass", "name_call".
void handle_sound(String label) {
  Serial.print("Detected: ");
  Serial.println(label);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Detected:");
  lcd.setCursor(0, 1);
  lcd.print(label);

  if (label == "name_call") {
    digitalWrite(NAME_LED, HIGH);
    pulseVibro(5, 500);
  }
  else if (label == "baby") {
    digitalWrite(BABY_LED, HIGH);
    pulseVibro(12, 200);
  }
  else if (label == "traffic") {
    digitalWrite(TRAFFIC_LED, HIGH);
    pulseVibro(5, 400);
  }
  else if (label == "ambulance" || label == "firetruck") {
    // treated as "emergency" — matches URGENT_SOUNDS in the web UI
    digitalWrite(EMERGENCY_LED, HIGH);
    digitalWrite(VIBRO_PIN, HIGH);
    delay(5000);
    digitalWrite(VIBRO_PIN, LOW);
  }
  else {
    Serial.println("Unknown label");
  }

  delay(3000); // keep the message on screen long enough to read
  turnEverythingOff();
  lcd.clear();
  lcd.print("Waiting...");
}

void pulseVibro(int times, int ms) {
  for (int i = 0; i < times; i++) {
    digitalWrite(VIBRO_PIN, HIGH);
    delay(ms);
    digitalWrite(VIBRO_PIN, LOW);
    delay(ms);
  }
}

void turnEverythingOff() {
  digitalWrite(VIBRO_PIN, LOW);
  digitalWrite(NAME_LED, LOW);
  digitalWrite(BABY_LED, LOW);
  digitalWrite(TRAFFIC_LED, LOW);
  digitalWrite(EMERGENCY_LED, LOW);
}
