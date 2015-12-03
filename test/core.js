/*
  
  Testing settings, like neo4j connections
  ===
  test with 
  
  mocha -g 'settings:'

*/
'use strict';


var settings = require('../settings'),
    _        = require('lodash'),
    should  = require('should');

describe('settings:neo4j connections', function() {
  var eibio      = require('seraph')(settings.neo4j.eibio.host),
      histograph = require('seraph')(settings.neo4j.histograph.host);

  it('should get a valid response from the eibio neo4j server', function (done) {
    eibio.query('MATCH (n:activity) RETURN n LIMIT 1', function (err, nodes) {
      should.not.exist(err)
      should.exist(_.first(nodes).slug)
      done();
    });
  });

  it('should get a valid response from the histograph neo4j server', function (done) {
    histograph.query('MATCH (n:person)-[:appears_in]->(res:resource) RETURN n LIMIT 1', function (err, nodes) {
      should.not.exist(err)
      should.exist(_.first(nodes).name)
      done();
    })
  })

})