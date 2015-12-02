/*

  EIBIO-to-HG config file
  ===

*/
module.exports = {
  
  neo4j : { // v.2.2
    eibio: {
      host : {
        server: 'http://localhost:9999',
        user: 'eibio',
        pass: '**************'
      }
    },
    histograph: {
      host : {
        server: 'http://localhost:7465',
        user: 'histograph',
        pass: '**************'
      }
    }
  },
};