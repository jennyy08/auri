# SPDX-FileCopyrightText: Copyright (C) Arduino s.r.l. and/or its affiliated companies
#
# SPDX-License-Identifier: MPL-2.0
from arduino.app_utils import *
from arduino.app_bricks.web_ui import WebUI
from arduino.app_bricks.audio_classification import AudioClassification
from arduino.app_bricks.cloud_asr import CloudASR, CloudProvider
import threading
import time

# Global state matching the sample structure
last_detected = "None"

# Settings state driven by the customize screen
user_name = ""
haptics_enabled = True
lights_enabled = True
active_space_name = "home"
notify_level_label = "all sounds"
emergency_enabled = True


def get_audio_status():
    """Get current Audio status for API matching the layout pattern."""
    is_on = last_detected != "None"
    return {
        "led_is_on": is_on,
        "status_text": f"Detected: {last_detected.upper()}",
        # raw label so the frontend can display it directly, instead of
        # parsing it back out of status_text
        "label": last_detected if is_on else "",
    }


def get_app_state():
    """Everything the customize screen needs to hydrate on connect."""
    return {
        "userName": user_name,
        "haptics": haptics_enabled,
        "lights": lights_enabled,
        "activeSpaceName": active_space_name,
        "notifyLevelLabel": notify_level_label,
        "emergencyEnabled": emergency_enabled,
    }


def on_sound_detected(label):
    """Callback function triggered when the AI model detects a sound."""
    global last_detected
    last_detected = label
    print(f"[AI Event] Detected: {label}")

    # Call a function in the sketch to control physical LEDs/Buzzers on the MCU
    Bridge.call("sound_detected", label)

    # Send updated status to all connected clients matching the template channel
    ui.send_message('led_status_update', get_audio_status())


def on_get_initial_state(client, data):
    """Handle client request for initial state on connect."""
    ui.send_message('led_status_update', get_audio_status(), client)
    ui.send_message('initial_state', get_app_state(), client)


def on_set_user_name(client, data):
    global user_name
    user_name = data.get('name', '')
    print(f"[Settings] user_name = {user_name!r}")


def on_set_haptics(client, data):
    global haptics_enabled
    haptics_enabled = bool(data.get('enabled', True))
    print(f"[Settings] haptics_enabled = {haptics_enabled}")
    # TODO: forward to the MCU if haptics are actually driven by the sketch,
    # e.g. Bridge.call("set_haptics", haptics_enabled)


def on_set_lights(client, data):
    global lights_enabled
    lights_enabled = bool(data.get('enabled', True))
    print(f"[Settings] lights_enabled = {lights_enabled}")
    # TODO: forward to the MCU if lights are actually driven by the sketch,
    # e.g. Bridge.call("set_lights", lights_enabled)


listening_flag = threading.Event()  # tracks whether a session is currently active


def name_listen_session():
    """Runs once per 'start_listening' click, in its own thread so it
    doesn't block the WebUI message loop. Streams every ASR event
    (speech_start, partial_text, text, speech_stop) to the UI as it
    happens, and checks each finalized 'text' event against the saved
    name.

    Ends when the stream naturally stops (silence timeout / duration),
    or when on_stop_listening() calls asr.cancel().
    """
    listening_flag.set()
    ui.send_message('asr_transcript', {"eventType": "session_start", "text": ""})

    last_match_at = 0.0
    match_cooldown_seconds = 2.0  # avoid re-firing on_sound_detected repeatedly for one utterance

    try:
        name = user_name.strip().lower()
        with asr.transcribe_stream(duration=120.0) as events:
            for event in events:
                print(f"[ASR event] {event.type}: {event.data!r}")
                ui.send_message('asr_transcript', {
                    "eventType": event.type,
                    "text": event.data or "",
                })

                if event.type == "text" and event.data:
                    heard = event.data.strip()
                    if name and name in heard.lower():
                        now = time.time()
                        if now - last_match_at > match_cooldown_seconds:
                            last_match_at = now
                            on_sound_detected("name_call")
    except Exception as e:
        print(f"[ASR] session error: {e}")
        ui.send_message('asr_transcript', {"eventType": "error", "text": str(e)})
    finally:
        listening_flag.clear()
        ui.send_message('asr_transcript', {"eventType": "session_end", "text": ""})


def on_start_listening(client, data):
    if listening_flag.is_set():
        return  # already running — ignore duplicate clicks
    if not user_name.strip():
        ui.send_message('asr_transcript', {"eventType": "error", "text": "Set your name first."})
        return
    threading.Thread(target=name_listen_session, daemon=True).start()


def on_stop_listening(client, data):
    if listening_flag.is_set():
        asr.cancel()


# Initialize WebUI
ui = WebUI()

# Handle socket messages mirroring the sample framework
ui.on_message('get_initial_state', on_get_initial_state)
ui.on_message('set_user_name', on_set_user_name)
ui.on_message('set_haptics', on_set_haptics)
ui.on_message('set_lights', on_set_lights)
ui.on_message('start_listening', on_start_listening)
ui.on_message('stop_listening', on_stop_listening)

# Initialize Audio Classifier (Strictly zero arguments for the native block)
spotter = AudioClassification()
classes = ["baby", "ambulance", "traffic", "firetruck", "glass"]

# Initialize Cloud ASR for the button-triggered live transcription.
# language is read from Brick Configuration (LANGUAGE env var).
# Using Google Speech here — OpenAI's realtime transcription (the default
# provider) currently fails with `beta_api_shape_disabled`: OpenAI retired
# the old Realtime Beta endpoint on 2026-05-12 and this brick's OpenAI
# provider hasn't been updated to the GA API shape yet. Swap back to
# CloudProvider.OPENAI_TRANSCRIBE once Arduino ships a fix.
# Note: this needs its own API_KEY set in Brick Configuration — a Google
# Cloud Speech-to-Text key, not your OpenAI key.
#
# CAUTION: this brick and `spotter` (AudioClassification) both try to
# hold the microphone. spotter listens continuously; asr only grabs it
# while a session is active (button pressed). If sound classification
# goes quiet while listening for a name, or the ASR session can't get
# any audio, that's mic contention — the two bricks fighting over
# exclusive access to the same physical device.
asr = CloudASR(provider=CloudProvider.GOOGLE_SPEECH)


def make_callback(sound_label):
    # NOTE: this brick's on_detect() strictly enforces a zero-argument
    # callback (raises ValueError("Callback must not accept any arguments.")
    # otherwise), so confidence/raw audio aren't retrievable here.
    return lambda: on_sound_detected(sound_label)


for sound_class in classes:
    spotter.on_detect(sound_class, make_callback(sound_class))

# Start the application natively
App.run()
