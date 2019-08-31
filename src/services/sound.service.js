// import { Howl, Howler } from 'howler';
import { Howl } from 'howler';
import Speech from 'speak-tts';

export default {
  playSound(soundCode) {
    const sound = new Howl({
      src: `assets/sounds/${soundCode}.mp3`,
      // onloaderror(e) {
      //   console.log('onloaderror', e);
      // },
      // onplayerror(e) {
      //   console.log('onplayerror', e);
      // },
    });
    sound.play();
  },
  say(text) {
    const speech = new Speech(); // will throw an exception if not browser supported
    if (speech.hasBrowserSupport()) { // returns a boolean
      // console.log('speech synthesis supported');
    }
    speech.init({
      volume: 1,
      voice: 'Google UK English Male',
    }).then((data) => {
      // The "data" object contains the list of available voices and the voice synthesis params
      // console.log('Speech is ready, voices are available', data);
      speech.speak({
        text,
      }).then(() => {
        // console.log('Success !');
      // }).catch((e) => {
      //   console.error('An error occurred :', e);
      });
    // }).catch((e) => {
    //   console.error('An error occured while initializing : ', e);
    });
  },
};
