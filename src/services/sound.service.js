// import { Howl, Howler } from 'howler';
import { Howl } from 'howler';
import Speech from 'speak-tts';

import randomService from './random.service';

const words = {
  turn: [
    '[name] is up',
    "[name] it's on you",
    "[name]! It's your play",
    '[name]. go ahead',
    '[name]. I want to see a Yahtzee this time.',
    "[name]. it's all you",
    '[name]. Time for a Yahtzee!',
    '[name]. you can go',
    '[name]. your go',
    '[name]. your play',
    '[name]. your move',
    '[name]. your roll',
    "[name]'s turn",
    "[name]'s roll",
    "[name]'s play",
    "[name]'s go",
    'Best of luck [name].',
    'Go ahead [name].',
    'Good luck [name].',
    "Let's see what you got [name].",
    "I want to see some good dice throwin' [name].",
    '[name]. Best of luck.',
    '[name]. Go ahead.',
    '[name]. Good luck.',
    '[name]. You got this!',
    "Let's go [name]. I bet you can do better than that last roll.",
    'Here we go [name]. Can you do better than that last turn?',
    "Yikes. Did you see that [name]? Let's get some big points.",
    "Oh man. That's gonna hurt. [name], your go",
    'Oh man. Here we go. [name], your turn',
    "Oh man. That's gonna sting a bit. Here we go [name].",
    'Oh snap! [name], your turn',
    'Oh snap! [name], your go',
    "Oh snap! [name], Let's do it",
    '[name] Your go. Big Money! No whammies!',
    '[name] Your go. Big Money! No whammies! Big Money! No whammies!',
    "It's all you [name].",
    "It's Yahtzee time [name]!",
    "[name]! The name of the game is Yahtzee. Let's make it happen.",
    "[name]! Yahtzee is the name of the game. Let's go!",
    'Three Cheers for [name]. [name], [name], [name]!',
    "Let's here it for [name]. [name], [name], [name]!",
    "It's your move [name].",
    "It's your play [name].",
    "It's your roll [name].",
    '[name]. Show me a Yahtzee!',
    "[name]. Let's see a Yahtzee!",
    '[name]. I wanna see a Yahtzee!',
    'You can go [name].',
    "You're up [name].",
    'your go [name].',
    'Your move [name].',
    'Your play [name].',
    'Your roll [name].',
  ],
  turnSmart: null,
};

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
  initSmartArrays() {
    if (!words.turnSmart) {
      words.turnSmart = randomService.convertArrayToSmartArray(words.turn);
    }
    console.log(words.turnSmart);
  },
  sayWhosTurnItIs(name) {
    this.initSmartArrays();
    let sayThis = randomService.smartChoice(words.turnSmart);
    // console.log(sayThisSmart);

    // let sayThis = randomService.choice(words.turn);
    sayThis = sayThis.replace(/\[name\]/g, name);
    console.log(sayThis);
    this.say(sayThis);
  },
  say(text) {
    const speech = new Speech(); // will throw an exception if not browser supported
    if (speech.hasBrowserSupport()) {
      // returns a boolean
      console.log('speech synthesis supported');
    }
    speech
      .init({
        volume: 1,
        voice: 'Google UK English Male',
      })
      .then((data) => {
        // The "data" object contains the list of available voices and the voice synthesis params
        console.log('Speech is ready, voices are available', data);
        speech
          .speak({
            text,
          })
          .then(() => {
            console.log('Success !');
          })
          .catch((e) => {
            console.error('An error occurred :', e);
          });
      })
      .catch((e) => {
        console.error('An error occurred while initializing : ', e);
      });
  },
};
