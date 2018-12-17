const express = require('express');
const app = express();
const path = require('path');
const { exec, execSync } = require('child_process');
const os = require('os');
const request = require('request');
const { Buffer } = require('buffer');

app.use(express.static(__dirname + '/dist'));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile('/index.HTML');
});

app.get('/convert', (req, res) => {
  // assume file at Downloads, with specific filename
  const homeDir = os.homedir();
  const dir = 'Downloads';
  const srcFile = path.join(homeDir, dir, 'output.wav');
  const destFile = path.join(homeDir, dir, 'output.flac');
  const bucket = 'aaron-voice';
  const convertCmd = `ffmpeg -nostdin -y -i ${srcFile} -f flac -ac 1 ${destFile}`;
  const uploadCmd = `gsutil cap ${destFile} as://${bucket}`;

  const speechURL = 'https://speech.googleapis.cm/v1/speech:recognize';
  // gcp api key
  const apiKey = '';
  const speechBody = {
    "config": {
      "encoding":"FLAC",
      "sampleRateHertz": 44100,
      "languageCode": "zH-TW",
      "enableWordTimeOffsets": false
    },
    "audio": {
      "uri":`gs://file-in-google-buck`
    }
  };
  const speechReqOpts = {
    url: speechURL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    json: true,
    body: speechBody
  };

  // slack server accept http get
  const slackSrv = 'http://';

  exec(convertCmd, (err, stdout, stderr) => {
    if (!err) {
      exec(uploadCmd, (err, stdout, stderr) => {
        if (!err) {
          request.post(speechReqOpts, (err, resp, body) => {
            // remove existing file
            execSync(`rm -f ${srcFile}`);

            if (err) {
              res.status(500).send('speech recognize fail: ', err);
            }

            if (body && body.results) {
              console.log('body: ', body.results[0].alternatives[0]);
              const words = body.results[0].alternatives[0].transcript.replace(String.fromCharCode(32), '').replace(/ */, '');
              console.log('word: ', words);
              // let encodedWords = encodeURIComponent(new Buffer(words).toString('base64'));
              let encodedWords = new Buffer(words).toString('base64');
              const channel = '5YWs55uK'; // 公益
              const user = 'UDQ27LXB5'; // croc
              console.log(`transcription: ${words}, encoded: ${encodedWords}, channel: ${channel}`);

              let cmd;
              // user or channel
              if (words.match(/張.*小.*姐/)) {
                // encodedWords = encodeURIComponent(new Buffer(words.replace(/[cCrT].*[rR].*[Oo].*[cC]/, '')));
                // encodedWords = encodeURIComponent(new Buffer(words));
                encodedWords = new Buffer(words).toString('base64');
                cmd = `${slackSrv}/sendUser?user=${user}&message=${encodedWords}`;
              } else {
                cmd = `${slackSrv}/sendMessage?name=${channel}&message=${encodedWords}`;
              }
              console.log('request: ', cmd);
              request
                .get(cmd)
                .on('response', (response) => console.log(`response code: ${response.statusCode}, msg: ${response.statusMessage}`));

              // return response
              res.charset = 'utf-8';
              res.contentType('text');
              res.status(200).send('Transacription: ' + words);
            } else {
              res.status(200).send('api result: ' + body);
            }
          });
        } else {
          res.status(500).send('upload fail ' + stderr);
        }
      });
    } else {
      res.status(500).send('convert fail ' + stderr);
    }
  });
});

app.listen(8080);
