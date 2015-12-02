/*
  Eibio task fnctions

*/

var settings = require('../settings'),
    neo4j      = require('seraph')(settings.neo4j.eibio.host);

module.exports = {
  getPerson: function(options, callback) {
    console.log(clc.yellowBright('\n   tasks.eibio.getPerson'));
    neo4j.query('MATCH (per:person) WHERE id(per) = {id} WITH per OPTIONAL MATCH (per)-[r]-(t)  RETURN per as person, count(r) as rels', {
      id: +options.id,
    }, function (err, nodes) {
      if(err) {
        callback(err);
        return;
      }
      if(!nodes.length) {
        callback('   Can\'t find any person matching id:'+options.id);
        return
      }
      options.person = nodes[0].person;
      options.records = _.map(nodes, 'person');
      // console.log(options.person)
      console.log(clc.blackBright('   person:', clc.cyanBright(options.person.slug)));
      console.log(clc.blackBright('   this person has', clc.magentaBright(nodes[0].rels), 'relationships'));
      callback(null, options)
    })
  },

  getPeople: function(options, callback) {
    console.log(clc.yellowBright('\n   tasks.eibio.getPeople'));
    neo4j.query('MATCH (per:person) WHERE has(per.slug) WITH per OPTIONAL MATCH (per)-[r]-(t)  RETURN per as person, count(r) as rels SKIP {offset} LIMIT {limit}', {
      offset: options.offset || 0,
      limit: options.limit || 10
    }, function (err, nodes) {
      if(err) {
        callback(err);
        return;
      }
      if(!nodes.length) {
        callback('   Can\'t find any person matching id:'+options.id);
        return
      }
      options.person = nodes[0].person;
      options.records = _.map(nodes, 'person');
      // console.log(options.person)
      console.log(clc.blackBright('   person:', clc.cyanBright(options.person.slug)));
      console.log(clc.blackBright('   this person has', clc.magentaBright(nodes[0].rels), 'relationships'));
      callback(null, options)
    })
  },

  assignMedia: function(options, callback) {
    console.log(clc.yellowBright('\n   tasks.eibio.assignMedia'));
    // console.log(options.dois);

    var q = async.queue(function (doi, nextDoi) {
      console.log(clc.blackBright('   person:', clc.cyanBright(doi.eibio_slug), '      remaining'), q.length());

      neo4j.query('MATCH (per {slug:{eibio_slug}}) WITH per MERGE (med:media {doi: {doi}}) SET med.title={title}, med.links_histograph = {histograph_id} WITH per, med MERGE (per)-[r:has_media]->(med) SET r.tfidf = {tfidf}, r.tf={tf}', doi, function(err) {
        if(err) {
          q.kill();
          callback(err)
          return;
        } else
          nextDoi();
      });
    }, 3);
    q.push(options.dois);
    q.drain = function() {
      callback(null, options)
    };
  }
    
}