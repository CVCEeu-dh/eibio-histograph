/*
  Eibio task fnctions

*/

var settings = require('../settings'),
    neo4j      = require('seraph')(settings.neo4j.eibio.host);

module.exports = {
  getPerson: function(options, callback) {
    console.log(clc.yellowBright('\n   tasks.eibio.getPerson'));
    if(isNaN(options.id) && _.isEmpty(options.slug)) {
      callback('please specify --id or --slug');
      return;
    }
    neo4j.query('MATCH (per:person) WHERE id(per) = {id} OR per.slug = {slug} WITH per OPTIONAL MATCH (per)-[r]-(t)  RETURN per as person, count(r) as rels', {
      id: +options.id,
      slug: options.slug
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
      callback(null, options);
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

  cleanMedia: function(options, callback) {
    console.log(clc.yellowBright('\n   tasks.eibio.cleanMedia'));

    var q = async.queue(function (person, nextPerson) {
      console.log(clc.blackBright('   cleaning media relationship for:', clc.cyanBright(person.slug), '- remaining:'), q.length());

      neo4j.query('MATCH (per:person {slug:{slug}})-[r:has_media]->(med:media) WITH r DELETE r', person, function(err) {
        if(err) {
          q.kill();
          callback(err)
          return;
        } else
          nextPerson();
      });
    }, 1);
    q.push(options.records);
    q.drain = function() {
      callback(null, options)
    };
  },

  assignMedia: function(options, callback) {
    console.log(clc.yellowBright('\n   tasks.eibio.assignMedia'));
    // console.log(options.dois);

    var q = async.queue(function (media, nextMedia) {
      console.log(clc.blackBright('   person:', clc.cyanBright(media.person_slug), '      remaining'), q.length());

      neo4j.query('MATCH (per:person {slug:{person_slug}}) WITH per MERGE (med:media {doi: {doi}}) SET med.title={title}, med.links_cvcehg = {links_cvcehg} WITH per, med MERGE (per)-[r:has_media]->(med) SET r.tfidf = {tfidf}, r.tf={tf}', media, function(err) {
        if(err) {
          q.kill();
          callback(err)
          return;
        } else{
          console.log(clc.blackBright('     assigned:', clc.cyanBright(media.links_cvcehg), '      remaining'), q.length());
          nextMedia();
        }
      });
    }, 1);
    q.push(options.dois);
    q.drain = function() {
      callback(null, options)
    };
  },

  assignHistographLink: function(options, callback){
    console.log(clc.yellowBright('\n   tasks.eibio.assignHistographLink'));
    // console.log(options.dois);

    var q = async.queue(function (cluster, nextCluster) {
      var person = _.first(cluster.value());
      console.log(cluster)

      console.log(clc.blackBright('   person:', clc.cyanBright(person.person_slug), '- link:', clc.greenBright(person.person_cvcehg), '- remaining'), q.length());

      neo4j.query('MATCH (per:person {slug:{person_slug}}) SET per.links_cvcehg={person_cvcehg}', person, function(err) {
        if(err) {
          q.kill();
          callback(err)
          return;
        } else
          nextCluster();
      });
    }, 1);
    q.push(_(options.dois).filter('person_cvcehg').keyBy('person_slug').values());
    q.drain = function() {
      callback(null, options)
    };
  }
    
}