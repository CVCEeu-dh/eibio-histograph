/*
  Shared tasks for index.js script
  node index.js --task=
*/

var  exectimer  = require('exectimer');


module.exports = {
  tick: {
    start: function(options, callback) {
      options.__tick = new exectimer.Tick("TIMER");
      console.log(clc.yellowBright('\n   tasks.helpers.tick.start'));
      options.__tick.start()
      callback(null, options)
    },
    end: function(options, callback) {
      console.log(clc.yellowBright('\n   tasks.helpers.tick.end'));
      options.__tick.stop();
      console.log(clc.blackBright("   It took: "), exectimer.timers.TIMER.duration()/1000000000);
      callback(null, options)
    },
  },
  
  
  prompt: {
    confirm: function(options, callback) {
      inquirer.prompt([{
        type: 'confirm',
        name: 'YN',
        message: ' Press enter to continue, otherwise exit by typing "n"',
      }], function( answers ) {
          // Use user feedback for... whatever!! 
        if(answers.YN)
          callback(null, options)
        else
          callback('exit on prompt')
      });
    }
  },
}