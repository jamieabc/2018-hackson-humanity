THis is for 2018 Hackson in Humanity

This repository uses browser to record voice, transcript by Google speech and send text to slack.

Usage: node app.js

URL: http://localhost:8080

Some fields need to fill in `app.js`: `apiKey`, `audio.uri`, `slack server url`.

By default, audio file will be saved into `${HOME}/Downloads/output.wav`, converted file will be `output.flac` and upload to google cloud bucket.
